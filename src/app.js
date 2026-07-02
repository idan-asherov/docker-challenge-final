const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

class App {
  constructor() {
    this.app = express();

    // Force engine mode to production if running on Render
    this.app.set("env", process.env.NODE_ENV || "production");
    console.log(
      `⚙️ Express Internal Engine Mode configured to: ${this.app.get("env")}`,
    );

    // Render dynamically sets its own PORT via environment injection.
    this.port = process.env.PORT || 10000;

    // Allowed Origins Matrix (CORS Whitelist matching teacher's includes setup)
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
    this.initializeStaticServing(); // 📁 Serves your public/ folder assets as primary web interface
    this.initializeErrorHandling();
  }

  // Database Connection Layer
  async connectToDatabase() {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri && process.env.DB_USER && process.env.DB_PASSWORD) {
      mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qm94ulj.mongodb.net/${process.env.DB_NAME || "docker-challenge"}?retryWrites=true&w=majority`;
    }

    if (!mongoUri) {
      mongoUri =
        process.env.LOCAL_DB || "mongodb://127.0.0.1:27017/docker-challenge";
      if (process.env.IS_DOCKER === "true" || fs.existsSync("/.dockerenv")) {
        mongoUri = "mongodb://db:27017/docker-challenge";
      }
    }

    // Fail-fast gate for JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables.",
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
    // 💡 Note: Removed the text app.get("/") from here so it doesn't block your HTML file!

    // Dynamic health check handler reusable structure
    const healthHandler = (req, res) => {
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
        environment: this.app.get("env"),
      });
    };

    this.app.get("/health", healthHandler);
    this.app.get("/api/health", healthHandler);

    // Absolute safe path loading execution line
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
      }
    }
  }

  // Serve static HTML/CSS/JS frontend files
  initializeStaticServing() {
    const resolvedPath = path.join(__dirname, "..", "public");
    this.app.use(express.static(resolvedPath));
    console.log(`📁 Static files serving from: ${resolvedPath}`);
  }

  // Fallback & Error Handling Middlewares
  initializeErrorHandling() {
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

  listen() {
    this.app.listen(this.port, () => {
      console.log(`🚀 server running on port: ${this.port}`);
    });
  }
}

const server = new App();
server.listen();
