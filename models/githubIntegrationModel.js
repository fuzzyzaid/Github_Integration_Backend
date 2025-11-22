const mongoose = require('mongoose');

const githubIntegrationSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },
  username: { type: String },
  accessToken: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GithubIntegration', githubIntegrationSchema);
