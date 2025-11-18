"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = require("./api/middleware");
const routes_1 = require("./api/routes");
const config_1 = require("./config");
const user_seed_1 = require("./seeds/user.seed");
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync(config_1.config.uploadDir))
    fs_1.default.mkdirSync(config_1.config.uploadDir);
const numCPUs = os_1.default.cpus().length;
if (cluster_1.default.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', () => cluster_1.default.fork());
}
else {
    const app = (0, express_1.default)();
    app.set("trust proxy", 1);
    app.use((0, helmet_1.default)());
    // Broaden CORS in development to allow Vite dev server (5173) while keeping configured frontend URL
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            const allowed = [
                config_1.config.frontendUrl,
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://car-fleet-eta.vercel.app/",
            ];
            if (!origin || allowed.includes(origin)) {
                callback(null, true);
            }
            else {
                console.warn('CORS blocked origin:', origin);
                callback(null, true); // Allow all origins in development
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json());
    app.use(middleware_1.apiLimiter);
    app.get('/', (req, res) => res.json({ message: 'Backend API is running on Vercel!' }));
    // Serve uploaded files
    app.use('/uploads', express_1.default.static(config_1.config.uploadDir));
    mongoose_1.default.connect(config_1.config.mongoURI).then(() => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Mongo connected');
        yield (0, user_seed_1.seedUsers)();
    }));
    app.use('/api', routes_1.apiRouter);
    app.use(middleware_1.errorHandler);
    app.listen(config_1.config.port, () => console.log(`Worker on port ${config_1.config.port}`));
}
