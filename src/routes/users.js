const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Absolute safe path matching controller configuration location matrix
const controllerPath = path.join(
  __dirname,
  "..",
  "controllers",
  "users.controller.js",
);

if (fs.existsSync(controllerPath)) {
  // Bind your real database controllers directly
  const { getUsers, createUser } = require(controllerPath);

  router.route("/").get(getUsers).post(createUser);

  console.log(
    "📶 Router mapped securely to real database controller endpoints.",
  );
} else {
  console.warn(
    "⚠️ Warning: controllers/users.controller.js was not found. Using safe temporary mock gates.",
  );

  // Safe mock fallbacks to prevent runtime thread termination crashes
  const getUsersMock = (req, res) => res.status(200).json([]);
  const createUserMock = (req, res) =>
    res.status(201).json({ msg: "Mock Profile written successfully." });

  router.route("/").get(getUsersMock).post(createUserMock);
}

module.exports = router;
