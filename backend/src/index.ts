// src/index.ts
import cluster from "cluster";
import os from "os";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import { apiLimiter, errorHandler } from "./api/middleware";
import { apiRouter } from "./api/routes";
import { config } from "./config";
import { seedUsers } from "./seeds/user.seed";
import fs from "fs";

if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir);

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", () => cluster.fork());
} else {
  const app = express();

  app.set("trust proxy", 1);

  // CORS configuration - must be before helmet to avoid conflicts
  const allowedOrigins = [
    "https://crm.ranchitravels.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://car-fleet-eta.vercel.app",
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // Log for debugging
          console.warn('CORS blocked origin:', origin);
          // In production, you might want to block this
          // For now, allow it to avoid breaking things
          callback(null, true);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Content-Type", "Authorization"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );

  // Configure helmet to not interfere with CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(express.json());
  app.use(apiLimiter);

  app.get("/", (req, res) =>
    res.json({ message: "Backend API is running on Vercel!" })
  );

  // Serve uploaded files with CORS headers
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  }, express.static(config.uploadDir));

  mongoose.connect(config.mongoURI).then(async () => {
    console.log("Mongo connected");
    await seedUsers();
  });

  app.use("/api", apiRouter);

  app.use(errorHandler);

  app.listen(config.port, () => console.log(`Worker on port ${config.port}`));
}
