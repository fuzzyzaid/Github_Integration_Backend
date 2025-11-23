const express = require("express");
const router = express.Router();
const integrationController = require("../controllers/integrationController");
const githubDataController  =require("../controllers/githubDataController");

router.get("/status", integrationController.checkIntegrationStatus);
router.post("/remove", integrationController.removeIntegration);
// router.post("/resync", githubDataController.syncGithubData);

module.exports = router;
