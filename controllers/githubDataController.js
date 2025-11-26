// controllers/githubController.js
const GithubOrgModel = require('../models/githubOrgModel.js');
const GithubRepoModel = require('../models/githubRepoModel.js');
const GithubCommitModel = require('../models/githubCommitsModel.js');
const GithubPullModel = require('../models/githubPullModel.js');
const GithubIssuesModel = require('../models/githubIssuesModel.js');
const GithubIssueEventsModel = require('../models/githubIssueEventsModel.js');
const GithubOrgMembersModel = require('../models/githubOrgMembersModel.js');
const GithubIntegration = require('../models/githubIntegrationModel.js');

const { decryptToken } = require('../helpers/encryptionHelper.js');

const {
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
} = require('../helpers/githubHelper.js');

const saveData = async (Model, username, rows, extra = {}, userId = null) => {
  if (!rows || !rows.length) return [];
  const docs = rows.map(r => {
    const doc = {
      username,
      userId,
      data: r,
      ...extra
    };

    if (!doc.repoName && r.name) doc.repoName = r.name; 
    if (!doc.issueNumber && r.number) doc.issueNumber = r.number;
    if (!doc.orgLogin && r.login) doc.orgLogin = r.login;

    return doc;
  });

  return Model.insertMany(docs);
};


async function clearUserData(username, userId) { //clear user data
  await Promise.all([
    GithubOrgModel.deleteMany({ username, userId }),
    GithubRepoModel.deleteMany({ username, userId }),
    GithubCommitModel.deleteMany({ username, userId }),
    GithubPullModel.deleteMany({ username, userId }),
    GithubIssuesModel.deleteMany({ username, userId }),
    GithubIssueEventsModel.deleteMany({ username, userId }),
    GithubOrgMembersModel.deleteMany({ username, userId })
  ]);
}

// Syncing / Resysnc the data from the github API
const syncGithubData = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "username required" });

    const integration = await GithubIntegration.findOne({ username });
    if (!integration) return res.status(404).json({ message: "Integration not found" });

    const token = decryptToken(integration.accessTokenEnc);
    const userId = integration.userId;

    await clearUserData(username, userId);

    // ORGS - fetching first page data
    const orgsFirst = await listUserOrgs_FirstPage(token);
    await saveData(GithubOrgModel, username, orgsFirst, {}, userId);

    // For each org fetch repos (first page) and per-repo first pages of collections
    for (const org of orgsFirst) {

      const reposFirst = await listOrgRepos_FirstPage(token, org.login);
      await saveData(GithubRepoModel, username, reposFirst, { orgLogin: org.login }, userId);

      for (const repo of reposFirst) {
        const commitsFirst = await listCommits_FirstPage(token, org.login, repo.name);
        await saveData(GithubCommitModel, username, commitsFirst,
          { orgLogin: org.login, repoName: repo.name }, userId);

        const pullsFirst = await listPulls_FirstPage(token, org.login, repo.name);
        await saveData(GithubPullModel, username, pullsFirst,
          { orgLogin: org.login, repoName: repo.name }, userId);

        const issuesFirst = await listIssues_FirstPage(token, org.login, repo.name);
        await saveData(GithubIssuesModel, username, issuesFirst,
          { orgLogin: org.login, repoName: repo.name }, userId);

        for (const issue of issuesFirst) {
          const timelineFirst = await listIssueTimeline_FirstPage(token, org.login, repo.name, issue.number);
          await saveData(GithubIssueEventsModel, username, timelineFirst,
            { orgLogin: org.login, repoName: repo.name, issueNumber: issue.number },
            userId);
        }
      }

      const membersFirst = await listOrgMembers_FirstPage(token, org.login);
      await saveData(GithubOrgMembersModel, username, membersFirst, { orgLogin: org.login }, userId);
    }

    res.json({ message: "Initial first-page sync completed. Background sync started." });

    setImmediate(() => backgroundSync(token, username, userId, orgsFirst));

  } catch (err) {
    console.error('syncGithubData error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Background sync
async function backgroundSync(token, username, userId, orgsFirst) {
  try {
    console.log('Background sync started');

    // fetch remaining orgs and save
    const orgsRemaining = await listUserOrgs_AllPages(token);
    if (orgsRemaining && orgsRemaining.length) {
      await saveData(GithubOrgModel, username, orgsRemaining, {}, userId);
    }

    const allOrgs = [...orgsFirst, ...(orgsRemaining || [])];

    for (const org of allOrgs) {
      const reposFirst = await listOrgRepos_FirstPage(token, org.login);
      const reposRemaining = await listOrgRepos_AllPages(token, org.login);

      if (reposRemaining && reposRemaining.length) {
        await saveData(GithubRepoModel, username, reposRemaining, { orgLogin: org.login }, userId);
      }

      const allRepos = [...(reposFirst || []), ...(reposRemaining || [])];

      for (const repo of allRepos) {
        const commitsRemaining = await listCommits_AllPages(token, org.login, repo.name);
        if (commitsRemaining && commitsRemaining.length) {
          await saveData(GithubCommitModel, username, commitsRemaining,
            { orgLogin: org.login, repoName: repo.name }, userId);
        }

        const pullsRemaining = await listPulls_AllPages(token, org.login, repo.name);
        if (pullsRemaining && pullsRemaining.length) {
          await saveData(GithubPullModel, username, pullsRemaining,
            { orgLogin: org.login, repoName: repo.name }, userId);
        }

        const issuesRemaining = await listIssues_AllPages(token, org.login, repo.name);
        if (issuesRemaining && issuesRemaining.length) {
          await saveData(GithubIssuesModel, username, issuesRemaining,
            { orgLogin: org.login, repoName: repo.name }, userId);
        }

        const issuesFirst = await listIssues_FirstPage(token, org.login, repo.name);
        const newIssues = issuesRemaining || [];

        for (const iss of (issuesFirst || [])) {
          const timelineRemaining = await listIssueTimeline_AllPages(token, org.login, repo.name, iss.number);
          if (timelineRemaining && timelineRemaining.length) {
            await saveData(GithubIssueEventsModel, username, timelineRemaining,
              { orgLogin: org.login, repoName: repo.name, issueNumber: iss.number }, userId);
          }
        }

        for (const iss of newIssues) {
          const timelineFirstNew = await listIssueTimeline_FirstPage(token, org.login, repo.name, iss.number);
          if (timelineFirstNew && timelineFirstNew.length) {
            await saveData(GithubIssueEventsModel, username, timelineFirstNew,
              { orgLogin: org.login, repoName: repo.name, issueNumber: iss.number }, userId);
          }
          const timelineRemainingNew = await listIssueTimeline_AllPages(token, org.login, repo.name, iss.number);
          if (timelineRemainingNew && timelineRemainingNew.length) {
            await saveData(GithubIssueEventsModel, username, timelineRemainingNew,
              { orgLogin: org.login, repoName: repo.name, issueNumber: iss.number }, userId);
          }
        }
      } 

      const membersRemaining = await listOrgMembers_AllPages(token, org.login);
      if (membersRemaining && membersRemaining.length) {
        await saveData(GithubOrgMembersModel, username, membersRemaining, { orgLogin: org.login }, userId);
      }
    } 

    console.log('Background sync finished successfully');
  } catch (err) {
    console.error('backgroundSync error:', err);
  }
}

module.exports = { syncGithubData };
