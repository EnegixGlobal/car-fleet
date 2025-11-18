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
exports.deleteVehicle = exports.updateVehicle = exports.getVehicleById = exports.getVehicles = exports.createVehicle = void 0;
const service = __importStar(require("../services"));
const validation_1 = require("../validation");
const cloudinary_1 = require("../../config/cloudinary");
const createVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.vehicleSchema.parse(req.body);
    const vehicleData = Object.assign(Object.assign({}, data), { 
        // if categoryId provided, allow category to be undefined; else require category (already validated by zod refine)
        insuranceExpiry: new Date(data.insuranceExpiry), fitnessExpiry: new Date(data.fitnessExpiry), permitExpiry: new Date(data.permitExpiry), pollutionExpiry: new Date(data.pollutionExpiry), status: 'active' });
    // Upload files to Cloudinary if present
    const files = req.files;
    if (files) {
        const assign = (field, targetField) => __awaiter(void 0, void 0, void 0, function* () {
            const fArr = files[field];
            if (fArr && fArr[0]) {
                const uploaded = yield (0, cloudinary_1.uploadToCloudinary)(fArr[0].path, 'vehicles');
                vehicleData[targetField] = uploaded.url; // secure URL
                // If you later store publicId, add: (vehicleData as any)[`${targetField}PublicId`] = uploaded.publicId;
            }
        });
        yield assign('photo', 'photo');
        yield assign('document', 'document');
    }
    const vehicle = yield service.createVehicle(vehicleData);
    res.status(201).json(vehicle);
});
exports.createVehicle = createVehicle;
const getVehicles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { status: req.query.status, owner: req.query.owner, category: req.query.category };
    const result = yield service.getVehicles(page, limit, filters);
    res.json(result);
});
exports.getVehicles = getVehicles;
const getVehicleById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const vehicle = yield service.getVehicleById(req.params.id);
    if (!vehicle)
        return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
});
exports.getVehicleById = getVehicleById;
const updateVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.updateVehicleSchema.parse(req.body);
    const updateData = Object.assign({}, data);
    // Convert date strings to Date objects
    if (updateData.insuranceExpiry)
        updateData.insuranceExpiry = new Date(updateData.insuranceExpiry);
    if (updateData.fitnessExpiry)
        updateData.fitnessExpiry = new Date(updateData.fitnessExpiry);
    if (updateData.permitExpiry)
        updateData.permitExpiry = new Date(updateData.permitExpiry);
    if (updateData.pollutionExpiry)
        updateData.pollutionExpiry = new Date(updateData.pollutionExpiry);
    // Upload files to Cloudinary if present
    const files = req.files;
    if (files) {
        const assign = (field, targetField) => __awaiter(void 0, void 0, void 0, function* () {
            const fArr = files[field];
            if (fArr && fArr[0]) {
                const uploaded = yield (0, cloudinary_1.uploadToCloudinary)(fArr[0].path, 'vehicles');
                updateData[targetField] = uploaded.url;
                // Optionally persist publicId too
            }
        });
        yield assign('photo', 'photo');
        yield assign('document', 'document');
    }
    const vehicle = yield service.updateVehicle(req.params.id, updateData);
    if (!vehicle)
        return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
});
exports.updateVehicle = updateVehicle;
const deleteVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield service.deleteVehicle(req.params.id);
    res.status(204).send();
});
exports.deleteVehicle = deleteVehicle;
