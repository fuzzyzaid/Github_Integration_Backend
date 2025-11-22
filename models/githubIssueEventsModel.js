const mongoose = require("mongoose");

const GithubIssueEventsSchema = new mongoose.Schema({
   username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  issueNumber: { type: Number, required: true },
  data: { type: Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model("GithubIssueEvent", GithubIssueEventsSchema,"github_issue_events");