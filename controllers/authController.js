require("dotenv").config();
const axios = require("axios");
const GithubIntegration = require("../models/githubIntegrationModel");
const { syncGithubData } = require("./githubDataController");
const { encryptToken } = require("../helpers/encryptionHelper");

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_API = "https://api.github.com/user";

// Redirect User to GitHub Login
const redirectToGithub = (req, res) => {
  const redirectUrl = `${GITHUB_AUTHORIZE_URL}?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_AUTHORIZATION_CALLBACK_URL}&scope=repo read:org user`;
  return res.redirect(redirectUrl);
};

// GitHub Callback
const githubCallback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ message: "Authorization code missing" });

  try {
    // Exchange code for Access Token
    const tokenResponse = await axios.post(
      GITHUB_TOKEN_URL,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_AUTHORIZATION_CALLBACK_URL
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) return res.status(400).json({ message: "Failed to get GitHub token" });

    // Fetch GitHub Profile
    const userResponse = await axios.get(GITHUB_USER_API, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubUser = userResponse.data;

    // Encrypt token
    const encToken = encryptToken(accessToken);

    // Save to DB
    await GithubIntegration.findOneAndUpdate(
      { userId: githubUser.id },
      {
        username: githubUser.login,
        avatar: githubUser.avatar_url,
        accessTokenEnc: encToken,
        connectedAt: new Date(),
        oauthClientId: process.env.GITHUB_CLIENT_ID,
        lastValidatedAt: new Date()
      },
      { upsert: true, new: true }
    );

   // await syncGithubData({ body: { username: githubUser.login } }, { json: () => {} });

    // Redirect to Angular with username
    return res.redirect(`http://localhost:4200/integration/connect?status=success&user=${githubUser.login}`);
  } catch (err) {
    console.error("OAuth Error:", err);
    return res.redirect(`http://localhost:4200/integration/connect?status=failed`);
  }
};

module.exports = { redirectToGithub, githubCallback };