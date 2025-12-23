// src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';

// Ensure upload directory exists
const uploadDir = config.uploadDir || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Duty slips subdirectory
const dutySlipsDir = path.join(uploadDir, 'DutySlips');
if (!fs.existsSync(dutySlipsDir)) {
  fs.mkdirSync(dutySlipsDir, { recursive: true });
}

// Driver subdirectory
const driverDir = path.join(uploadDir, 'Driver');
if (!fs.existsSync(driverDir)) {
  fs.mkdirSync(driverDir, { recursive: true });
}

// Vehicle subdirectory
const vehicleDir = path.join(uploadDir, 'Vehicle');
if (!fs.existsSync(vehicleDir)) {
  fs.mkdirSync(vehicleDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  },
});

// Storage specifically for duty slips (saves to DutySlips subfolder)
const dutySlipsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, dutySlipsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  },
});

// Storage specifically for driver files (saves to Driver subfolder)
const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, driverDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  },
});

// Storage specifically for vehicle files (saves to Vehicle subfolder)
const vehicleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vehicleDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  },
});

// File filter to accept images and PDFs
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only images and PDFs are allowed. Got: ${file.mimetype}`));
  }
};

export const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'policeVerificationDocument', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

// Multer middleware for duty slips (multiple files) - saves to DutySlips subfolder
export const uploadDutySlips = multer({ 
  storage: dutySlipsStorage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Max 10 files
  }
}).array('dutySlips', 10);

// Multer middleware for driver files - saves to Driver subfolder
export const uploadDriver = multer({ 
  storage: driverStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'policeVerificationDocument', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);

// Multer middleware for vehicle files - saves to Vehicle subfolder
export const uploadVehicle = multer({ 
  storage: vehicleStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'document', maxCount: 1 },
]);