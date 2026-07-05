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

    // Bind port
    this.port = process.env.PORT || 10000;

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

  // Database Connection Broker Layer
  async connectToDatabase() {
    let mongoUri = process.env.MONGO_URI;

    // Fallback credential reconstruction
    if (!mongoUri && process.env.DB_USER && process.env.DB_PASSWORD) {
      mongoUri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qm94ulj.mongodb.net/${process.env.DB_NAME || "docker-challenge"}?retryWrites=true&w=majority`;
    }

    // Local execution fallbacks
    if (!mongoUri) {
      mongoUri =
        process.env.LOCAL_DB || "mongodb://127.0.0.1:27017/docker-challenge";
      if (process.env.IS_DOCKER === "true" || fs.existsSync("/.dockerenv")) {
        mongoUri = "mongodb://db:27017/docker-challenge";
      }
    }

    // 🚨 ABSOLUTE FIX: Strip any destructive literal double-quotes injected by the web panel
    if (mongoUri && (mongoUri.startsWith('"') || mongoUri.startsWith("'"))) {
      mongoUri = mongoUri.replace(/^["']|["']$/g, "");
    }

    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ CRITICAL ERROR: JWT_SECRET is not defined in environment variables.",
      );
      process.exit(1);
    }

    try {
      console.log(
        process.env.RENDER
          ? "☁️ Connecting to Render Cloud DB Cluster..."
          : "🐋 Connecting to Local MongoDB...",
      );
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Cut long connection delays cleanly
      });
      console.log("📶 Clean connection established to MongoDB.");
    } catch (error) {
      console.error("❌ Database connection failure:", error.message);
      // We do not call process.exit(1) here on boot so the server can report logs over the API panel!
    }
  }

  initializeMiddlewares() {
    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || this.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(
              new Error(
                "Security Isolation Block: CORS restriction rule triggered.",
              ),
            );
          }
        },
        credentials: true,
      }),
    );

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  initializeRoutes() {
    // Diagnostic state endpoints
    const healthHandler = (req, res) => {
      const dbStates = [
        "disconnected",
        "connected",
        "connecting",
        "disconnecting",
      ];
      const activeStateIndex = mongoose.connection.readyState;
      const dbConnected = activeStateIndex === 1;

      res.status(dbConnected ? 200 : 503).json({
        status: dbConnected ? "ok" : "error",
        db: dbStates[activeStateIndex] || "unknown",
        runtime: `${Math.floor(process.uptime())}s`,
        environment: this.app.get("env"),
      });
    };

    this.app.get("/health", healthHandler);
    this.app.get("/api/health", healthHandler);

    // Securely tie user routing endpoints to controllers
    const routerPath = path.join(__dirname, "routes", "users.js");
    if (fs.existsSync(routerPath)) {
      this.app.use("/api/users", require(routerPath));
      console.log("🔌 User routes successfully mounted at /api/users");
    } else {
      console.warn(`⚠️ Warning: Router file missing at ${routerPath}`);
    }
  }

  initializeStaticServing() {
    const resolvedPath = path.join(__dirname, "..", "public");
    this.app.use(express.static(resolvedPath));
    console.log(
      `📁 Static files engine serving structural root directory assets from: ${resolvedPath}`,
    );
  }

  initializeErrorHandling() {
    this.app.use((err, req, res, next) => {
      const statusCode = err.statusCode || 500;
      const message =
        err.message || "Internal Server Execution Fault Exception";
      console.error(`💥 [Centralized Registry Logging]: ${message}`);
      res
        .status(statusCode)
        .json({ success: false, status: statusCode, message });
    });
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(
        `🚀 Node Engine operational. Listening on port connection profile: ${this.port}`,
      );
    });
  }
}

const server = new App();
server.listen();
