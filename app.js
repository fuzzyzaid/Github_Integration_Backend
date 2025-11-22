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
const integrationRoutes = require('./routes/integrationRoute');
app.use('/auth', authRoutes);
app.use('/integration', integrationRoutes);


// Port Details
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("App is running at port " + port);
});