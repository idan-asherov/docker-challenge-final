const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Load Environment Configuration
const productionEnvPath = path.join(__dirname, "..", ".env.production");
if (fs.existsSync(productionEnvPath)) {
  require("dotenv").config({ path: productionEnvPath });
  console.log("📥 Successfully loaded variables from .env.production");
} else {
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

    // Dynamic Port fallback
    this.port = process.env.PORT || 5501;

    // Allowed Origins Matrix (CORS Whitelist)
    this.allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5500",
      "http://localhost:5501",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:5501",
    ];

    this.connectToDatabase();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeStaticServing(); // 📁 Your teacher's exact asset serving implementation
    this.initializeErrorHandling();
  }

  // Database Connection Layer
  async connectToDatabase() {
    let fallbackLocal =
      process.env.LOCAL_DB || "mongodb://127.0.0.1:27017/docker-challenge";

    if (process.env.IS_DOCKER === "true" || fs.existsSync("/.dockerenv")) {
      fallbackLocal = "mongodb://db:27017/docker-challenge";
    }

    const mongoUri = process.env.RENDER ? process.env.MONGO_URI : fallbackLocal;

    if (!mongoUri) {
      console.error(
        "❌ CRITICAL ERROR: Database URI configuration is completely missing.",
      );
      process.exit(1);
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
  }

  // Input Middlewares
  initializeMiddlewares() {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (this.allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(
              new Error(`Security Alert: Origin ${origin} blocked by CORS.`),
            );
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

    // Clean mount looking for your file path configuration: src/routes/users.js
    const routerPath = path.join(__dirname, "routes", "users.js");
    if (fs.existsSync(routerPath)) {
      this.app.use("/api/users", require(routerPath));
      console.log("🔌 User routes successfully mounted at /api/users");
    } else {
      console.warn(
        `⚠️ Warning: Expected router file not found at ${routerPath}`,
      );
    }
  }

  // 🌟 Your Teacher's Precise static serving logic integrated cleanly
  initializeStaticServing() {
    // Safe reference: matches exactly your teacher's 'path.join' line strategy
    const resolvedPath = path.join(__dirname, "..", "public");

    this.app.use(express.static(resolvedPath));
    console.log(
      `📁 Static files engine serving directory asset files from: ${resolvedPath}`,
    );
  }

  // Fallback & Error Handling Middlewares
  initializeErrorHandling() {
    this.app.use((req, res, next) => {
      const error = new Error(
        `The requested path ${req.originalUrl} was not found on this server.`,
      );
      error.statusCode = 404;
      next(error);
    });

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
