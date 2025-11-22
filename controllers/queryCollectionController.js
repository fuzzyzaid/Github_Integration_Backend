const COLLECTION_MAP = {
  github_orgs: require("../models/githubOrgModel"),
  github_repos: require("../models/githubRepoModel"),
  github_commits: require("../models/githubCommitsModel"),
  github_pulls: require("../models/githubPullModel"),
  github_issues: require("../models/githubIssuesModel"),
  github_issue_events: require("../models/githubIssueEventsModel"),
  github_org_members: require("../models/githubOrgMembersModel")
};

const buildSearchQuery = (search) => {
  if (!search) return [];
  return [
    { orgLogin: new RegExp(search, "i") },
    { repoName: new RegExp(search, "i") },
    { "data.name": new RegExp(search, "i") },
    { "data.login": new RegExp(search, "i") },
    { "data.title": new RegExp(search, "i") },
    { "data.body": new RegExp(search, "i") }
  ];
};

const pickSort = (sortBy, sortDir) => {
  if (!sortBy) return { createdAt: -1 };
  const dir = sortDir === "asc" ? 1 : -1;
  if (["orgLogin", "repoName", "createdAt", "updatedAt"].includes(sortBy)) {
    return { [sortBy]: dir };
  }
  return { [`data.${sortBy}`]: dir };
};

const projectFlatten = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, username, orgLogin, repoName, createdAt, updatedAt, data } = obj;
  return { _id, username, orgLogin, repoName, createdAt, updatedAt, ...(data || {}) };
};

const inferFields = (rows) => {
  const keys = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
  ["__v"].forEach(k => keys.delete(k));
  return Array.from(keys);
};

const queryCollection = async (req, res) => {
  try {
    const {
      collection,
      username,
      orgLogin,
      repoName,
      search,
      page = 1,
      pageSize = 50,
      sortBy,
      sortDir = "desc"
    } = req.query;

    if (!collection || !COLLECTION_MAP[collection]) {
      return res.status(400).json({ message: "Invalid collection" });
    }

    if (!username) return res.status(400).json({ message: "username required" });

    const Model = COLLECTION_MAP[collection];
    const filter = { username }; // filter by username
    if (orgLogin) filter.orgLogin = orgLogin;
    if (repoName) filter.repoName = repoName;

    const searchOr = buildSearchQuery(search);
    const finalQuery = searchOr.length ? { $and: [filter, { $or: searchOr }] } : filter;

    const sort = pickSort(sortBy, sortDir);
    const skip = (Number(page) - 1) * Number(pageSize);
    const limit = Math.min(Number(pageSize), 200);

    const [total, docs] = await Promise.all([
      Model.countDocuments(finalQuery),
      Model.find(finalQuery).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const flattened = docs.map(projectFlatten);
    const fields = inferFields(flattened);

    return res.json({
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      sortBy: sortBy || "createdAt",
      sortDir,
      fields,
      rows: flattened
    });
  } catch (error) {
    console.error("queryCollection error:", error);
    return res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { queryCollection };
