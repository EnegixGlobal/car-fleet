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
exports.bookingRouter = void 0;
// src/routes/booking.route.ts (Updated)
const express_1 = require("express");
const controller = __importStar(require("../controller/booking.controller"));
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
exports.bookingRouter = router;
router.post('/', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.createBooking);
router.get('/', (0, middleware_1.auth)(['admin', 'dispatcher', 'driver', 'customer']), controller.getBookings); // Customer can read
router.get('/:id', (0, middleware_1.auth)(['admin', 'dispatcher', 'driver', 'customer']), controller.getBookingById);
router.put('/:id', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.updateBooking); // No driver mutation
router.delete('/:id', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.deleteBooking);
router.post('/:id/expenses', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.addExpense);
router.put('/:id/expenses/:expenseId', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.updateExpense);
router.delete('/:id/expenses/:expenseId', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.deleteExpense);
router.put('/:id/status', (0, middleware_1.auth)(['admin', 'dispatcher', 'driver']), controller.updateStatus); // Driver can update status
router.post('/:id/duty-slips', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.uploadDutySlips);
router.put('/:id/remove-duty-slip', (0, middleware_1.auth)(['admin', 'dispatcher']), controller.removeDutySlip);
router.post('/:id/payments', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.addPayment);
router.get('/:id/payments', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher', 'customer']), controller.getPayments);
router.put('/:id/payments/:paymentId', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.updatePayment);
router.delete('/:id/payments/:paymentId', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.deletePayment);
// Driver payment (per booking)
router.post('/:id/driver-payments', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.addDriverPayment);
router.get('/:id/driver-payments', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.listDriverPayments);
router.put('/:id/driver-payments/:paymentId', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.updateDriverPayment);
router.delete('/:id/driver-payments/:paymentId', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.deleteDriverPayment);
router.get('/:id/driver-payments-export', (0, middleware_1.auth)(['admin', 'accountant', 'dispatcher']), controller.exportDriverPayments);
