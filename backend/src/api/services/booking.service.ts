// src/services/booking.service.ts
import { Booking, Payment } from '../models';
import { AuthRequest, IBooking } from '../types';
import fs from 'fs';
import path from 'path';
import { config } from '../../config';

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
  return booking.populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

/**
 * Convert a date string (YYYY-MM-DD) to UTC Date representing start of day in IST
 * IST is UTC+5:30, so start of day in IST (00:00:00 IST) = 18:30:00 previous day UTC
 * Example: 2025-12-24 00:00:00 IST = 2025-12-23 18:30:00 UTC
 */
const getISTStartOfDayUTC = (dateString: string): Date => {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at start of day in IST (00:00:00 IST)
  // IST is UTC+5:30, so we need to subtract 5 hours 30 minutes from UTC
  // Create UTC date for midnight IST, which is 18:30 previous day UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  // Subtract 5.5 hours (5 hours 30 minutes) to convert IST to UTC
  utcDate.setTime(utcDate.getTime() - (5.5 * 60 * 60 * 1000));
  return utcDate;
};

/**
 * Convert a date string (YYYY-MM-DD) to UTC Date representing end of day in IST
 * IST is UTC+5:30, so end of day in IST (23:59:59 IST) = 18:29:59 same day UTC
 * Example: 2025-12-24 23:59:59 IST = 2025-12-24 18:29:59 UTC
 */
const getISTEndOfDayUTC = (dateString: string): Date => {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at end of day in IST (23:59:59 IST)
  // IST is UTC+5:30, so we need to subtract 5 hours 30 minutes from UTC
  const utcDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  // Subtract 5.5 hours (5 hours 30 minutes) to convert IST to UTC
  utcDate.setTime(utcDate.getTime() - (5.5 * 60 * 60 * 1000));
  return utcDate;
};

export const getBookings = async (page: number, limit: number, filters: any, user?: AuthRequest['user']) => {
  const query: Record<string, any> = {};
  if (filters.status) query['status'] = filters.status;
  if (filters.source) query['bookingSource'] = filters.source;
  if (filters.startDate || filters.endDate) {
    const startDateQuery: Record<string, any> = {};
    
    if (filters.startDate) {
      // Convert IST date filter to UTC for proper comparison
      // If it's a date-only string (YYYY-MM-DD), treat it as IST date
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
        startDateQuery.$gte = getISTStartOfDayUTC(filters.startDate);
      } else {
        startDateQuery.$gte = new Date(filters.startDate);
      }
    }
    
    if (filters.endDate) {
      // Convert IST date filter to UTC for proper comparison
      // Filter by startDate (we're filtering bookings by their start date)
      if (/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
        startDateQuery.$lte = getISTEndOfDayUTC(filters.endDate);
      } else {
        startDateQuery.$lte = new Date(filters.endDate);
      }
    }
    
    if (Object.keys(startDateQuery).length > 0) {
      query['startDate'] = startDateQuery;
    }
  }
  if (filters.driverId && user?.role !== 'driver') query['driverId'] = filters.driverId;

  if (user?.role === 'driver') {
    if (!user.driverId) {
      return { bookings: [], total: 0 };
    }
    query['driverId'] = user.driverId;
  }

  if (user?.role === 'customer') {
    if (!user.customerId) {
      return { bookings: [], total: 0 };
    }
    query['customerId'] = user.customerId;
  }

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
  Booking.find(query).populate('companyId driverId vehicleId vehicleCategoryId customerId').skip(skip).limit(limit).sort({ startDate: -1 }),
    Booking.countDocuments(query),
  ]);
  return { bookings, total };
};

export const getBookingById = async (id: string, user?: AuthRequest['user']) => {
  const filter: Record<string, any> = { _id: id };
  if (user?.role === 'driver') {
    if (!user.driverId) return null;
    filter.driverId = user.driverId;
  }
  if (user?.role === 'customer') {
    if (!user.customerId) return null;
    filter.customerId = user.customerId;
  }
  return Booking.findOne(filter).populate('companyId driverId vehicleId vehicleCategoryId customerId');
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
  return Booking.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const deleteBooking = async (id: string) => {
  // Delete all driver payments associated with this booking
  await Payment.deleteMany({ bookingId: id, entityType: 'driver' });
  // Delete the booking
  return Booking.findByIdAndDelete(id);
};

export const addExpense = async (bookingId: string, expense: IBooking['expenses'][0]) => {
  return Booking.findByIdAndUpdate(bookingId, { $push: { expenses: expense } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
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
  ).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const deleteExpense = async (bookingId: string, expenseId: string) => {
  return Booking.findByIdAndUpdate(
    bookingId,
    { $pull: { expenses: { _id: expenseId } } },
    { new: true }
  ).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const updateStatus = async (bookingId: string, status: IBooking['status'], changedBy: string, user?: AuthRequest['user']) => {
  const change = { status, timestamp: new Date(), changedBy };
  const filter: Record<string, any> = { _id: bookingId };
  if (user?.role === 'driver') {
    if (!user.driverId) return null;
    filter.driverId = user.driverId;
  }
  if (user?.role === 'customer') {
    if (!user.customerId) return null;
    filter.customerId = user.customerId;
  }
  return Booking.findOneAndUpdate(filter, { status, $push: { statusHistory: change } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const uploadDutySlips = async (bookingId: string, files: Express.Multer.File[], uploadedBy: string) => {
  const dutySlips = files.map(file => ({
    path: `DutySlips/${file.filename}`, // Store path relative to uploads directory: DutySlips/filename
    uploadedBy,
    uploadedAt: new Date(),
    description: file.originalname || `Duty slip uploaded at ${new Date().toISOString()}`,
  }));
  return Booking.findByIdAndUpdate(bookingId, { $push: { dutySlips: { $each: dutySlips } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const removeDutySlip = async (bookingId: string, dutySlipPath: string) => {
  // Delete the physical file from filesystem
  try {
    // Construct full file path (dutySlipPath is like "DutySlips/filename.png")
    const fullPath = path.join(config.uploadDir, dutySlipPath);
    
    // Check if file exists and delete it
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted file: ${fullPath}`);
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  } catch (error: any) {
    console.error(`Error deleting file ${dutySlipPath}:`, error.message);
    // Continue with database removal even if file deletion fails
  }
  
  // Remove from database
  return Booking.findByIdAndUpdate(bookingId, { $pull: { dutySlips: { path: dutySlipPath } } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const addPayment = async (bookingId: string, payment: NonNullable<IBooking['payments']>[number]) => {
  return Booking.findByIdAndUpdate(bookingId, { $push: { payments: payment } }, { new: true }).populate('companyId driverId vehicleId vehicleCategoryId customerId');
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
  ).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};

export const deletePayment = async (bookingId: string, paymentId: string) => {
  return Booking.findByIdAndUpdate(
    bookingId,
    { $pull: { payments: { _id: paymentId } } },
    { new: true }
  ).populate('companyId driverId vehicleId vehicleCategoryId customerId');
};
