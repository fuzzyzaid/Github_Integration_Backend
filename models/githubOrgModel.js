const mongoose = require("mongoose");

const GithubOrgSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true }, 
  data: { type: Object, required: true }
},);

module.exports = mongoose.model("GithubOrg", GithubOrgSchema,"github_orgs");

