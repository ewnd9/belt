'use strict';

const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const makeDir = require('make-dir');
const { Gitlab } = require('gitlab');
const execa = require('@belt/tools/modules/execa');

const map = {};

module.exports = {
  getProviderByHostname,
};

function getProviderByHostname({host, token}) {
  if (!map[host]) {
    const api = new Gitlab({
      host: `https://${host}`,
      token
    });

    map[host] = new GitlabProvider(api);
  }

  return map[host];
}

class GitlabProvider {
  constructor(api) {
    this.api = api;
  }

  async getAllProjects({ owner, name }) {
    const parts = owner.split('/');
    const projects = [
      ...(await this.getAllProjectsByGroup(parts[0])),
      ...(await this.getAllProjectsByUser(parts[0])),
    ];

    return projects.filter(project =>
      minimatch(project.path_with_namespace, `${owner}/${name}`)
    );
  }

  async getAllProjectsByGroup(search) {
    const top = (await this.api.Groups.search(search))[0];

    if (!top) {
      return [];
    }

    const nested = await this._getAllNestedGroups(top.id);
    const groups = [top, ...nested];

    return this._getAllGroupProjects(groups);
  }

  async getAllProjectsByUser(search) {
    const user = (await this.api.Users.search(search))[0];

    if (!user) {
      return [];
    }

    return this._getAllUserProjects(user);
  }

  async cloneProject({ project, output, schema, depth }) {
    const name = project.path_with_namespace;
    const repoFsPath = `${output}/${name}`;

    if (fs.existsSync(repoFsPath)) {
      return;
    }

    await makeDir(path.dirname(repoFsPath));
    const cloneUrl =
      schema === 'ssh' ? project.ssh_url_to_repo : project.http_url_to_repo;

    const args = ['clone', cloneUrl, repoFsPath];

    if (depth) {
      args.push('--depth', depth);
    }

    await execa('git', args, {
      stdio: 'inherit'
    });
  }

  async _getAllNestedGroups(parentId, result = []) {
    for (const child of await this.api.Groups.subgroups(parentId)) {
      result.push(child);
      await this._getAllNestedGroups(child.id, result);
    }

    return result;
  }

  async _getAllGroupProjects(groups, result = []) {
    for (const { id } of groups) {
      for (const child of await this.api.Groups.projects(id)) {
        result.push(child);
      }
    }

    return result;
  }

  async _getAllUserProjects(user, result = []) {
    for (const child of await this.api.Users.projects(user.id)) {
      result.push(child);
    }

    return result;
  }
};

