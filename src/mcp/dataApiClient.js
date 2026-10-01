const axios = require('axios');

const MAX_RESPONSE_BYTES = 4 * 1024 * 1024;

function createDataApiClient({ baseUrl, timeoutMs = 65000, http = axios } = {}) {
  const origin = new URL(baseUrl);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password
    || origin.search || origin.hash || origin.pathname !== '/') {
    throw new TypeError('MCP Data API URL must be an HTTP(S) origin.');
  }
  return {
    async request({ method, path, body, secret, requestId }) {
      let target;
      try { target = new URL(path, origin); } catch { /* Reject invalid destinations before adding credentials. */ }
      if (typeof path !== 'string' || !target || target.origin !== origin.origin
        || target.username || target.password || target.hash) {
        return { status: 400, body: { code: 'invalid_api_path',
          message: 'The request must target the configured API origin without credentials or a fragment.' } };
      }
      try {
        const response = await http.request({
          url: target.href,
          method,
          data: body,
          headers: { 'X-API-Key': secret, 'X-Request-Id': requestId, 'Content-Type': 'application/json' },
          timeout: timeoutMs,
          maxRedirects: 0,
          maxContentLength: MAX_RESPONSE_BYTES,
          maxBodyLength: 256 * 1024,
          responseType: 'json',
          transitional: { silentJSONParsing: false },
          validateStatus: () => true,
          proxy: false,
        });
        if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
          throw new Error('Invalid upstream response');
        }
        return { status: response.status, body: response.data };
      } catch {
        // Never retry a POST: a disconnected client cannot know whether admission already charged it.
        return {
          status: 502,
          body: {
            code: method === 'POST' ? 'query_outcome_unknown' : 'data_api_unavailable',
            message: method === 'POST'
              ? 'The query response could not be read. Work may already have been submitted and charged. Check Jobs in the console before submitting again.'
              : 'The read response could not be retrieved. Retrying this read does not submit or charge a query.',
          },
        };
      }
    },
  };
}

module.exports = { createDataApiClient, MAX_RESPONSE_BYTES };
