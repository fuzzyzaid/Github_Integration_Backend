const express = require("express");
const router = express.Router();
const integrationController = require("../controllers/integrationController");

router.get("/status", integrationController.checkIntegrationStatus);
router.delete("/remove", integrationController.removeIntegration);

module.exports = router;
