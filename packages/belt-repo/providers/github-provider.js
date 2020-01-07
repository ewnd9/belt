'use strict';

const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const makeDir = require('make-dir');
const Octokit = require('@octokit/rest');
const execa = require('@belt/tools/modules/execa');

const map = {};

module.exports = {
  getProviderByHostname
};

function getProviderByHostname({ host, token }) {
  if (!map[host]) {
    const api = new Octokit({
      baseUrl: `https://api.${host}`,
      auth: token
    });

    map[host] = new GithubProvider(api);
  }

  return map[host];
}

class GithubProvider {
  constructor(api) {
    this.api = api;
  }

  async getAllProjects({ owner, name }) {
    const parts = owner.split('/');
    const user = await this.api.users.getByUsername({ username: parts[0] });
    const projects = [];

    if (user.data.type === 'User') {
      projects.push(...(await this._getAllUserProjects(parts[0])));
    } else {
      projects.push(...(await this._getAllOrgProjects(parts[0])));
    }

    return projects.filter(project =>
      minimatch(project.full_name, `${owner}/${name}`)
    );
  }

  async cloneProject({ project, output, schema, depth }) {
    const name = project.full_name;
    const repoFsPath = `${output}/${name}`;

    if (fs.existsSync(repoFsPath)) {
      return;
    }

    await makeDir(path.dirname(repoFsPath));
    const cloneUrl = schema === 'ssh' ? project.ssh_url : project.clone_url;

    const args = ['clone', cloneUrl, repoFsPath];

    if (depth) {
      args.push('--depth', depth);
    }

    await execa('git', args, {
      stdio: 'inherit'
    });
  }

  async _getAllOrgProjects(org) {
    const result = [];

    for (let page = 0; ; page++) {
      const { data } = await this.api.repos.listForOrg({
        org,
        page: page + 1,
        per_page: 100
      });

      if (data.length === 0) {
        break;
      }

      result.push(...data);
    }

    return result;
  }

  async _getAllUserProjects(username) {
    const result = [];

    for (let page = 0; ; page++) {
      const { data } = await this.api.repos.listForUser({
        username,
        page: page + 1,
        per_page: 100
      });

      if (data.length === 0) {
        break;
      }

      result.push(...data);
    }

    return result;
  }
}
