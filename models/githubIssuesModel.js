const mongoose = require("mongoose");

const GithubIssuesSchema = new mongoose.Schema({
 username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  issueNumber: { type: Number, required: true },
  data: { type: Object, required: true }
}, );

module.exports = mongoose.model("GithubIssues", GithubIssuesSchema,"github_issues");