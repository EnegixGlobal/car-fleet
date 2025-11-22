// src/services/payment.service.ts
import { Payment, Company, Driver, Booking } from '../models';
import { IPayment } from '../types';

export const createPayment = async (data: Omit<IPayment, '_id'>) => {
  const payment = new Payment(data);
  await payment.save();
  if (data.entityType === 'customer' && data.type === 'received') {
    await Company.updateOne({ _id: data.entityId }, { $inc: { outstandingAmount: -data.amount } });
  } else if (data.entityType === 'driver' && data.type === 'paid' && data.relatedAdvanceId) {
    await Driver.updateOne(
      { _id: data.entityId, 'advances.id': data.relatedAdvanceId },
      { $set: { 'advances.$.settled': true } }
    );
  }
  return payment;
};

export const getPayments = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find().skip(skip).limit(limit).sort({ date: -1 }),
    Payment.countDocuments(),
  ]);
  return { payments, total };
};

// Create a driver payment tied to a booking (per-trip, daily, or fuel-basis)
export const createDriverBookingPayment = async (data: {
  driverId: string;
  bookingId: string;
  mode: 'per-trip'|'daily'|'fuel-basis';
  amount?: number;
  fuelQuantity?: number;
  fuelRate?: number;
  description?: string;
  distanceKm?: number;
  mileage?: number;
  action?: 'pay' | 'refund';
}) => {
  // Ensure booking exists and matches driver if driver assigned
  const booking = await Booking.findById(data.bookingId).select('driverId');
  if (!booking) throw new Error('Booking not found');
  if (booking.driverId && booking.driverId.toString() !== data.driverId) {
    throw new Error('Driver does not match booking');
  }
  let fuelQuantity = data.fuelQuantity;
  if (data.mode === 'fuel-basis' && (fuelQuantity === undefined || fuelQuantity === null)) {
    if (data.distanceKm !== undefined && data.mileage && data.mileage > 0) {
      fuelQuantity = data.distanceKm / data.mileage;
    }
  }
  const computedAmount = data.mode === 'fuel-basis' && fuelQuantity !== undefined && data.fuelRate !== undefined
    ? fuelQuantity * data.fuelRate
    : undefined;
  const baseAmount = data.mode === 'fuel-basis' ? (computedAmount || 0) : (data.amount || 0);
  const normalizedAmount = Math.abs(baseAmount);
  const action = data.action === 'refund' ? 'refund' : 'pay';
  const paymentDoc: Omit<IPayment,'_id'> = {
    entityId: booking.driverId || (data as any).driverId,
    entityType: 'driver',
    amount: normalizedAmount,
    type: action === 'refund' ? 'received' : 'paid',
    date: new Date(),
    description:
      data.description ||
      `${data.mode} driver ${action === 'refund' ? 'refund' : 'payment'}`,
    relatedAdvanceId: undefined,
    bookingId: booking._id,
    driverPaymentMode: data.mode,
    fuelQuantity,
    fuelRate: data.fuelRate,
    computedAmount,
    distanceKm: data.distanceKm,
    mileage: data.mileage,
  } as any;
  const payment = new Payment(paymentDoc);
  await payment.save();
  return payment;
};

export const listDriverBookingPayments = async (bookingId: string) => {
  return Payment.find({ bookingId, entityType: 'driver' }).sort({ date: -1 });
};

export const updateDriverBookingPayment = async (paymentId: string, updates: {
  mode?: 'per-trip'|'daily'|'fuel-basis'; amount?: number; fuelQuantity?: number; fuelRate?: number; description?: string; settle?: boolean; distanceKm?: number; mileage?: number;
}) => {
  const doc: any = { ...updates };
  if (updates.mode === 'fuel-basis') {
    let fQty = updates.fuelQuantity;
    if ((fQty === undefined || fQty === null) && updates.distanceKm !== undefined && updates.mileage && updates.mileage > 0) {
      fQty = updates.distanceKm / updates.mileage;
      doc.fuelQuantity = fQty;
    }
    if (fQty !== undefined && updates.fuelRate !== undefined) {
      doc.amount = fQty * updates.fuelRate; // recompute
      doc.computedAmount = doc.amount;
    }
  }
  if (updates.settle) {
    doc.settled = true;
    doc.settledAt = new Date();
  }
  delete doc.settle;
  return Payment.findByIdAndUpdate(paymentId, doc, { new: true });
};

export const deleteDriverBookingPayment = async (paymentId: string) => {
  return Payment.findByIdAndDelete(paymentId);
};