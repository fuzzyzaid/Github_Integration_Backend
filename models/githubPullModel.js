const mongoose = require("mongoose");

const GithubPullSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  data: { type: Object, required: true }
},);
module.exports = mongoose.model("GithubPull", GithubPullSchema,"github_pulls");