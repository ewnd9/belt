'use strict';

const shellEscape = require('any-shell-escape');
const chalk = require('chalk');

module.exports = {
  log
};

function log(args) {
  console.log(`${chalk.green('$')} ${shellEscape(args)}`);
}
