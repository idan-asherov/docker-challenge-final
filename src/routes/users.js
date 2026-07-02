const express = require("express");
const router = express.Router();

const getUsers = (req, res) => {
  res.status(200).json({ msg: "All users fetched successfully." });
};

const createUser = (req, res) => {
  res.status(201).json({ msg: "User profile generated cleanly." });
};

router.route("/").get(getUsers).post(createUser);

module.exports = router;
