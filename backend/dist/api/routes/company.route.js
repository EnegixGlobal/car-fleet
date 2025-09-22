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
exports.companyRouter = void 0;
// src/routes/company.route.ts (Updated)
const express_1 = require("express");
const controller = __importStar(require("../controller/company.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
exports.companyRouter = router;
router.post('/', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.createCompany);
router.get('/', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.getCompanies); // Dispatcher added
router.get('/:id', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.getCompanyById);
router.get('/:id/overview', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.getCompanyOverview);
router.put('/:id', (0, middleware_1.auth)(['admin', 'accountant']), controller.updateCompany);
router.delete('/:id', (0, middleware_1.auth)(['admin', 'accountant']), controller.deleteCompany);
router.post('/:id/payments', (0, middleware_1.auth)(['admin', 'accountant']), controller.recordPayment);
