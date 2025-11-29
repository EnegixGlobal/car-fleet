export const getUserById = async (req: Request, res: Response) => {
  const user = await service.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import * as service from '../services';
import { registerSchema, loginSchema } from '../validation';

export const register = async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const user = await service.registerUser(data);
  res.status(201).json(user);
};

export const login = async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await service.loginUser(data.email, data.password);
  res.json(result);
};

export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100000; // Show all data by default
  const result = await service.getUsers(page, limit);
  res.json(result);
};

export const updateUser = async (req: Request, res: Response) => {
  const result = await service.updateUser(req.params.id, req.body);
  res.json(result);
};

export const deleteUser = async (req: Request, res: Response) => {
  await service.deleteUser(req.params.id);
  res.status(204).send();
};