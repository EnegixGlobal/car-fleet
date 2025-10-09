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
exports.exportDriverPayments = exports.deleteDriverPayment = exports.updateDriverPayment = exports.listDriverPayments = exports.addDriverPayment = exports.getPayments = exports.addPayment = exports.removeDutySlip = exports.uploadDutySlips = exports.updateStatus = exports.addExpense = exports.deleteBooking = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.createBooking = void 0;
const mongoose_1 = require("mongoose");
const service = __importStar(require("../services"));
const validation_1 = require("../validation");
const payment_service_1 = require("../services/payment.service");
const createBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.bookingSchema.parse(req.body);
    const bookingData = Object.assign(Object.assign({}, data), { customerId: data.customerId ? new mongoose_1.Types.ObjectId(data.customerId) : undefined, companyId: data.companyId ? new mongoose_1.Types.ObjectId(data.companyId) : undefined, vehicleId: data.vehicleId ? new mongoose_1.Types.ObjectId(data.vehicleId) : undefined, driverId: data.driverId ? new mongoose_1.Types.ObjectId(data.driverId) : undefined, startDate: new Date(data.startDate), endDate: new Date(data.endDate), status: 'booked' });
    const booking = yield service.createBooking(bookingData);
    res.status(201).json(booking);
});
exports.createBooking = createBooking;
const getBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = { status: req.query.status, source: req.query.source, startDate: req.query.startDate, endDate: req.query.endDate, driverId: req.query.driverId };
    const result = yield service.getBookings(page, limit, filters);
    res.json(result);
});
exports.getBookings = getBookings;
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield service.getBookingById(req.params.id);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.getBookingById = getBookingById;
const updateBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.updateBookingSchema.parse(req.body);
    const updateData = Object.assign({}, data);
    // Convert string IDs to ObjectIds
    if (updateData.companyId)
        updateData.companyId = new mongoose_1.Types.ObjectId(updateData.companyId);
    if (updateData.vehicleId)
        updateData.vehicleId = new mongoose_1.Types.ObjectId(updateData.vehicleId);
    if (updateData.driverId)
        updateData.driverId = new mongoose_1.Types.ObjectId(updateData.driverId);
    if (updateData.customerId)
        updateData.customerId = new mongoose_1.Types.ObjectId(updateData.customerId);
    // Convert date strings to Date objects
    if (updateData.startDate)
        updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate)
        updateData.endDate = new Date(updateData.endDate);
    const booking = yield service.updateBooking(req.params.id, updateData);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.updateBooking = updateBooking;
const deleteBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield service.deleteBooking(req.params.id);
    res.status(204).send();
});
exports.deleteBooking = deleteBooking;
const addExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.expenseSchema.parse(req.body);
    const booking = yield service.addExpense(req.params.id, data);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.addExpense = addExpense;
const updateStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, changedBy } = validation_1.statusSchema.parse(req.body);
    const booking = yield service.updateStatus(req.params.id, status, changedBy || 'System');
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.updateStatus = updateStatus;
const uploadDutySlips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const files = req.files || [];
    const uploadedBy = req.body.uploadedBy || 'System'; // Get from request body or use default
    const booking = yield service.uploadDutySlips(req.params.id, files, uploadedBy);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.uploadDutySlips = uploadDutySlips;
const removeDutySlip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { path } = req.body;
    const booking = yield service.removeDutySlip(req.params.id, path);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.removeDutySlip = removeDutySlip;
const addPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.bookingPaymentSchema.parse(req.body);
    const payment = Object.assign(Object.assign({}, data), { paidOn: new Date(data.paidOn) });
    const booking = yield service.addPayment(req.params.id, payment);
    if (!booking)
        return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
});
exports.addPayment = addPayment;
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = yield service.listPayments(req.params.id);
    res.json(payments);
});
exports.getPayments = getPayments;
// Driver specific payments tied to a booking
const addDriverPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.driverBookingPaymentSchema.parse(Object.assign(Object.assign({}, req.body), { bookingId: req.params.id }));
    try {
        const payment = yield (0, payment_service_1.createDriverBookingPayment)({
            bookingId: data.bookingId,
            driverId: data.driverId,
            mode: data.mode,
            amount: data.amount,
            fuelQuantity: data.fuelQuantity,
            fuelRate: data.fuelRate,
            description: data.description,
        });
        res.status(201).json(payment);
    }
    catch (e) {
        res.status(400).json({ message: e.message || 'Failed to create driver payment' });
    }
});
exports.addDriverPayment = addDriverPayment;
const listDriverPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payments = yield (0, payment_service_1.listDriverBookingPayments)(req.params.id);
    res.json(payments);
});
exports.listDriverPayments = listDriverPayments;
const updateDriverPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = validation_1.driverBookingPaymentUpdateSchema.parse(req.body);
    try {
        const updated = yield (0, payment_service_1.updateDriverBookingPayment)(req.params.paymentId, data);
        if (!updated)
            return res.status(404).json({ message: 'Driver payment not found' });
        res.json(updated);
    }
    catch (e) {
        res.status(400).json({ message: e.message || 'Failed to update driver payment' });
    }
});
exports.updateDriverPayment = updateDriverPayment;
const deleteDriverPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const deleted = yield (0, payment_service_1.deleteDriverBookingPayment)(req.params.paymentId);
    if (!deleted)
        return res.status(404).json({ message: 'Driver payment not found' });
    res.status(204).send();
});
exports.deleteDriverPayment = deleteDriverPayment;
const exportDriverPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Simple CSV export for now
    const payments = yield (0, payment_service_1.listDriverBookingPayments)(req.params.id);
    const headers = ['id', 'bookingId', 'driverId', 'mode', 'amount', 'description', 'date', 'fuelQuantity', 'fuelRate', 'computedAmount', 'settled', 'settledAt'];
    const rows = payments.map(p => {
        var _a, _b, _c;
        return [
            p._id,
            p.bookingId,
            p.entityId,
            p.driverPaymentMode || '',
            p.amount,
            p.description || '',
            p.date.toISOString(),
            (_a = p.fuelQuantity) !== null && _a !== void 0 ? _a : '',
            (_b = p.fuelRate) !== null && _b !== void 0 ? _b : '',
            (_c = p.computedAmount) !== null && _c !== void 0 ? _c : '',
            p.settled ? 'true' : 'false',
            p.settledAt ? p.settledAt.toISOString() : ''
        ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="driver-payments-${req.params.id}.csv"`);
    res.send(csv);
});
exports.exportDriverPayments = exportDriverPayments;
