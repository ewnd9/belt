'use strict';

const opn = require('opn');
const { log } = require('./helpers');

module.exports = opnProxy;

function opnProxy(url, opts) {
  // sorry windows, it's complex https://github.com/sindresorhus/opn/blob/cfab3f9ba2096b00fef655f454be65b070f49d8a/index.js#L34
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  log([cmd, url]);

  return opn(url, opts);
}
