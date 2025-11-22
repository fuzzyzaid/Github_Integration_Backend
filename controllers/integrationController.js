const axios = require("axios");
const GithubIntegration = require("../models/githubIntegrationModel");
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
    if (!username) return res.status(400).json({ message: "username required" });
    await GithubIntegration.deleteMany({ username });
    return res.json({ message: "Integration removed" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting integration" });
  }
};

module.exports = { checkIntegrationStatus, removeIntegration };