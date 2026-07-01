const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./model/User");

const seedUsers = async () => {
  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI environment variable is missing.");
    process.exit(1);
  }

  try {
    console.log("Initializing seed bridge to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connection established.");

    // Flush old entries to prevent duplicates
    await User.deleteMany({});
    console.log("Cleared old registry items.");

    const dummyProfiles = [
      { name: "Almayo Mekonen", email: "almayo@teacher.edu" },
      { name: "Idan Asherov", email: "idan@student.io" },
      { name: "Alex Mercer", email: "alex.m@devops.org" },
      { name: "Jessica Rabbit", email: "jess@animation.com" }
    ];

    await User.insertMany(dummyProfiles);
    console.log("Database successfully seeded with 4 mock profiles! 🌱");
    
    await mongoose.connection.close();
    console.log("Seed complete. Connection closed securely.");
    process.exit(0);
  } catch (error) {
    console.error(`Critical seeding failure: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
