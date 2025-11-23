const axios = require("axios");
const GithubOrgModel = require('../models/githubOrgModel.js');
const GithubRepoModel = require('../models/githubRepoModel.js');
const GithubCommitModel = require('../models/githubCommitsModel.js');
const GithubPullModel = require('../models/githubPullModel.js');
const GithubIssuesModel = require('../models/githubIssuesModel.js');
const GithubIssueEventsModel = require('../models/githubIssueEventsModel.js');
const GithubOrgMembersModel = require('../models/githubOrgMembersModel.js');
const GithubIntegration = require('../models/githubIntegrationModel.js');
const { decryptToken } = require("../helpers/encryptionHelper");

const GITHUB_USER_API = "https://api.github.com/user";
const GITHUB_USER_ORGS = "https://api.github.com/user/orgs";


const checkIntegrationStatus = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ connected: false });

    const record = await GithubIntegration.findOne({ username });
    if (!record) return res.json({ connected: false });

    // If client id changed, invalidate
    if (record.oauthClientId !== process.env.GITHUB_CLIENT_ID) {
      await GithubIntegration.deleteOne({ _id: record._id });
      console.log("If client id changed",record._id);
      return res.json({ connected: false });
    }

    // Validate token
    try {
      const token = decryptToken(record.accessTokenEnc);
      await axios.get(GITHUB_USER_API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await GithubIntegration.updateOne({ _id: record._id }, { lastValidatedAt: new Date() });
      return res.json({
        connected: true,
        username: record.username,
        connectedAt: record.connectedAt,
        avatar: record.avatar
      });
    } catch (err) {
      await GithubIntegration.deleteOne({ _id: record._id });
      return res.json({ connected: false });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error checking integration" });
  }
};

const removeIntegration = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'username required' });
    }

    // Find integration to get userId
    const integration = await GithubIntegration.findOne({ username });
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }

    const userId = integration.userId;

    // Delete integration itself
    await GithubIntegration.deleteMany({ username });

    // Delete all related docs by username + userId
    const deletions = await Promise.all([
      GithubOrgModel.deleteMany({ username, userId }),
      GithubRepoModel.deleteMany({ username, userId }),
      GithubCommitModel.deleteMany({ username, userId }),
      GithubPullModel.deleteMany({ username, userId }),
      GithubIssuesModel.deleteMany({ username, userId }),
      GithubIssueEventsModel.deleteMany({ username, userId }),
      GithubOrgMembersModel.deleteMany({ username, userId })
    ]);

    return res.json({
      message: 'Integration and related GitHub data removed',
      deletedCounts: deletions.map((result, i) => result.deletedCount)
    });
  } catch (error) {
    console.error('removeIntegration error:', error);
    return res.status(500).json({ message: 'Error deleting integration and related data' });
  }
};

module.exports = { checkIntegrationStatus, removeIntegration };