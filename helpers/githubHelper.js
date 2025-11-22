import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
});



export async function listUserOrgs(token) {
  console.log(token)
  const res = await API.get('/user/orgs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100 }
  });
  console.log(res);
  return res.data;
}

export async function listOrgRepos(token, org) {
  const res = await API.get(`/orgs/${org}/repos`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, sort: 'updated' }
  });
  return res.data;
}

export async function listCommits(token, org, repo, page = 1) {
  const res = await API.get(`/repos/${org}/${repo}/commits`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, page }
  });
  return res.data;
}

export async function listPulls(token, org, repo, state = 'all', page = 1) {
  const res = await API.get(`/repos/${org}/${repo}/pulls`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, page, state }
  });
  return res.data;
}

export async function listIssues(token, org, repo, state = 'all', page = 1) {
  const res = await API.get(`/repos/${org}/${repo}/issues`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, page, state }
  });
  return res.data;
}

export async function issueTimeline(token, org, repo, issueNumber, page = 1) {
  const res = await API.get(`/repos/${org}/${repo}/issues/${issueNumber}/timeline`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    },
    params: { per_page: 100, page }
  });
  return res.data;
}

export async function listOrgMembers(token, org, page = 1) {
  const res = await API.get(`/orgs/${org}/members`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { per_page: 100, page }
  });
  return res.data;
}