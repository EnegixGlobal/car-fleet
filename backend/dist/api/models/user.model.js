"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src/models/user.model.ts
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    driverId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Driver' },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});
exports.User = (0, mongoose_1.model)('User', userSchema);
