const User = require("../model/User");

// 🔍 READ: Fetch all user documents inside the collection
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// ➕ CREATE: Write a new user document profile record into the cluster
exports.createUser = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json({ message: "Username and email fields are strictly required." });
    }

    const newUser = await User.create({ username, email });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};
