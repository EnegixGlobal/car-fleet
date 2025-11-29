// src/controllers/company.controller.ts
import { Request, Response } from 'express';
import * as service from '../services';
import { companySchema, updateCompanySchema } from '../validation';
import { Booking, Payment, Company } from '../models';

export const createCompany = async (req: Request, res: Response) => {
  const data = companySchema.parse(req.body);
  const company = await service.createCompany(data);
  res.status(201).json(company);
};

export const getCompanies = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100000; // Show all data by default
  const filters = { outstandingGt: req.query.outstandingGt, minOutstanding: req.query.minOutstanding, startDate: req.query.startDate, endDate: req.query.endDate };
  const result = await service.getCompanies(page, limit, filters);
  res.json(result);
};

export const getCompanyById = async (req: Request, res: Response) => {
  const company = await service.getCompanyById(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

export const updateCompany = async (req: Request, res: Response) => {
  const data = updateCompanySchema.parse(req.body);
  const company = await service.updateCompany(req.params.id, data);
  if (!company) return res.status(404).json({ message: 'Company not found' });
  res.json(company);
};

export const deleteCompany = async (req: Request, res: Response) => {
  await service.deleteCompany(req.params.id);
  res.status(204).send();
};

export const recordPayment = async (req: Request, res: Response) => {
  const { amount, description } = req.body;
  await service.recordPayment(req.params.id, amount, description);
  res.status(200).json({ message: 'Payment recorded' });
};

export const getCompanyOverview = async (req: Request, res: Response) => {
  const companyId = req.params.id;
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ message: 'Company not found' });

  const [bookings, payments] = await Promise.all([
    Booking.find({ companyId }).sort({ startDate: -1 }).limit(20),
    Payment.find({ entityType: 'customer', entityId: companyId }).sort({ date: -1 }).limit(20),
  ]);

  const metrics = {
    bookings: bookings.length,
    revenue: bookings.reduce((s, b) => s + b.totalAmount, 0),
    expenses: bookings.reduce((s, b) => s + (b.expenses?.reduce((eSum, e) => eSum + e.amount, 0) || 0), 0),
    completed: bookings.filter(b => b.status === 'completed').length,
    outstanding: company.outstandingAmount,
  };

  res.json({
    company,
    metrics,
    bookings,
    payments,
  });
};