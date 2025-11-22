import GithubOrgModel from '../models/githubOrgModel.js';
import GithubRepoModel from '../models/githubRepoModel.js';
import GithubCommitModel from '../models/githubCommitsModel.js';
import GithubPullModel from '../models/githubPullModel.js';
import GithubIssuesModel from '../models/githubIssuesModel.js';
import GithubIssueEventsModel from '../models/githubIssueEventsModel.js';
import GithubOrgMembersModel from '../models/githubOrgMembersModel.js';
import GithubIntegration from '../models/githubIntegrationModel.js';
import {decryptToken} from "../helpers/encryptionHelper.js";


import { listUserOrgs, listOrgRepos, listCommits, listPulls, listIssues, issueTimeline, listOrgMembers } from '../helpers/githubHelper.js';

// helper to insert into Mongo
const saveData = async (Model, username, rows, extra={}) => {
  if (!rows || rows.length === 0) return [];
  const docs = rows.map(r => ({ username, data: r, ...extra }));
  return Model.insertMany(docs);
};

export const syncGithubData = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'username required' });

    // Get token from DB
    const integration = await GithubIntegration.findOne({ username });
    if (!integration) return res.status(404).json({ message: 'Integration not found' });

    const accessToken = decryptToken(integration.accessTokenEnc);
  console.log("Helllo 1")

    // 1️Orgs
    const orgs = await listUserOrgs(accessToken);
    await saveData(GithubOrgModel, username, orgs);
    console.log(orgs)

    for (const org of orgs) {
      const repos = await listOrgRepos(accessToken, org.login);
      await saveData(GithubRepoModel, username, repos, { orgLogin: org.login });

      for (const repo of repos) {
        const commits = await listCommits(accessToken, org.login, repo.name);
        await saveData(GithubCommitModel, username, commits, { orgLogin: org.login, repoName: repo.name });

        const pulls = await listPulls(accessToken, org.login, repo.name);
        await saveData(GithubPullModel, username, pulls, { orgLogin: org.login, repoName: repo.name });

        const issues = await listIssues(accessToken, org.login, repo.name);
        await saveData(GithubIssuesModel, username, issues, { orgLogin: org.login, repoName: repo.name });

        for (const issue of issues) {
          const timeline = await issueTimeline(accessToken, org.login, repo.name, issue.number);
          await saveData(GithubIssueEventsModel, username, timeline, { orgLogin: org.login, repoName: repo.name, issueNumber: issue.number });
        }
      }

      const members = await listOrgMembers(accessToken, org.login);
      await saveData(GithubOrgMembersModel, username, members, { orgLogin: org.login });
    }

    res.json({ message: 'GitHub data synced successfully' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
