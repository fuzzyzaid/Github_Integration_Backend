require("dotenv").config();
const mongoose = require("mongoose");

const DBURL = process.env.DBURL;

async function connectDB() {
  try {
    console.log(" Connecting to MongoDB...");
    await mongoose.connect(DBURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB Connected Successfully!");
  } catch (error) {
    console.error(" MongoDB Connection Error:", error.message);
    process.exit(1); 
  }
}

connectDB(); // check this one later ; we can use the module export
