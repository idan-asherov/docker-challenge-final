const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const usersRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: "*" }));

// Connect to Database
connectDB();

// Serve visual layout assets from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Backend API Routes
app.use("/api/users", usersRoutes);

// Express 5 Safe Catch-All Route: (.*) instead of *
app.get("(.*)", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
