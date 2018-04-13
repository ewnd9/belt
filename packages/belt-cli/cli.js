#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const Configstore = require('configstore');

// ~/.config/configstore/belt-cli.json
const conf = new Configstore('belt-cli', { modules: [] });
const argv = require('minimist')(process.argv.slice(2), { string: '_' });

if (argv.install) {
  install({ modulePath: argv.install });
} else if (argv.list) {
  printList();
} else if (argv._.length > 0) {
  run({ argv });
} else {
  printList();
}

async function run({ argv }) {
  const commands = getCommands();
  const command = commands[argv._[0]];

  if (!command) {
    throw new Error(`unknown command "${argv._[0]}"`);
  }

  argv._.splice(0, 1);
  const mod = require(command.scriptPath);
  await mod.run({ argv });
}

function printList() {
  const groupBy = require('lodash.groupby');
  const sortBy = require('lodash.sortby');
  const commands = getCommands();

  const groups = Object.entries(groupBy(Object.entries(commands), ([command]) => {
    const parts = command.split(':');
    return parts.length === 1 ? '_' : parts[0];
  }));

  const noPrefix = groups.find(_ => _[0] === '_') || ['_', []];
  const prefixed = sortBy(groups.filter(_ => _[0] !== '_'), '[0]');

  console.log();
  noPrefix[1].forEach(([command, info]) => {
    console.log(`- ${command} (${info.description})`);
  });

  let prevLength = noPrefix[1].length;

  prefixed.forEach(([, commands]) => {
    if (prevLength > 1) {
      console.log();
    }

    commands.forEach(([command, info]) => {
      console.log(`- ${command} (${info.description})`);
    });

    prevLength = commands.length;
  });
}

function install({ modulePath }) {
  const absolutePath = path.resolve(modulePath);
  const pkgPath = `${absolutePath}/package.json`;

  if (!fs.existsSync(pkgPath)) {
    console.error(`${pkgPath} doesn't exist`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  if (!pkg.belt || !pkg.belt.commands) {
    console.error(`"belt.commands" is missing in ${pkgPath}`);
    process.exit(1);
  }

  conf.set('modules', conf.get('modules').concat(pkgPath));
}

function getCommands() {
  const commands = {};

  for (const pkgPath of conf.get('modules')) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    Object.entries(pkg.belt.commands).map(([name, info]) => {
      const scriptPath = `${path.dirname(pkgPath)}/${info.script}`;
      commands[name] = {
        scriptPath,
        description: info.description || '<no-description>'
      }
    });
  }

  return commands;
}
