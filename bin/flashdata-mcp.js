#!/usr/bin/env node
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { createLocalServer, loadLocalConfig } = require('../src/local');

async function main() {
  if (process.argv.includes('--help')) {
    process.stdout.write('FlashData MCP (stdio)\n\nSet FLASHDATA_API_KEY, then run flashdata-mcp.\nOptional: FLASHDATA_DATA_API_URL, FLASHDATA_MANAGEMENT_API_URL, FLASHDATA_REQUEST_TIMEOUT_MS.\nAPI URLs are origins without /v1 or /v2. Queries use your FlashData Credits.\n');
    return;
  }
  if (process.argv.includes('--version')) {
    process.stdout.write(`${require('../package.json').version}\n`);
    return;
  }
  if (process.argv.length > 2) throw new Error('Unsupported arguments. Use --help; configure credentials through the environment.');
  const server = createLocalServer(loadLocalConfig());
  let closing;
  const stop = () => { closing ||= server.close().catch(() => { process.exitCode = 1; }); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  await server.connect(new StdioServerTransport());
}

main().catch(error => {
  // Configuration errors have fixed text. Never print HTTP errors, request objects, or environment values.
  process.stderr.write(`FlashData MCP: ${error.message}\n`);
  process.exitCode = 1;
});
