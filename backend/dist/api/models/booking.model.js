"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
// src/models/booking.model.ts
const mongoose_1 = require("mongoose");
const expenseSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: ["fuel", "toll", "parking", "night", "perday", "rent", "other"],
    },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    receipt: { type: String },
});
const statusChangeSchema = new mongoose_1.Schema({
    status: {
        type: String,
        required: true,
        enum: ["booked", "ongoing", "completed", "yet-to-start", "canceled"],
    },
    timestamp: { type: Date, default: Date.now },
    changedBy: { type: String, required: true },
});
const dutySlipSchema = new mongoose_1.Schema({
    path: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String },
});
const bookingPaymentSchema = new mongoose_1.Schema({
    amount: { type: Number, required: true },
    comments: { type: String },
    collectedBy: { type: String },
    paidOn: { type: Date, required: true },
});
const bookingSchema = new mongoose_1.Schema({
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    bookingSource: {
        type: String,
        required: true,
        enum: ["company", "travel-agency", "individual"],
    },
    companyId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Company" },
    pickupLocation: { type: String, required: true },
    dropLocation: { type: String, required: true },
    journeyType: {
        type: String,
        required: true,
        enum: [
            "outstation-one-way",
            "outstation",
            "local-outstation",
            "local",
            "transfer",
        ],
    },
    cityOfWork: { type: String },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    vehicleId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Vehicle" },
    driverId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Driver" },
    tariffRate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    advanceReceived: { type: Number, required: true },
    balance: { type: Number, required: true },
    advanceReason: { type: String },
    status: {
        type: String,
        required: true,
        enum: ["booked", "ongoing", "completed", "yet-to-start", "canceled"],
        index: true,
    },
    dutySlips: [dutySlipSchema],
    expenses: [expenseSchema],
    payments: [bookingPaymentSchema],
    // Total amount finally paid out to driver for this booking (computed/stored)
    finalPaid: { type: Number, default: 0 },
    billed: { type: Boolean, default: false },
    dutySlipSubmitted: { type: Boolean, default: false },
    dutySlipSubmittedToCompany: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true },
    statusHistory: [statusChangeSchema],
});
exports.Booking = (0, mongoose_1.model)("Booking", bookingSchema);
