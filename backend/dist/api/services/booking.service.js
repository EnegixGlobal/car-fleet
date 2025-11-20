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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.updatePayment = exports.listPayments = exports.addPayment = exports.removeDutySlip = exports.uploadDutySlips = exports.updateStatus = exports.deleteExpense = exports.updateExpense = exports.addExpense = exports.deleteBooking = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.createBooking = void 0;
// src/services/booking.service.ts
const models_1 = require("../models");
const createBooking = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = new models_1.Booking(Object.assign(Object.assign({}, data), { balance: data.totalAmount - data.advanceReceived, status: 'booked', expenses: [], dutySlips: [], billed: false, statusHistory: [{
                status: 'booked',
                timestamp: new Date(),
                changedBy: 'System', // or current user
            }] }));
    yield booking.save();
    return booking.populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.createBooking = createBooking;
const getBookings = (page, limit, filters, user) => __awaiter(void 0, void 0, void 0, function* () {
    const query = {};
    if (filters.status)
        query['status'] = filters.status;
    if (filters.source)
        query['bookingSource'] = filters.source;
    if (filters.startDate)
        query['startDate'] = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
        const endCriteria = query['endDate'] || {};
        endCriteria.$lte = new Date(filters.endDate);
        query['endDate'] = endCriteria;
    }
    if (filters.driverId && (user === null || user === void 0 ? void 0 : user.role) !== 'driver')
        query['driverId'] = filters.driverId;
    if ((user === null || user === void 0 ? void 0 : user.role) === 'driver') {
        if (!user.driverId) {
            return { bookings: [], total: 0 };
        }
        query['driverId'] = user.driverId;
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === 'customer') {
        if (!user.customerId) {
            return { bookings: [], total: 0 };
        }
        query['customerId'] = user.customerId;
    }
    const skip = (page - 1) * limit;
    const [bookings, total] = yield Promise.all([
        models_1.Booking.find(query).populate('companyId driverId vehicleId vehicleCategoryId customerId').skip(skip).limit(limit).sort({ startDate: -1 }),
        models_1.Booking.countDocuments(query),
    ]);
    return { bookings, total };
});
exports.getBookings = getBookings;
const getBookingById = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = { _id: id };
    if ((user === null || user === void 0 ? void 0 : user.role) === 'driver') {
        if (!user.driverId)
            return null;
        filter.driverId = user.driverId;
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === 'customer') {
        if (!user.customerId)
            return null;
        filter.customerId = user.customerId;
    }
    return models_1.Booking.findOne(filter).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.getBookingById = getBookingById;
const updateBooking = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    const updateDoc = Object.assign({}, updates);
    if (updates.totalAmount !== undefined || updates.advanceReceived !== undefined) {
        // Recompute balance using existing values if one side missing
        const current = yield models_1.Booking.findById(id).select('totalAmount advanceReceived');
        if (current) {
            const total = updates.totalAmount !== undefined ? updates.totalAmount : current.totalAmount;
            const advance = updates.advanceReceived !== undefined ? updates.advanceReceived : current.advanceReceived;
            updateDoc.balance = total - advance;
        }
    }
    if (updates.status) {
        // Use Mongo $push for history while also updating status
        updateDoc.status = updates.status;
        updateDoc.$push = { statusHistory: { status: updates.status, timestamp: new Date(), changedBy: 'System' } };
    }
    return models_1.Booking.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.updateBooking = updateBooking;
const deleteBooking = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndDelete(id);
});
exports.deleteBooking = deleteBooking;
const addExpense = (bookingId, expense) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndUpdate(bookingId, { $push: { expenses: expense } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.addExpense = addExpense;
const updateExpense = (bookingId, expenseId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    // Use positional operator to update the matching embedded expense
    return models_1.Booking.findOneAndUpdate({ _id: bookingId, 'expenses._id': expenseId }, {
        $set: {
            'expenses.$.type': updates.type,
            'expenses.$.amount': updates.amount,
            'expenses.$.description': updates.description,
            'expenses.$.receipt': updates.receipt,
        },
    }, { new: true, runValidators: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.updateExpense = updateExpense;
const deleteExpense = (bookingId, expenseId) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndUpdate(bookingId, { $pull: { expenses: { _id: expenseId } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.deleteExpense = deleteExpense;
const updateStatus = (bookingId, status, changedBy, user) => __awaiter(void 0, void 0, void 0, function* () {
    const change = { status, timestamp: new Date(), changedBy };
    const filter = { _id: bookingId };
    if ((user === null || user === void 0 ? void 0 : user.role) === 'driver') {
        if (!user.driverId)
            return null;
        filter.driverId = user.driverId;
    }
    if ((user === null || user === void 0 ? void 0 : user.role) === 'customer') {
        if (!user.customerId)
            return null;
        filter.customerId = user.customerId;
    }
    return models_1.Booking.findOneAndUpdate(filter, { status, $push: { statusHistory: change } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.updateStatus = updateStatus;
const uploadDutySlips = (bookingId, files, uploadedBy) => __awaiter(void 0, void 0, void 0, function* () {
    const dutySlips = files.map(file => ({
        path: file.path,
        uploadedBy,
        uploadedAt: new Date(),
        description: `Duty slip uploaded at ${new Date().toISOString()}`,
    }));
    return models_1.Booking.findByIdAndUpdate(bookingId, { $push: { dutySlips: { $each: dutySlips } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.uploadDutySlips = uploadDutySlips;
const removeDutySlip = (bookingId, dutySlipPath) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndUpdate(bookingId, { $pull: { dutySlips: { path: dutySlipPath } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.removeDutySlip = removeDutySlip;
const addPayment = (bookingId, payment) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndUpdate(bookingId, { $push: { payments: payment } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.addPayment = addPayment;
const listPayments = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield models_1.Booking.findById(bookingId).select('payments');
    return (booking === null || booking === void 0 ? void 0 : booking.payments) || [];
});
exports.listPayments = listPayments;
const updatePayment = (bookingId, paymentId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findOneAndUpdate({ _id: bookingId, 'payments._id': paymentId }, {
        $set: {
            'payments.$.amount': updates.amount,
            'payments.$.comments': updates.comments,
            'payments.$.collectedBy': updates.collectedBy,
            'payments.$.paidOn': updates.paidOn,
        },
    }, { new: true, runValidators: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.updatePayment = updatePayment;
const deletePayment = (bookingId, paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    return models_1.Booking.findByIdAndUpdate(bookingId, { $pull: { payments: { _id: paymentId } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
});
exports.deletePayment = deletePayment;
