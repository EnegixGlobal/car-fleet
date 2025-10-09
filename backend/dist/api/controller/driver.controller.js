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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.settleAdvance = exports.addAdvance = exports.deleteDriver = exports.updateDriver = exports.getDriverById = exports.getDrivers = exports.createDriver = void 0;
const service = __importStar(require("../services"));
const validation_1 = require("../validation");
const cloudinary_1 = require("../../config/cloudinary");
const path_1 = __importDefault(require("path"));
const createDriver = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // If multipart form-data used, multer (upload middleware) should have run before this controller.
        const data = validation_1.driverSchema.parse(req.body);
        const driverData = Object.assign(Object.assign({}, data), { licenseExpiry: new Date(data.licenseExpiry), policeVerificationExpiry: new Date(data.policeVerificationExpiry), dateOfJoining: new Date(data.dateOfJoining), status: data.status || 'active' });
        // Handle uploaded files if present
        const files = req.files;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const assign = (field, targetField) => __awaiter(void 0, void 0, void 0, function* () {
            const fArr = files === null || files === void 0 ? void 0 : files[field];
            if (fArr && fArr[0]) {
                if (cloudinary_1.isCloudinaryConfigured) {
                    const uploaded = yield (0, cloudinary_1.uploadToCloudinary)(fArr[0].path, 'drivers');
                    driverData[targetField] = uploaded.url;
                    driverData[`${targetField}PublicId`] = uploaded.publicId;
                }
                else {
                    const filename = path_1.default.basename(fArr[0].path);
                    driverData[targetField] = `${baseUrl}/uploads/${filename}`;
                }
            }
        });
        yield Promise.all([
            assign('photo', 'photo'),
            assign('licenseDocument', 'licenseDocument'),
            assign('policeVerificationDocument', 'policeVerificationDocument'),
            assign('document', 'document')
        ]);
        const driver = yield service.createDriver(driverData);
        res.status(201).json(driver);
    }
    catch (err) {
        next(err);
    }
});
exports.createDriver = createDriver;
const getDrivers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const filters = { status: req.query.status, paymentMode: req.query.paymentMode };
        const result = yield service.getDrivers(page, limit, filters);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.getDrivers = getDrivers;
const getDriverById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const driver = yield service.getDriverById(req.params.id);
        if (!driver)
            return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    }
    catch (err) {
        next(err);
    }
});
exports.getDriverById = getDriverById;
const updateDriver = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = validation_1.updateDriverSchema.parse(req.body);
        const updateData = Object.assign({}, data);
        // Convert date strings to Date objects
        if (updateData.licenseExpiry)
            updateData.licenseExpiry = new Date(updateData.licenseExpiry);
        if (updateData.policeVerificationExpiry)
            updateData.policeVerificationExpiry = new Date(updateData.policeVerificationExpiry);
        if (updateData.dateOfJoining)
            updateData.dateOfJoining = new Date(updateData.dateOfJoining);
        const ufiles = req.files;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const assign = (field, targetField) => __awaiter(void 0, void 0, void 0, function* () {
            const fArr = ufiles === null || ufiles === void 0 ? void 0 : ufiles[field];
            if (fArr && fArr[0]) {
                if (cloudinary_1.isCloudinaryConfigured) {
                    const uploaded = yield (0, cloudinary_1.uploadToCloudinary)(fArr[0].path, 'drivers');
                    updateData[targetField] = uploaded.url;
                    updateData[`${targetField}PublicId`] = uploaded.publicId;
                }
                else {
                    const filename = path_1.default.basename(fArr[0].path);
                    updateData[targetField] = `${baseUrl}/uploads/${filename}`;
                }
            }
        });
        yield Promise.all([
            assign('photo', 'photo'),
            assign('licenseDocument', 'licenseDocument'),
            assign('policeVerificationDocument', 'policeVerificationDocument'),
            assign('document', 'document')
        ]);
        const driver = yield service.updateDriver(req.params.id, updateData);
        if (!driver)
            return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    }
    catch (err) {
        next(err);
    }
});
exports.updateDriver = updateDriver;
const deleteDriver = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield service.deleteDriver(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.deleteDriver = deleteDriver;
const addAdvance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = validation_1.advanceSchema.parse(req.body);
        const advanceData = Object.assign(Object.assign({}, data), { date: new Date(), settled: false, description: data.description || '' });
        const driver = yield service.addAdvance(req.params.id, advanceData);
        if (!driver)
            return res.status(404).json({ message: 'Driver not found' });
        res.json(driver);
    }
    catch (err) {
        next(err);
    }
});
exports.addAdvance = addAdvance;
const settleAdvance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { advanceId } = req.body;
        yield service.settleAdvance(req.params.id, advanceId);
        res.status(200).json({ message: 'Advance settled' });
    }
    catch (err) {
        next(err);
    }
});
exports.settleAdvance = settleAdvance;
