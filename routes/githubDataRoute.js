const express = require("express");
const router = express.Router();
const { queryCollection } = require("../controllers/queryCollectionController");
const {syncGithubData } =require("../controllers/githubDataController");


router.get("/data", queryCollection);
router.post("/resync", syncGithubData);

module.exports = router;