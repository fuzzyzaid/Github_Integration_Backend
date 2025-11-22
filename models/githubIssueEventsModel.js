const mongoose = require("mongoose");

const GithubIssueEventsSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  issueNumber: { type: Number, required: true },
  eventId: { type: Number, required: true, index: true },
  data: { type: Object, required: true }

}, { strict: false });

module.exports = mongoose.model("GithubIssueEvent", GithubIssueEventsSchema,"github_issue_events");