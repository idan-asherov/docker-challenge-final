const express = require("express");
const router = express.Router();
const { getUsers, createUser } = require("../controllers/users.controller");

// Bind HTTP Methods seamlessly matching root relative prefixes
router.route("/").get(getUsers).post(createUser);

module.exports = router;
