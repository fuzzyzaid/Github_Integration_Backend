const COLLECTION_MAP = {
  github_orgs: require("../models/githubOrgModel"),
  github_repos: require("../models/githubRepoModel"),
  github_commits: require("../models/githubCommitsModel"),
  github_pulls: require("../models/githubPullModel"),
  github_issues: require("../models/githubIssuesModel"),
  github_issue_events: require("../models/githubIssueEventsModel"),
  github_org_members: require("../models/githubOrgMembersModel")
};

// ---------------------- GLOBAL SEARCH ----------------------
const buildSearchQuery = (search) => {
  if (!search) return [];

  return [
    { orgLogin: { $regex: search, $options: "i" } },
    { repoName: { $regex: search, $options: "i" } },
    { "data.name": { $regex: search, $options: "i" } },
    { "data.login": { $regex: search, $options: "i" } },
    { "data.title": { $regex: search, $options: "i" } },
    { "data.body": { $regex: search, $options: "i" } }
  ];
};

// ---------------------- SORTING ----------------------
const pickSort = (sortBy, sortDir) => {
  const dir = sortDir === "asc" ? 1 : -1;

  if (!sortBy) return { createdAt: -1 };
  if (["orgLogin", "repoName", "createdAt", "updatedAt"].includes(sortBy)) {
    return { [sortBy]: dir };
  }

  return { [`data.${sortBy}`]: dir };
};

// ---------------------- FLATTEN JSON ----------------------
const projectFlatten = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const flat = {};

  for (const key in obj) {
    if (key === "data") continue;
    flat[key] = obj[key];
  }

  if (obj.data && typeof obj.data === "object") {
    for (const [key, val] of Object.entries(obj.data)) {
      flat[key] = (val && typeof val === "object")
        ? JSON.stringify(val)
        : val;
    }
  }

  return flat;
};

// ---------------------- GET ALL FIELDS ----------------------
const inferFields = (rows) => {
  const fields = new Set();
  rows.forEach((r) => Object.keys(r).forEach((k) => fields.add(k)));

  fields.delete("__v");
  fields.delete("data");

  return [...fields];
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
      pageSize = 30,
      sortBy,
      sortDir = "desc"
    } = req.query;

     if (!username) return res.status(400).json({ message: "username required" });
     if (!COLLECTION_MAP[collection]) {
      return res.status(400).json({ message: "Invalid collection" });
    }

    const existsResults = await Promise.all(
  Object.values(COLLECTION_MAP).map(Model =>
    Model.exists({ username })
  )
);

// Check if any collection has data for this username
const anyDataExists = existsResults.some(r => r !== null);

if (!anyDataExists) {
  return res.json({
    needsSync: true,
    message: "No data found in any collection for this user. Please trigger sync."
  });
}

// MAIN QUERY
    const Model = COLLECTION_MAP[collection];
    const filter = { username };
    if (orgLogin) {
  filter.orgLogin = { $regex: orgLogin, $options: "i" };
}

if (repoName) {
  filter.repoName = { $regex: repoName, $options: "i" };
}


    const searchOr = buildSearchQuery(search);
    const finalQuery = searchOr.length
      ? { $and: [filter, { $or: searchOr }] }
      : filter;

    const sort = pickSort(sortBy, sortDir);
    const skip = (Number(page) - 1) * Number(pageSize);
    const limit = Math.min(Number(pageSize), 200);

    // QUERY + COUNT
    const [total, docs] = await Promise.all([
      Model.countDocuments(finalQuery),
      Model.find(finalQuery).sort(sort).skip(skip).limit(limit).lean()
    ]);

    const flattened = docs.map(projectFlatten);
    const fields = inferFields(flattened);

    return res.json({
      needsSync: false,
      page: Number(page),
      pageSize: Number(pageSize),
      total,              // <<<<<<<<<<<<<< THIS WAS MISSING
      totalPages: Math.ceil(total / pageSize),
      rows: flattened,
      fields,
      sortBy,
      sortDir
    });
  } catch (error) {
    console.error("queryCollection error:", error);
    return res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { queryCollection };