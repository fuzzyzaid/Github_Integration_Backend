const axios = require('axios');

const API = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});

async function listUserOrgs(token) {
  return (await API.get('/user/orgs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100 }
  })).data;
}

async function listOrgRepos(token, org) {
  return (await API.get(`/orgs/${org}/repos`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, sort: 'updated' }
  })).data;
}

// ------------------- UPDATED -------------------
// Fetch **all commits across all pages**
async function listCommits(token, org, repo) {
  let allCommits = [];
  let page = 1;

  while (true) {
    const commits = (await API.get(`/repos/${org}/${repo}/commits`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page }
    })).data;

    if (!commits.length) break;

    allCommits = allCommits.concat(commits);
    page++;
  }

  return allCommits;
}

// Fetch all pulls (still paginated)
async function listPulls(token, org, repo, state = 'all') {
  let allPulls = [];
  let page = 1;

  while (true) {
    const pulls = (await API.get(`/repos/${org}/${repo}/pulls`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page, state }
    })).data;

    if (!pulls.length) break;

    allPulls = allPulls.concat(pulls);
    page++;
  }

  return allPulls;
}

// Fetch all issues (still paginated)
async function listIssues(token, org, repo, state = 'all') {
  let allIssues = [];
  let page = 1;

  while (true) {
    const issues = (await API.get(`/repos/${org}/${repo}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page, state }
    })).data;

    if (!issues.length) break;

    allIssues = allIssues.concat(issues);
    page++;
  }

  return allIssues;
}

// Fetch issue timeline (paginated)
async function issueTimeline(token, org, repo, issueNumber) {
  let allEvents = [];
  let page = 1;

  while (true) {
    const events = (await API.get(`/repos/${org}/${repo}/issues/${issueNumber}/timeline`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page }
    })).data;

    if (!events.length) break;

    allEvents = allEvents.concat(events);
    page++;
  }

  return allEvents;
}

// Fetch all org members (paginated)
async function listOrgMembers(token, org) {
  let allMembers = [];
  let page = 1;

  while (true) {
    const members = (await API.get(`/orgs/${org}/members`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page }
    })).data;

    if (!members.length) break;

    allMembers = allMembers.concat(members);
    page++;
  }

  return allMembers;
}

module.exports = {
  listUserOrgs,
  listOrgRepos,
  listCommits,
  listPulls,
  listIssues,
  issueTimeline,
  listOrgMembers
};
