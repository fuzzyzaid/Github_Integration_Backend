// CommonJS version

const GithubOrgModel = require('../models/githubOrgModel.js');
const GithubRepoModel = require('../models/githubRepoModel.js');
const GithubCommitModel = require('../models/githubCommitsModel.js');
const GithubPullModel = require('../models/githubPullModel.js');
const GithubIssuesModel = require('../models/githubIssuesModel.js');
const GithubIssueEventsModel = require('../models/githubIssueEventsModel.js');
const GithubOrgMembersModel = require('../models/githubOrgMembersModel.js');
const GithubIntegration = require('../models/githubIntegrationModel.js');

const { decryptToken } = require('../helpers/encryptionHelper.js');


const { listUserOrgs, listOrgRepos, listCommits, listPulls, listIssues, issueTimeline, listOrgMembers } =require('../helpers/githubHelper.js');

// helper to insert into Mongo
const saveData = async (Model, username, rows, extra = {}, userId = null) => {
  if (!rows || rows.length === 0) return [];

  const docs = rows.map(r => {
    const doc = {
      username,
      userId,
      data: r,
      ...extra
    };

    if (!doc.repoName && r.name) doc.repoName = r.name; // repos
    if (!doc.issueNumber && r.number) doc.issueNumber = r.number;

    if (!doc.orgLogin && r.login) doc.orgLogin = r.login;

    return doc;
  });

  return Model.insertMany(docs);
};


const syncGithubData = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "username required" });

    const integration = await GithubIntegration.findOne({ username });
    if (!integration) return res.status(404).json({ message: "Integration not found" });

    const accessToken = decryptToken(integration.accessTokenEnc);
    const userId = integration.userId;

    // 1. ORGS
    const orgs = await listUserOrgs(accessToken);
    await saveData(GithubOrgModel, username, orgs, {}, userId);

    for (const org of orgs) {

      // REPOS
      const repos = await listOrgRepos(accessToken, org.login);
      await saveData(GithubRepoModel, username, repos, { orgLogin: org.login }, userId);

      for (const repo of repos) {

        const commits = await listCommits(accessToken, org.login, repo.name);
        await saveData(GithubCommitModel, username, commits,
          { orgLogin: org.login, repoName: repo.name }, userId);

        const pulls = await listPulls(accessToken, org.login, repo.name);
        await saveData(GithubPullModel, username, pulls,
          { orgLogin: org.login, repoName: repo.name }, userId);

        const issues = await listIssues(accessToken, org.login, repo.name);
        await saveData(GithubIssuesModel, username, issues,
          { orgLogin: org.login, repoName: repo.name }, userId);

        for (const issue of issues) {
          const timeline = await issueTimeline(accessToken, org.login, repo.name, issue.number);
          await saveData(GithubIssueEventsModel, username, timeline,
            { orgLogin: org.login, repoName: repo.name, issueNumber: issue.number },
            userId);
        }
      }

      const members = await listOrgMembers(accessToken, org.login);
      await saveData(GithubOrgMembersModel, username, members, { orgLogin: org.login }, userId);
    }

    res.json({ message: "GitHub sync completed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
module.exports = { syncGithubData };