const mongoose = require("mongoose");

const GithubOrgMembersSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userId: { type: String },
  orgLogin: { type: String, required: true },
  data: { type: Object, required: true }
}, );

module.exports = mongoose.model("GithubOrgMember", GithubOrgMembersSchema,"github_org_members");