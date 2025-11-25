// helpers/githubHelper.js
const axios = require('axios');

const API = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});

// Generic first-page fetcher (per_page=100, page=1)
async function firstPage(url, token, extraParams = {}) {
  const resp = await API.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, page: 1, ...extraParams }
  });
  return resp.data || [];
}

// Generic remaining-pages fetcher (page=2..n)
async function remainingPages(url, token, extraParams = {}) {
  const all = [];
  let page = 2;

  while (true) {
    const resp = await API.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: { per_page: 100, page, ...extraParams }
    });

    if (!resp.data || resp.data.length === 0) break;

    all.push(...resp.data);
    page++;
  }

  return all;
}

// -------- orgs --------
const listUserOrgs_FirstPage = (token) => firstPage('/user/orgs', token);
const listUserOrgs_AllPages = (token) => remainingPages('/user/orgs', token);

// -------- repos --------
const listOrgRepos_FirstPage = (token, org) => firstPage(`/orgs/${org}/repos`, token, { sort: 'updated' });
const listOrgRepos_AllPages = (token, org) => remainingPages(`/orgs/${org}/repos`, token, { sort: 'updated' });

// -------- commits --------
const listCommits_FirstPage = (token, org, repo) =>
  firstPage(`/repos/${org}/${repo}/commits`, token);

const listCommits_AllPages = (token, org, repo) =>
  remainingPages(`/repos/${org}/${repo}/commits`, token);

// -------- pulls --------
const listPulls_FirstPage = (token, org, repo) =>
  firstPage(`/repos/${org}/${repo}/pulls`, token, { state: 'all' });

const listPulls_AllPages = (token, org, repo) =>
  remainingPages(`/repos/${org}/${repo}/pulls`, token, { state: 'all' });

// -------- issues --------
const listIssues_FirstPage = (token, org, repo) =>
  firstPage(`/repos/${org}/${repo}/issues`, token, { state: 'all' });

const listIssues_AllPages = (token, org, repo) =>
  remainingPages(`/repos/${org}/${repo}/issues`, token, { state: 'all' });

// -------- issue timeline --------
const listIssueTimeline_FirstPage = (token, org, repo, issueNumber) =>
  firstPage(`/repos/${org}/${repo}/issues/${issueNumber}/timeline`, token);

const listIssueTimeline_AllPages = (token, org, repo, issueNumber) =>
  remainingPages(`/repos/${org}/${repo}/issues/${issueNumber}/timeline`, token);

// -------- org members --------
const listOrgMembers_FirstPage = (token, org) =>
  firstPage(`/orgs/${org}/members`, token);

const listOrgMembers_AllPages = (token, org) =>
  remainingPages(`/orgs/${org}/members`, token);

module.exports = {
  listUserOrgs_FirstPage,
  listUserOrgs_AllPages,

  listOrgRepos_FirstPage,
  listOrgRepos_AllPages,

  listCommits_FirstPage,
  listCommits_AllPages,

  listPulls_FirstPage,
  listPulls_AllPages,

  listIssues_FirstPage,
  listIssues_AllPages,

  listIssueTimeline_FirstPage,
  listIssueTimeline_AllPages,

  listOrgMembers_FirstPage,
  listOrgMembers_AllPages
};
