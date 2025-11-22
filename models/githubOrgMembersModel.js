const mongoose = require("mongoose");

const GithubOrgMembersSchema = new mongoose.Schema({
 userId: { type: Number, required: true, index: true },
  orgLogin: { type: String, required: true },
  memberLogin: { type: String, required: true, index: true },
  data: { type: Object, required: true }

}, { strict: false });

module.exports = mongoose.model("GithubOrgMember", GithubOrgMembersSchema,"github_org_members");