// src/models/vehicleCategory.model.ts
import { Schema, model } from 'mongoose';
import { IVehicleCategory } from '../types';

const vehicleCategorySchema = new Schema<IVehicleCategory>({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const VehicleCategory = model<IVehicleCategory>('VehicleCategory', vehicleCategorySchema);
