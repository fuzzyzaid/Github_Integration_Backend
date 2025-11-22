const mongoose = require("mongoose");

const GithubCommitsSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  data: { type: Object, required: true }
}, { timestamps: true });
module.exports = mongoose.model("GithubCommits", GithubCommitsSchema,"github_commits");