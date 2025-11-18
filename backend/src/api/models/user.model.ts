// src/models/user.model.ts
import { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver' },
  customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = model<IUser>('User', userSchema);