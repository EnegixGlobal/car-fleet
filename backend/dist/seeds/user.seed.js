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
exports.seedUsers = void 0;
// src/seeds/user.seed.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../api/models");
const seedUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if admin already exists
        const adminExists = yield models_1.User.findOne({ email: 'admin@gmail.com' });
        if (adminExists) {
            console.log('Seed users already exist');
            return;
        }
        const users = [
            {
                email: 'admin@gmail.com',
                name: 'Admin User',
                phone: '+1234567890',
                role: 'admin',
                password: yield bcryptjs_1.default.hash('password', 10),
            },
            {
                email: 'accountant@gmail.com',
                name: 'John Accountant',
                phone: '+1234567891',
                role: 'accountant',
                password: yield bcryptjs_1.default.hash('password', 10),
            },
            {
                email: 'dispatcher@gmail.com',
                name: 'Jane Dispatcher',
                phone: '+1234567892',
                role: 'dispatcher',
                password: yield bcryptjs_1.default.hash('password', 10),
            },
            {
                email: 'driver@gmail.com',
                name: 'Mike Driver',
                phone: '+1234567893',
                role: 'driver',
                password: yield bcryptjs_1.default.hash('password', 10),
            },
        ];
        yield models_1.User.insertMany(users);
        console.log('Seed users created successfully');
    }
    catch (error) {
        console.error('Error seeding users:', error);
    }
});
exports.seedUsers = seedUsers;
