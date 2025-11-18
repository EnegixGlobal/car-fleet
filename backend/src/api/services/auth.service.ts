import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HydratedDocument } from 'mongoose';
import { User, Driver, Customer } from '../models';
import { config } from '../../config';
import { IUser } from '../types';

type RegisterUserInput = Omit<IUser, '_id' | 'createdAt' | 'driverId' | 'customerId'> & {
  driverId?: string;
  customerId?: string;
};

const toStringId = (value?: HydratedDocument<any>['_id'] | null) =>
  value ? value.toString() : undefined;

const collectPhoneVariants = (phone: string) => {
  const trimmed = phone?.trim() || '';
  const digits = trimmed.replace(/\D/g, '');
  const variants = new Set<string>();
  if (trimmed) variants.add(trimmed);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);
  }
  return Array.from(variants).filter(Boolean);
};

const syncUserAssociations = async (user: HydratedDocument<IUser>) => {
  let driverId = toStringId(user.driverId as any);
  let customerId = toStringId(user.customerId as any);
  let dirty = false;

  if (user.role === 'driver' && !driverId) {
    const driver = await Driver.findOne({
      phone: { $in: collectPhoneVariants(user.phone) },
    }).select('_id phone');
    if (driver) {
      user.driverId = driver._id;
      driverId = driver._id.toString();
      dirty = true;
    }
  }

  if (user.role === 'customer' && !customerId) {
    const customer = await Customer.findOne({
      phone: { $in: collectPhoneVariants(user.phone) },
    }).select('_id phone');
    if (customer) {
      user.customerId = customer._id;
      customerId = customer._id.toString();
      dirty = true;
    }
  }

  if (dirty) {
    await user.save();
  }

  return { driverId, customerId };
};

export const getUserById = async (id: string) => {
  return User.findById(id).select('-password');
};

export const registerUser = async (data: RegisterUserInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error('Email in use');
  const hashed = await bcrypt.hash(data.password, 10);
  const user = new User({
    email: data.email,
    password: hashed,
    name: data.name,
    phone: data.phone,
    role: data.role,
    driverId: data.driverId,
    customerId: data.customerId,
  });
  await user.save();
  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const { driverId, customerId } = await syncUserAssociations(user);

  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, driverId, customerId },
    config.jwtSecret,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      driverId,
      customerId,
      createdAt: user.createdAt.toISOString(),
    },
  };
};

export const getUsers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);
  return { users, total };
};

export const updateUser = async (id: string, updates: Partial<IUser>) => {
  if (updates.password) updates.password = await bcrypt.hash(updates.password, 10);
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');
};

export const deleteUser = async (id: string) => {
  return User.findByIdAndDelete(id);
};