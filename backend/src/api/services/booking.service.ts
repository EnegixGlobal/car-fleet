// src/services/booking.service.ts
import { Booking } from '../models';
import { IBooking } from '../types';

export const createBooking = async (data: Omit<IBooking, '_id' | 'createdAt' | 'statusHistory' | 'expenses' | 'dutySlips' | 'billed' | 'balance'>) => {
  const booking = new Booking({
    ...data,
    balance: data.totalAmount - data.advanceReceived,
    status: 'booked',
    expenses: [],
    dutySlips: [],
    billed: false,
    statusHistory: [{
      status: 'booked',
      timestamp: new Date(),
      changedBy: 'System', // or current user
    }],
  });
  await booking.save();
  return booking.populate('companyId driverId vehicleId customerId');
};

export const getBookings = async (page: number, limit: number, filters: any) => {
  const query: Record<string, any> = {};
  if (filters.status) query['status'] = filters.status;
  if (filters.source) query['bookingSource'] = filters.source;
  if (filters.startDate) query['startDate'] = { $gte: new Date(filters.startDate) };
  if (filters.endDate) query['endDate'] = { $lte: new Date(filters.endDate) };
  if (filters.driverId) query['driverId'] = filters.driverId;

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
  Booking.find(query).populate('companyId driverId vehicleId customerId').skip(skip).limit(limit).sort({ startDate: -1 }),
    Booking.countDocuments(query),
  ]);
  return { bookings, total };
};

export const getBookingById = async (id: string) => {
  return Booking.findById(id).populate('companyId driverId vehicleId customerId');
};

export const updateBooking = async (id: string, updates: Partial<IBooking>) => {
  const updateDoc: any = { ...updates };
  if (updates.totalAmount !== undefined || updates.advanceReceived !== undefined) {
    // Recompute balance using existing values if one side missing
    const current = await Booking.findById(id).select('totalAmount advanceReceived');
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
  return Booking.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true }).populate('companyId driverId vehicleId customerId');
};

export const deleteBooking = async (id: string) => {
  return Booking.findByIdAndDelete(id);
};

export const addExpense = async (bookingId: string, expense: IBooking['expenses'][0]) => {
  return Booking.findByIdAndUpdate(bookingId, { $push: { expenses: expense } }, { new: true }).populate('companyId driverId vehicleId customerId');
};

export const updateExpense = async (
  bookingId: string,
  expenseId: string,
  updates: Partial<IBooking['expenses'][0]>
) => {
  // Use positional operator to update the matching embedded expense
  return Booking.findOneAndUpdate(
    { _id: bookingId, 'expenses._id': expenseId },
    {
      $set: {
        'expenses.$.type': updates.type,
        'expenses.$.amount': updates.amount,
        'expenses.$.description': updates.description,
        'expenses.$.receipt': updates.receipt,
      },
    },
    { new: true, runValidators: true }
  ).populate('companyId driverId vehicleId customerId');
};

export const deleteExpense = async (bookingId: string, expenseId: string) => {
  return Booking.findByIdAndUpdate(
    bookingId,
    { $pull: { expenses: { _id: expenseId } } },
    { new: true }
  ).populate('companyId driverId vehicleId customerId');
};

export const updateStatus = async (bookingId: string, status: IBooking['status'], changedBy: string) => {
  const change = { status, timestamp: new Date(), changedBy };
  return Booking.findByIdAndUpdate(bookingId, { status, $push: { statusHistory: change } }, { new: true }).populate('companyId driverId vehicleId customerId');
};

export const uploadDutySlips = async (bookingId: string, files: Express.Multer.File[], uploadedBy: string) => {
  const dutySlips = files.map(file => ({
    path: file.path,
    uploadedBy,
    uploadedAt: new Date(),
    description: `Duty slip uploaded at ${new Date().toISOString()}`,
  }));
  return Booking.findByIdAndUpdate(bookingId, { $push: { dutySlips: { $each: dutySlips } } }, { new: true }).populate('companyId driverId vehicleId customerId');
};

export const removeDutySlip = async (bookingId: string, dutySlipPath: string) => {
  return Booking.findByIdAndUpdate(bookingId, { $pull: { dutySlips: { path: dutySlipPath } } }, { new: true }).populate('companyId driverId vehicleId customerId');
};

export const addPayment = async (bookingId: string, payment: NonNullable<IBooking['payments']>[number]) => {
  return Booking.findByIdAndUpdate(bookingId, { $push: { payments: payment } }, { new: true }).populate('companyId driverId vehicleId customerId');
};

export const listPayments = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId).select('payments');
  return booking?.payments || [];
};

export const updatePayment = async (
  bookingId: string,
  paymentId: string,
  updates: Partial<NonNullable<IBooking['payments']>[number]>
) => {
  return Booking.findOneAndUpdate(
    { _id: bookingId, 'payments._id': paymentId },
    {
      $set: {
        'payments.$.amount': updates.amount,
        'payments.$.comments': updates.comments,
        'payments.$.collectedBy': updates.collectedBy,
        'payments.$.paidOn': updates.paidOn,
      },
    },
    { new: true, runValidators: true }
  ).populate('companyId driverId vehicleId customerId');
};

export const deletePayment = async (bookingId: string, paymentId: string) => {
  return Booking.findByIdAndUpdate(
    bookingId,
    { $pull: { payments: { _id: paymentId } } },
    { new: true }
  ).populate('companyId driverId vehicleId customerId');
};
