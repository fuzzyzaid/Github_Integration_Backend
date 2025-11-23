const express = require("express");
const router = express.Router();
const { queryCollection } = require("../controllers/queryCollectionController");
const {syncGithubData } =require("../controllers/githubDataController");


// GET /github/data?collection=github_orgs&userId=123&orgLogin=acme&repoName=core&search=fix&page=1&pageSize=50&sortBy=createdAt&sortDir=desc
router.get("/data", queryCollection);
router.post("/resync", syncGithubData);

module.exports = router;