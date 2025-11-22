require("dotenv").config();
const axios = require("axios"); 
const GithubIntegration = require("../models/githubIntegrationModel");

// Redirect user to GitHub OAuth login page
exports.redirectToGithub = (req, res) => {
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_AUTHORIZATION_CALLBACK_URL}&scope=repo read:org user`;
  
  return res.redirect(redirectUrl); // Redirect the user's browser to GitHub for authentication
};

// Callback route to handle GitHub OAuth redirect
exports.githubCallback = async (req, res) => {
  const code = req.query.code; 

  if (!code) {
    return res.status(400).json({ message: "No code provided by GitHub" });
  }

  try {  // Exchange the code for an access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_AUTHORIZATION_CALLBACK_URL
      },
      {
        headers: { Accept: "application/json" }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ message: "Failed to obtain access token" });
    }

    console.log("Access Token" + accessToken);
    // Fetch user info from GitHub API
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const githubUser = userResponse.data;
    console.log("User" + githubUser);

    // Save integration in MongoDB
    const existingIntegration = await GithubIntegration.findOne({ userId: githubUser.id });

    if (existingIntegration) {   // Update token if integration already exists
      existingIntegration.accessToken = accessToken;
      existingIntegration.connectedAt = new Date();
      await existingIntegration.save();
    } 
    else {   // Create new integration record
      const newIntegration = new GithubIntegration({
        userId: githubUser.id,
        username: githubUser.login,
        accessToken: accessToken,
        connectedAt: new Date()
      });
      await newIntegration.save();
    }

    // Redirect to frontend success page
    return res.status(200).json({
        message: "GitHub integration successful",
        user:githubUser
    });
   

  } catch (error) {
    console.error("GitHub OAuth Error:", error.message);
    return res.status(500).json({ message: "GitHub OAuth failed", error: error.message });
  }
};
