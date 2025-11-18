"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.apiLimiter = void 0;
// src/middleware/rate.middleware.ts
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased limit for development
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res /*, next*/) => {
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
    },
});
// Login limiter: increase threshold and key by IP+email to avoid locking all users after a few attempts
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 login attempts per 15 minutes per IP+email
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => { var _a; return `${(0, express_rate_limit_1.ipKeyGenerator)(req.ip || '')}:${(((_a = req.body) === null || _a === void 0 ? void 0 : _a.email) || '').toLowerCase()}`; },
    handler: (req, res /*, next*/) => {
        res.status(429).json({ message: 'Too many login attempts. Please wait and try again.' });
    },
});
