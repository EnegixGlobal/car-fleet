// src/controllers/booking.controller.ts
import { Response } from "express";
import { Types } from "mongoose";
import * as service from "../services";
import {
  bookingSchema,
  updateBookingSchema,
  expenseSchema,
  statusSchema,
  bookingPaymentSchema,
  driverBookingPaymentSchema,
  driverBookingPaymentUpdateSchema,
} from "../validation";
import { AuthRequest } from "../types";
import {
  createDriverBookingPayment,
  listDriverBookingPayments,
  updateDriverBookingPayment,
  deleteDriverBookingPayment,
} from "../services/payment.service";

export const createBooking = async (req: AuthRequest, res: Response) => {
  const data = bookingSchema.parse(req.body);
  const bookingData = {
    ...data,
    customerId: data.customerId
      ? new Types.ObjectId(data.customerId)
      : undefined,
    companyId: data.companyId ? new Types.ObjectId(data.companyId) : undefined,
    vehicleId: data.vehicleId ? new Types.ObjectId(data.vehicleId) : undefined,
    vehicleCategoryId: data.vehicleCategoryId
      ? new Types.ObjectId(data.vehicleCategoryId)
      : undefined,
    driverId: data.driverId ? new Types.ObjectId(data.driverId) : undefined,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: "booked" as const,
    dutySlipSubmitted: false,
    dutySlipSubmittedToCompany: false,
  };
  const booking = await service.createBooking(bookingData);
  res.status(201).json(booking);
};

export const getBookings = async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const filters = {
    status: req.query.status,
    source: req.query.source,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    driverId: req.query.driverId,
  };
  const result = await service.getBookings(page, limit, filters, req.user);
  res.json(result);
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  const booking = await service.getBookingById(req.params.id, req.user);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  const data = updateBookingSchema.parse(req.body);
  const updateData: any = { ...data };

  // Convert string IDs to ObjectIds
  if (updateData.companyId)
    updateData.companyId = new Types.ObjectId(updateData.companyId);
  if (updateData.vehicleId)
    updateData.vehicleId = new Types.ObjectId(updateData.vehicleId);
  if (updateData.vehicleCategoryId)
    updateData.vehicleCategoryId = new Types.ObjectId(
      updateData.vehicleCategoryId
    );
  if (updateData.driverId)
    updateData.driverId = new Types.ObjectId(updateData.driverId);
  if (updateData.customerId)
    updateData.customerId = new Types.ObjectId(updateData.customerId);

  // Convert date strings to Date objects
  if (updateData.startDate)
    updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

  const booking = await service.updateBooking(req.params.id, updateData);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const deleteBooking = async (req: AuthRequest, res: Response) => {
  await service.deleteBooking(req.params.id);
  res.status(204).send();
};

export const addExpense = async (req: AuthRequest, res: Response) => {
  const data = expenseSchema.parse(req.body);
  const booking = await service.addExpense(req.params.id, data);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  const data = expenseSchema.partial().parse(req.body);
  const booking = await service.updateExpense(
    req.params.id,
    req.params.expenseId,
    data as any
  );
  if (!booking) return res.status(404).json({ message: 'Booking or expense not found' });
  res.json(booking);
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const booking = await service.deleteExpense(req.params.id, req.params.expenseId);
  if (!booking) return res.status(404).json({ message: 'Booking or expense not found' });
  res.json(booking);
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  const { status, changedBy } = statusSchema.parse(req.body);
  const booking = await service.updateStatus(
    req.params.id,
    status,
    changedBy || "System",
    req.user
  );
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const uploadDutySlips = async (req: AuthRequest, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const uploadedBy = req.body.uploadedBy || "System"; // Get from request body or use default
  const booking = await service.uploadDutySlips(
    req.params.id,
    files,
    uploadedBy
  );
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const removeDutySlip = async (req: AuthRequest, res: Response) => {
  const { path } = req.body;
  const booking = await service.removeDutySlip(req.params.id, path);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const addPayment = async (req: AuthRequest, res: Response) => {
  const data = bookingPaymentSchema.parse(req.body);
  const payment = { ...data, paidOn: new Date(data.paidOn) };
  const booking = await service.addPayment(req.params.id, payment as any);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  const payments = await service.listPayments(req.params.id);
  res.json(payments);
};

export const updatePayment = async (req: AuthRequest, res: Response) => {
  // Allow partial updates; coerce paidOn to Date if provided
  const data = bookingPaymentSchema.partial().parse(req.body);
  const updates: any = { ...data };
  if (updates.paidOn) updates.paidOn = new Date(updates.paidOn);
  const booking = await service.updatePayment(
    req.params.id,
    req.params.paymentId,
    updates
  );
  if (!booking) return res.status(404).json({ message: 'Booking or payment not found' });
  res.json(booking);
};

export const deletePayment = async (req: AuthRequest, res: Response) => {
  const booking = await service.deletePayment(req.params.id, req.params.paymentId);
  if (!booking) return res.status(404).json({ message: 'Booking or payment not found' });
  res.json(booking);
};

// Driver specific payments tied to a booking
export const addDriverPayment = async (req: AuthRequest, res: Response) => {
  const data = driverBookingPaymentSchema.parse({
    ...req.body,
    bookingId: req.params.id,
  });
  try {
    const payment = await createDriverBookingPayment({
      bookingId: data.bookingId,
      driverId: data.driverId,
      mode: data.mode,
      amount: data.amount,
      fuelQuantity: data.fuelQuantity,
      fuelRate: data.fuelRate,
      description: data.description,
    });
    res.status(201).json(payment);
  } catch (e: any) {
    res
      .status(400)
      .json({ message: e.message || "Failed to create driver payment" });
  }
};

export const listDriverPayments = async (req: AuthRequest, res: Response) => {
  const payments = await listDriverBookingPayments(req.params.id);
  res.json(payments);
};

export const updateDriverPayment = async (req: AuthRequest, res: Response) => {
  const data = driverBookingPaymentUpdateSchema.parse(req.body);
  try {
    const updated = await updateDriverBookingPayment(
      req.params.paymentId,
      data as any
    );
    if (!updated)
      return res.status(404).json({ message: "Driver payment not found" });
    res.json(updated);
  } catch (e: any) {
    res
      .status(400)
      .json({ message: e.message || "Failed to update driver payment" });
  }
};

export const deleteDriverPayment = async (req: AuthRequest, res: Response) => {
  const deleted = await deleteDriverBookingPayment(req.params.paymentId);
  if (!deleted)
    return res.status(404).json({ message: "Driver payment not found" });
  res.status(204).send();
};

export const exportDriverPayments = async (req: AuthRequest, res: Response) => {
  // Simple CSV export for now
  const payments = await listDriverBookingPayments(req.params.id);
  const headers = [
    "id",
    "bookingId",
    "driverId",
    "mode",
    "amount",
    "description",
    "date",
    "fuelQuantity",
    "fuelRate",
    "computedAmount",
    "settled",
    "settledAt",
  ];
  const rows = payments.map((p) =>
    [
      (p as any)._id,
      (p as any).bookingId,
      (p as any).entityId,
      (p as any).driverPaymentMode || "",
      p.amount,
      (p as any).description || "",
      p.date.toISOString(),
      (p as any).fuelQuantity ?? "",
      (p as any).fuelRate ?? "",
      (p as any).computedAmount ?? "",
      (p as any).settled ? "true" : "false",
      (p as any).settledAt ? (p as any).settledAt.toISOString() : "",
    ].join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="driver-payments-${req.params.id}.csv"`
  );
  res.send(csv);
};
