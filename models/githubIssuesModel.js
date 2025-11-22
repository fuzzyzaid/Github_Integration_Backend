const mongoose = require("mongoose");

const GithubIssuesSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  number: { type: Number, required: true, index: true },
  data: { type: Object, required: true }

}, { strict: false });

module.exports = mongoose.model("GithubIssues", GithubIssuesSchema,"github_issues");