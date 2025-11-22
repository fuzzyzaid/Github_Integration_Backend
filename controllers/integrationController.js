const GithubIntegration = require("../models/githubIntegrationModel");

const checkIntegrationStatus = async (req, res) => {
  try {
    const record = await GithubIntegration.findOne({});
    if (!record) return res.json({ connected: false });

    return res.json({
      connected: true,
      username: record.username,
      connectedAt: record.connectedAt,
      avatar: record.avatar
    });
  } catch (error) {
    return res.status(500).json({ message: "Error checking integration" });
  }
};

const removeIntegration = async (req, res) => {
  try {
    await GithubIntegration.deleteMany({});
    return res.json({ message: "Integration removed" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting integration" });
  }
};

module.exports = { checkIntegrationStatus, removeIntegration };
