'use strict';

const execa = require('execa');
const { logShell } = require('./log');

module.exports = execaProxy;

// seems cleaner without abstractions
function execaProxy(cmd, args, opts) {
  logShell([cmd, ...args]);
  return execa(cmd, args, opts);
}

execaProxy.stdout = function(cmd, args, opts) {
  logShell([cmd, ...args]);
  return execa.stdout(cmd, args, opts);
};

execaProxy.stderr = function(cmd, args, opts) {
  logShell([cmd, ...args]);
  return execa.stderr(cmd, args, opts);
};

execaProxy.shell = function(cmd, opts) {
  logShell([cmd]);
  return execa.shell(cmd, opts);
};

execaProxy.sync = function(cmd, args, opts) {
  logShell([cmd, ...args]);
  return execa.sync(cmd, args, opts);
};

execaProxy.shellSync = function(cmd, opts) {
  logShell([cmd]);
  return execa.shellSync(cmd, opts);
};
