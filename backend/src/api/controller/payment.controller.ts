// src/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as service from '../services';
import { paymentSchema } from '../validation';

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = paymentSchema.parse(req.body);
    // Service expects date present (IPayment.date). Supply if omitted.
    const payment = await service.createPayment({ ...data, date: new Date() } as any);
    res.status(201).json(payment);
  } catch (e) { next(e); }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100000; // Show all data by default
    const result = await service.getPayments(page, limit);
    res.json(result);
  } catch (e) { next(e); }
};