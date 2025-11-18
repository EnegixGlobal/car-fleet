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
exports.deleteUser = exports.updateUser = exports.getUsers = exports.loginUser = exports.registerUser = exports.getUserById = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const config_1 = require("../../config");
const toStringId = (value) => value ? value.toString() : undefined;
const collectPhoneVariants = (phone) => {
    const trimmed = (phone === null || phone === void 0 ? void 0 : phone.trim()) || '';
    const digits = trimmed.replace(/\D/g, '');
    const variants = new Set();
    if (trimmed)
        variants.add(trimmed);
    if (digits) {
        variants.add(digits);
        variants.add(`+${digits}`);
    }
    return Array.from(variants).filter(Boolean);
};
const syncUserAssociations = (user) => __awaiter(void 0, void 0, void 0, function* () {
    let driverId = toStringId(user.driverId);
    let customerId = toStringId(user.customerId);
    let dirty = false;
    if (user.role === 'driver' && !driverId) {
        const driver = yield models_1.Driver.findOne({
            phone: { $in: collectPhoneVariants(user.phone) },
        }).select('_id phone');
        if (driver) {
            user.driverId = driver._id;
            driverId = driver._id.toString();
            dirty = true;
        }
    }
    if (user.role === 'customer' && !customerId) {
        const customer = yield models_1.Customer.findOne({
            phone: { $in: collectPhoneVariants(user.phone) },
        }).select('_id phone');
        if (customer) {
            user.customerId = customer._id;
            customerId = customer._id.toString();
            dirty = true;
        }
    }
    if (dirty) {
        yield user.save();
    }
    return { driverId, customerId };
});
const getUserById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.User.findById(id).select('-password');
});
exports.getUserById = getUserById;
const registerUser = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield models_1.User.findOne({ email: data.email });
    if (existing)
        throw new Error('Email in use');
    const hashed = yield bcryptjs_1.default.hash(data.password, 10);
    const user = new models_1.User({
        email: data.email,
        password: hashed,
        name: data.name,
        phone: data.phone,
        role: data.role,
        driverId: data.driverId,
        customerId: data.customerId,
    });
    yield user.save();
    return user;
});
exports.registerUser = registerUser;
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.User.findOne({ email });
    if (!user || !(yield bcryptjs_1.default.compare(password, user.password))) {
        throw new Error('Invalid credentials');
    }
    const { driverId, customerId } = yield syncUserAssociations(user);
    const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), role: user.role, driverId, customerId }, config_1.config.jwtSecret, { expiresIn: '1d' });
    return {
        token,
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            driverId,
            customerId,
            createdAt: user.createdAt.toISOString(),
        },
    };
});
exports.loginUser = loginUser;
const getUsers = (page, limit) => __awaiter(void 0, void 0, void 0, function* () {
    const skip = (page - 1) * limit;
    const [users, total] = yield Promise.all([
        models_1.User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
        models_1.User.countDocuments(),
    ]);
    return { users, total };
});
exports.getUsers = getUsers;
const updateUser = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    if (updates.password)
        updates.password = yield bcryptjs_1.default.hash(updates.password, 10);
    return models_1.User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
});
exports.updateUser = updateUser;
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.User.findByIdAndDelete(id);
});
exports.deleteUser = deleteUser;
