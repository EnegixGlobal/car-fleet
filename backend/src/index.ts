// src/index.ts
import cluster from 'cluster';
import os from 'os';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import { apiLimiter, errorHandler } from './api/middleware';
import { apiRouter } from './api/routes';
import { config } from './config';
import { seedUsers } from './seeds/user.seed';
import fs from 'fs';

if (!fs.existsSync(config.uploadDir)) fs.mkdirSync(config.uploadDir);

const isVercel = process.env.VERCEL === '1'; //  Detects Vercel environment

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      config.frontendUrl,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://car-fleet-eta.vercel.app",
    ];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(apiLimiter);

app.get('/', (req, res) => res.json({ message: 'Backend API is running ' }));
app.use('/uploads', express.static(config.uploadDir));

mongoose.connect(config.mongoURI)
  .then(async () => {
    console.log('Mongo connected');
    await seedUsers();
  })
  .catch(err => console.error('Mongo connection error:', err));

app.use('/api', apiRouter);
app.use(errorHandler);

//  Vercel will auto-handle listening, only run cluster locally
if (!isVercel) {
  const numCPUs = os.cpus().length;

  if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    cluster.on('exit', () => cluster.fork());
  } else {
    app.listen(config.port, () => console.log(`Worker on port ${config.port}`));
  }
}

//  Always export for Vercel runtime
export default app;
