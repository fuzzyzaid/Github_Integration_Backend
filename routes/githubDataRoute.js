const express = require("express");
const router = express.Router();
const { queryCollection } = require("../controllers/queryCollectionController");


// GET /github/data?collection=github_orgs&userId=123&orgLogin=acme&repoName=core&search=fix&page=1&pageSize=50&sortBy=createdAt&sortDir=desc
router.get("/data", queryCollection);


module.exports = router;