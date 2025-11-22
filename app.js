require('dotenv').config();
require("./db/dbinit.js");
const express = require("express");
const cors = require('cors');

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));


// Routes
const authRoutes = require('./routes/authRoute.js');
app.use('/auth', authRoutes);


// Port Details
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("App is running at port " + port);
});