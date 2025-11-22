const mongoose = require("mongoose");

const GithubOrgSchema = new mongoose.Schema({
  userId: { type: Number, index: true, required: true },
  orgLogin: { type: String, index: true, required: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now, index: true },
}, { strict: false });

module.exports = mongoose.model("GithubOrg", GithubOrgSchema,"github_orgs");

