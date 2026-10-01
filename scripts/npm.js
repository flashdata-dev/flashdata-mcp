const { execFileSync } = require('node:child_process');

function runNpm(args, options) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run package checks through npm run or npm pack.');
  return execFileSync(process.execPath, [npmCli, ...args], options);
}

module.exports = { runNpm };
