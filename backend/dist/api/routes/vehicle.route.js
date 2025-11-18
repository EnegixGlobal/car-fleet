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
exports.vehicleRouter = void 0;
// src/routes/vehicle.route.ts
const express_1 = require("express");
const controller = __importStar(require("../controller/vehicle.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
exports.vehicleRouter = router;
router.post('/', (0, middleware_1.auth)(['admin', 'dispatcher']), middleware_1.upload, controller.createVehicle);
router.get('/', (0, middleware_1.auth)(['admin', 'dispatcher', 'driver']), controller.getVehicles);
router.get('/:id', (0, middleware_1.auth)(['admin', 'dispatcher', 'driver']), controller.getVehicleById);
router.put('/:id', (0, middleware_1.auth)(['admin', 'dispatcher']), middleware_1.upload, controller.updateVehicle);
router.delete('/:id', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.deleteVehicle);
