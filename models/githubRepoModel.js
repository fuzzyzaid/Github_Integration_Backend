const mongoose = require("mongoose");

const GithubRepoSchema = new mongoose.Schema({
 username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  repoName: { type: String, required: true },
  data: { type: Object, required: true }
});

module.exports = mongoose.model("GithubRepo", GithubRepoSchema, "github_repos");