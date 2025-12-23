// src/controllers/vehicleServicing.controller.ts
import { Request, Response } from 'express';
import { vehicleServicingSchema, updateVehicleServicingSchema } from '../validation';
import * as service from '../services';

export const getServicing = async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const doc = await service.getVehicleServicing(vehicleId);
  if (!doc) return res.json({ vehicleId, oilChanges: [], partsReplacements: [], tyres: [], installments: [], insurances: [], legalPapers: [] });
  res.json(doc);
};

export const upsertServicing = async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const data = updateVehicleServicingSchema.parse({ ...req.body, vehicleId });
  const doc = await service.upsertVehicleServicing(vehicleId, data as any);
  res.status(200).json(doc);
};

export const appendSection = async (req: Request, res: Response) => {
  const { vehicleId, section } = req.params as { vehicleId: string; section: string };
  const allowed: any = ['oilChanges','partsReplacements','tyres','installments','insurances','legalPapers'];
  if (!allowed.includes(section)) return res.status(400).json({ message: 'Invalid section' });
  const entries = Array.isArray(req.body) ? req.body : [req.body];
  const doc = await service.addServicingEntries(vehicleId, section as any, entries);
  res.json(doc);
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await service.getServicingNotifications();
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch notifications' });
  }
};