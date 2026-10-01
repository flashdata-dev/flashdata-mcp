const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { gzipSync } = require('node:zlib');
const { createDataApiClient, MAX_RESPONSE_BYTES } = require('../src/mcp/dataApiClient');
const { createJobApiClient } = require('../src/mcp/jobApiClient');

async function listen(t, handler) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test('API requests reject other origins before sending credentials and never follow redirects', async t => {
  let foreignRequests = 0;
  const foreign = await listen(t, (_req, res) => { foreignRequests++; res.end('{}'); });
  let apiRequests = 0;
  const origin = await listen(t, (req, res) => {
    apiRequests++;
    assert.equal(req.headers['x-api-key'], 'test-fixture-key');
    res.writeHead(302, { location: `${foreign}/capture`, 'content-type': 'application/json' });
    res.end('{}');
  });
  const api = createDataApiClient({ baseUrl: origin });
  for (const path of [`${foreign}/capture`, `${foreign.replace('http:', '')}/capture`,
    `${origin.replace('http://', 'http://user:test-fixture-password@')}/capture`, '/read#fragment']) {
    const result = await api.request({ method: 'GET', path, secret: 'test-fixture-key' });
    assert.equal(result.body.code, 'invalid_api_path');
  }
  assert.equal(apiRequests, 0);
  const redirected = await api.request({ method: 'GET', path: '/redirect', secret: 'test-fixture-key' });
  assert.equal(redirected.status, 302);
  assert.equal(apiRequests, 1);
  assert.equal(foreignRequests, 0);
});

test('job results restrict signed URLs, omit API credentials, reject redirects, and bound decompressed JSON', async t => {
  let foreignRequests = 0;
  const foreign = await listen(t, (_req, res) => { foreignRequests++; res.end('{}'); });
  let resultLocation;
  let storageMode = 'valid';
  const storageHeaders = [];
  const origin = await listen(t, (req, res) => {
    if (req.url.startsWith('/v2/jobs/')) {
      assert.equal(req.headers['x-api-key'], 'test-fixture-key');
      if (req.url.endsWith('/results')) {
        res.writeHead(302, { location: resultLocation });
        return res.end();
      }
      res.setHeader('content-type', 'application/json');
      return res.end(JSON.stringify({ job: { id: 'job_security', status: 'completed', source: 'youtube_transcript' } }));
    }
    storageHeaders.push(req.headers);
    if (storageMode === 'redirect') {
      res.writeHead(302, { location: `${foreign}/capture` });
      return res.end();
    }
    res.setHeader('content-type', 'application/json');
    if (storageMode === 'invalid') return res.end('[]');
    const body = storageMode === 'oversized' ? { text: 'x'.repeat(MAX_RESPONSE_BYTES) } : { text: '字幕😀' };
    res.setHeader('content-encoding', 'gzip');
    res.end(gzipSync(JSON.stringify(body)));
  });
  const client = createJobApiClient({ baseUrl: origin, resultOrigin: origin });
  const read = () => client.read({ jobId: 'job_security', secret: 'test-fixture-key', requestId: 'req_security' });
  for (const location of [`${foreign}/capture`, `${origin}/object#fragment`,
    `${origin.replace('http://', 'http://user:test-fixture-password@')}/object`, 'file:///tmp/result.json']) {
    resultLocation = location;
    assert.equal((await read()).body.code, 'result_unavailable');
  }
  assert.equal(storageHeaders.length, 0);
  resultLocation = `${origin}/object?signature=test-fixture-signature`;
  assert.deepEqual((await read()).body.output, { text: '字幕😀' });
  for (const mode of ['redirect', 'invalid', 'oversized']) {
    storageMode = mode;
    assert.equal((await read()).body.code, 'result_unavailable');
  }
  for (const headers of storageHeaders) {
    assert.equal(headers['x-api-key'], undefined);
    assert.equal(headers.authorization, undefined);
    assert.equal(headers.cookie, undefined);
  }
  assert.equal(foreignRequests, 0);
});
