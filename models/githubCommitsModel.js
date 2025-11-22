const mongoose = require("mongoose");

const GithubCommitsSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  sha: { type: String, required: true, index: true },
  data: { type: Object, required: true }

}, { strict: false });
module.exports = mongoose.model("GithubCommits", GithubCommitsSchema,"github_commits");