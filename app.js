require('dotenv').config();
require("./db/dbinit.js");
const express = require("express");
const app = express();



// Port Details
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("App is running at port " + port);
  console.log("Done");
});