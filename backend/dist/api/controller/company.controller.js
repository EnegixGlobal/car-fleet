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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyOverview = exports.recordPayment = exports.deleteCompany = exports.updateCompany = exports.getCompanyById = exports.getCompanies = exports.createCompany = void 0;
const service = __importStar(require("../services"));
const validation_1 = require("../validation");
const models_1 = require("../models");
const createCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.companySchema.parse(req.body);
    const company = yield service.createCompany(data);
    res.status(201).json(company);
});
exports.createCompany = createCompany;
const getCompanies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { outstandingGt: req.query.outstandingGt, minOutstanding: req.query.minOutstanding, startDate: req.query.startDate, endDate: req.query.endDate };
    const result = yield service.getCompanies(page, limit, filters);
    res.json(result);
});
exports.getCompanies = getCompanies;
const getCompanyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const company = yield service.getCompanyById(req.params.id);
    if (!company)
        return res.status(404).json({ message: 'Company not found' });
    res.json(company);
});
exports.getCompanyById = getCompanyById;
const updateCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.updateCompanySchema.parse(req.body);
    const company = yield service.updateCompany(req.params.id, data);
    if (!company)
        return res.status(404).json({ message: 'Company not found' });
    res.json(company);
});
exports.updateCompany = updateCompany;
const deleteCompany = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield service.deleteCompany(req.params.id);
    res.status(204).send();
});
exports.deleteCompany = deleteCompany;
const recordPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, description } = req.body;
    yield service.recordPayment(req.params.id, amount, description);
    res.status(200).json({ message: 'Payment recorded' });
});
exports.recordPayment = recordPayment;
const getCompanyOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = req.params.id;
    const company = yield models_1.Company.findById(companyId);
    if (!company)
        return res.status(404).json({ message: 'Company not found' });
    const [bookings, payments] = yield Promise.all([
        models_1.Booking.find({ companyId }).sort({ startDate: -1 }).limit(20),
        models_1.Payment.find({ entityType: 'customer', entityId: companyId }).sort({ date: -1 }).limit(20),
    ]);
    const metrics = {
        bookings: bookings.length,
        revenue: bookings.reduce((s, b) => s + b.totalAmount, 0),
        expenses: bookings.reduce((s, b) => { var _a; return s + (((_a = b.expenses) === null || _a === void 0 ? void 0 : _a.reduce((eSum, e) => eSum + e.amount, 0)) || 0); }, 0),
        completed: bookings.filter(b => b.status === 'completed').length,
        outstanding: company.outstandingAmount,
    };
    res.json({
        company,
        metrics,
        bookings,
        payments,
    });
});
exports.getCompanyOverview = getCompanyOverview;
