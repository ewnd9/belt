'use strict';

const execa = require('belt-tools/modules/execa');
const opn = require('belt-tools/modules/opn');

const gitUrlParse = require('git-url-parse');

module.exports = {
  run
};

async function run({ argv }) {
  const remoteUrl = await execa.stdout('git', ['remote', 'get-url', 'origin']);
  const hash = await execa.stdout('git', ['rev-parse', argv._[0] || 'HEAD']);

  const { resource, owner, name } = gitUrlParse(remoteUrl);
  let url;

  if (resource.includes('github') || resource.includes('gitlab')) {
    url = `http://${resource}/${owner}/${name}/commit/${hash}`;
  } else if (resource.includes('bitbucket') || resource.includes('jira')) {
    url = `http://${resource}/${owner}/${name}/commits/${hash}`;
  }

  opn(url);
}
