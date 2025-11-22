const express = require("express");
const router = express.Router();
const { redirectToGithub, githubCallback } = require("../controllers/authController");

router.get("/github", redirectToGithub);
router.get("/github/callback", githubCallback);

module.exports = router;