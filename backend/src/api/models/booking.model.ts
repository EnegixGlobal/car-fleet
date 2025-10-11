// src/models/booking.model.ts
import { Schema, model } from "mongoose";
import { IBooking, IExpense, IStatusChange, IBookingPayment } from "../types";

const expenseSchema = new Schema<IExpense>({
  type: {
    type: String,
    required: true,
    enum: ["fuel", "toll", "parking", "other"],
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  receipt: { type: String },
});

const statusChangeSchema = new Schema<IStatusChange>({
  status: {
    type: String,
    required: true,
    enum: ["booked", "ongoing", "completed", "yet-to-start", "canceled"],
  },
  timestamp: { type: Date, default: Date.now },
  changedBy: { type: String, required: true },
});

const dutySlipSchema = new Schema({
  path: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  description: { type: String },
});

const bookingPaymentSchema = new Schema<IBookingPayment>({
  amount: { type: Number, required: true },
  comments: { type: String },
  collectedBy: { type: String },
  paidOn: { type: Date, required: true },
});

const bookingSchema = new Schema<IBooking>({
  customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  bookingSource: {
    type: String,
    required: true,
    enum: ["company", "travel-agency", "individual"],
  },
  companyId: { type: Schema.Types.ObjectId, ref: "Company" },
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
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle" },
  driverId: { type: Schema.Types.ObjectId, ref: "Driver" },
  tariffRate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  advanceReceived: { type: Number, required: true },
  balance: { type: Number, required: true },
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

export const Booking = model<IBooking>("Booking", bookingSchema);
