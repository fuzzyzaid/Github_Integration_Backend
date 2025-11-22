const mongoose = require('mongoose');

const githubIntegrationSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true },   
  username: { type: String, required: true },
  avatar: { type: String },
  accessTokenEnc: { type: String, required: true },       
  connectedAt: { type: Date, default: Date.now },
  oauthClientId: { type: String, required: true },        
  lastValidatedAt: { type: Date }
});

module.exports = mongoose.model('GithubIntegration', githubIntegrationSchema);