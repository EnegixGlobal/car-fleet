// src/controllers/driver.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as service from '../services';
import { driverSchema, updateDriverSchema, advanceSchema } from '../validation';
import { upload } from '../middleware';
// Cloudinary imports commented out - using local system uploads instead
// import { uploadToCloudinary, isCloudinaryConfigured } from '../../config/cloudinary';
import path from 'path';

export const createDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If multipart form-data used, multer (upload middleware) should have run before this controller.
    const data = driverSchema.parse(req.body);
    const driverData: any = {
      ...data,
      licenseExpiry: new Date(data.licenseExpiry),
      policeVerificationExpiry: new Date(data.policeVerificationExpiry),
      dateOfJoining: new Date(data.dateOfJoining),
      status: data.status || 'active',
    };
    // Handle uploaded files if present - Using local system uploads
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const assign = async (field: string, targetField: string) => {
      const fArr = files?.[field];
      if (fArr && fArr[0]) {
        // Save only the filename, not the full URL
        const filename = path.basename(fArr[0].path);
        (driverData as any)[targetField] = filename;
      }
    };
    await Promise.all([
      assign('photo','photo'),
      assign('licenseDocument','licenseDocument'),
      assign('policeVerificationDocument','policeVerificationDocument'),
      assign('document','document')
    ]);
    const driver = await service.createDriver(driverData);
    res.status(201).json(driver);
  } catch (err) {
    next(err);
  }
};

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const filters = { status: req.query.status, paymentMode: req.query.paymentMode };
    const result = await service.getDrivers(page, limit, filters);
    res.json(result);
  } catch (err) { next(err); }
};

export const getDriverById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driver = await service.getDriverById(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) { next(err); }
};

export const updateDriver = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateDriverSchema.parse(req.body);
    const updateData: any = { ...data };
    // Convert date strings to Date objects
    if (updateData.licenseExpiry) updateData.licenseExpiry = new Date(updateData.licenseExpiry);
    if (updateData.policeVerificationExpiry) updateData.policeVerificationExpiry = new Date(updateData.policeVerificationExpiry);
    if (updateData.dateOfJoining) updateData.dateOfJoining = new Date(updateData.dateOfJoining as any);
    const ufiles = req.files as Record<string, Express.Multer.File[]> | undefined;
    const assign = async (field: string, targetField: string) => {
      const fArr = ufiles?.[field];
      if (fArr && fArr[0]) {
        // Save only the filename, not the full URL
        const filename = path.basename(fArr[0].path);
        (updateData as any)[targetField] = filename;
      }
    };
    await Promise.all([
      assign('photo','photo'),
      assign('licenseDocument','licenseDocument'),
      assign('policeVerificationDocument','policeVerificationDocument'),
      assign('document','document')
    ]);
    const driver = await service.updateDriver(req.params.id, updateData);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) { next(err); }
};

export const deleteDriver = async (req: Request, res: Response, next: NextFunction) => {
  try { await service.deleteDriver(req.params.id); res.status(204).send(); } catch (err) { next(err); }
};

export const addAdvance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = advanceSchema.parse(req.body);
    const advanceData = {
      ...data,
      date: new Date(),
      settled: false,
      description: data.description || '', // Ensure description is always a string
    };
    const driver = await service.addAdvance(req.params.id, advanceData);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) { next(err); }
};

export const settleAdvance = async (req: Request, res: Response, next: NextFunction) => {
  try { const { advanceId } = req.body; await service.settleAdvance(req.params.id, advanceId); res.status(200).json({ message: 'Advance settled' }); } catch (err) { next(err); }
};