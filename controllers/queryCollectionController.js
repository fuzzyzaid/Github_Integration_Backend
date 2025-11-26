const COLLECTION_MAP = {
  github_orgs: require("../models/githubOrgModel"),
  github_repos: require("../models/githubRepoModel"),
  github_commits: require("../models/githubCommitsModel"),
  github_pulls: require("../models/githubPullModel"),
  github_issues: require("../models/githubIssuesModel"),
  github_issue_events: require("../models/githubIssueEventsModel"),
  github_org_members: require("../models/githubOrgMembersModel")
};

/* -----------------------------------------------------
   RECURSIVE FLATTEN (infinite levels)
------------------------------------------------------ */
const flattenObject = (obj, parentKey = "", result = {}) => {
  if (!obj || typeof obj !== "object") return result;

  for (const key of Object.keys(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    const val = obj[key];

    if (val && typeof val === "object" && !Array.isArray(val)) {
      flattenObject(val, newKey, result);
    } else if (Array.isArray(val)) {
      result[newKey] = val
        .map(v => (typeof v === "object" ? JSON.stringify(v) : v))
        .join(", ");
    } else {
      result[newKey] = val;
    }
  }

  return result;
};

/* -----------------------------------------------------
   FLATTEN FULL DOCUMENT
------------------------------------------------------ */
const projectFlatten = (doc) => {
  const o = doc.toObject ? doc.toObject() : doc;

  let flat = {};

  // keep root fields except data
  for (const key in o) {
    if (key !== "data") flat[key] = o[key];
  }

  // flatten nested data.*
  if (o.data && typeof o.data === "object") {
    const nested = flattenObject(o.data, "");
    for (const key in nested) {
      flat[key] = nested[key];
    }
  }

  return flat;
};

/* -----------------------------------------------------
   INFER FIELDS FROM FLATTENED ROWS
------------------------------------------------------ */
const inferFieldsFromRows = (rows) => {
  const fields = new Set();

  rows.forEach(r => {
    Object.keys(r).forEach(f => {
      if (!["__v", "data"].includes(f)) fields.add(f);
    });
  });

  return [...fields];
};

/* -----------------------------------------------------
   SORTING
------------------------------------------------------ */
const pickSort = (sortBy, sortDir) => {
  const dir = sortDir === "asc" ? 1 : -1;

  if (!sortBy) return { createdAt: -1 };

  return { [sortBy]: dir };
};

/* -----------------------------------------------------
   MAIN QUERY
------------------------------------------------------ */
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

    if (!username)
      return res.status(400).json({ message: "username required" });

    if (!COLLECTION_MAP[collection])
      return res.status(400).json({ message: "Invalid collection" });

    const Model = COLLECTION_MAP[collection];

    // Base filter
    const filter = { username };
    if (orgLogin) filter.orgLogin = { $regex: orgLogin, $options: "i" };
    if (repoName) filter.repoName = { $regex: repoName, $options: "i" };

    // Sorting
    const sort = pickSort(sortBy, sortDir);

    // Fetch ALL docs for this user + filter
    const rawDocs = await Model.find(filter).sort(sort).lean();

    // Flatten all docs
    const flatDocs = rawDocs.map(projectFlatten);

    // GLOBAL SEARCH (in-memory)
    let filtered = flatDocs;
    if (search) {
      const s = search.toLowerCase();
      filtered = flatDocs.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(s)
        )
      );
    }

    // Pagination AFTER filtering
    const limit = Math.min(Number(pageSize), 200);
    const skip = (Number(page) - 1) * limit;

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    // Infer fields for AG Grid
    const fields = inferFieldsFromRows(paginated);

    return res.json({
      needsSync: false,
      page: Number(page),
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
      rows: paginated,
      fields,
      sortBy,
      sortDir
    });

  } catch (err) {
    console.error("queryCollection error:", err);
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { queryCollection };