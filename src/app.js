const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load Environment Configuration safely
const productionEnvPath = path.join(__dirname, "..", ".env.production");
if (fs.existsSync(productionEnvPath)) {
  require("dotenv").config({ path: productionEnvPath });
  console.log("📥 Successfully loaded variables from .env.production");
} else {
  // Gracefully falls back to ambient system injection profiles (Render Dashboard Panel settings)
  require("dotenv").config();
}

class App {
  constructor() {
    this.app = express();

    // Environment Sync setting
    this.app.set("env", process.env.NODE_ENV || "development");
    console.log(
      `⚙️ Express Internal Engine Mode configured to: ${this.app.get("env")}`,
    );

    // Render automatically assigns its own custom PORT dynamically. We must bind to it!
    this.port = process.env.PORT || 5501;

    // Allowed Origins Matrix (CORS Whitelist)
    this.allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
    ];
    if (process.env.RENDER_EXTERNAL_URL) {
      this.allowedOrigins.push(process.env.RENDER_EXTERNAL_URL);
    }

    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeStaticServing();
    this.initializeErrorHandling();
  }

  // Database Connection Layer
  async connectToDatabase() {
    // 🚨 Dynamic production cluster connection builder using Render credentials
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri && process.env.DB_USER && process.env.DB_PASSWORD) {
      mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mongodb.net/${process.env.DB_NAME || "docker-challenge"}?retryWrites=true&w=majority`;
    }

    // Local execution fallback routes if running machine builds outside Render cloud ecosystem
    if (!mongoUri) {
      mongoUri =
        process.env.LOCAL_DB || "mongodb://127.0.0.1:27017/docker-challenge";
      if (process.env.IS_DOCKER === "true" || fs.existsSync("/.dockerenv")) {
        mongoUri = "mongodb://db:27017/docker-challenge";
      }
    }

    try {
      console.log(
        process.env.RENDER
          ? "☁️ Connecting to Render Cloud DB..."
          : "🐋 Connecting to Local MongoDB...",
      );
      await mongoose.connect(mongoUri);
      console.log("📶 Clean connection established to MongoDB.");
    } catch (error) {
      console.error("❌ Database connection failure:", error.message);
      process.exit(1);
    }

    // Strict Fail-Fast Security Check for JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables.",
      );
      process.exit(1);
    }
  }

  // Input Middlewares
  initializeMiddlewares() {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || this.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS policies"));
          }
        },
        credentials: true,
      }),
    );

    // Custom Request Logger Middleware
    this.app.use((req, res, next) => {
      console.log(`📡 [Incoming Request]: ${req.method} ${req.url}`);
      next();
    });

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  // Valid Application Routes Mapping
  initializeRoutes() {
    // Advanced Health Check Endpoint with environment logging
    this.app.get("/api/health", (req, res) => {
      const dbStates = [
        "connected",
        "disconnected",
        "connecting",
        "disconnecting",
      ];
      const dbConnected = mongoose.connection.readyState === 1;

      res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? "ok" : "error",
        db: dbStates[mongoose.connection.readyState] || "unknown",
        runtime: `${Math.floor(process.uptime())}s`,
        environment: process.env.NODE_ENV || "development",
      });
    });

    // Bulletproof Route Loader Step
    const routerPath = path.join(__dirname, "routes", "users.js");

    if (fs.existsSync(routerPath)) {
      const usersRoutes = require(routerPath);
      if (
        usersRoutes &&
        (typeof usersRoutes === "function" ||
          typeof usersRoutes.use === "function")
      ) {
        this.app.use("/api/users", usersRoutes);
        console.log("🔌 User routes successfully mounted at /api/users");
      } else {
        console.error(
          `❌ Error: ${routerPath} did not export a valid Express Router instance.`,
        );
      }
    } else {
      console.warn(
        `⚠️ Warning: Expected router file not found at ${routerPath}`,
      );
    }
  }

  // Static serving logic
  initializeStaticServing() {
    const resolvedPath = path.join(__dirname, "..", "public");
    this.app.use(express.static(resolvedPath));
    console.log(`📁 Static files serving from: ${resolvedPath}`);
  }

  // Fallback & Error Handling Middlewares
  initializeErrorHandling() {
    // Central Error Handler
    this.app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error(`💥 [Error Handler Log]: ${message}`);

      res.status(statusCode).json({
        success: false,
        status: statusCode,
        message: message,
        stack: this.app.get("env") === "production" ? "🥞" : err.stack,
      });
    });
  }

  // Boot Engine
  listen() {
    this.app.listen(this.port, () => {
      console.log(`🚀 server running on port: ${this.port}`);
    });
  }
}

// Instantiate and start the server application
const server = new App();
server.listen();
