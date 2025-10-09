// src/types/index.ts
import { Types } from "mongoose";
import { Request } from "express";

export type UserRole =
  | "admin"
  | "accountant"
  | "dispatcher"
  | "driver"
  | "customer";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: Date;
  password: string; // hashed
}

export interface IDriver {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  licenseNumber: string;
  aadhaar: string;
  photo?: string; // file path
  photoPublicId?: string;
  vehicleType: "owned" | "rented";
  licenseExpiry: Date;
  policeVerificationExpiry: Date;
  licenseDocument?: string; // file path
  licenseDocumentPublicId?: string;
  policeVerificationDocument?: string; // file path
  policeVerificationDocumentPublicId?: string;
  paymentMode: "per-trip" | "daily" | "monthly" | "fuel-basis";
  // Salary removed from required create fields; keep optional for backward compatibility / historical data
  salary?: number;
  dateOfJoining: Date; // new required field
  referenceNote?: string;
  document?: string; // generic uploaded document path (other than license/police verification)
  documentPublicId?: string;
  advances: IAdvance[];
  status: "active" | "inactive";
  createdAt: Date;
}

export interface IVehicle {
  _id: Types.ObjectId;
  registrationNumber: string;
  // Keep legacy string category for backward compatibility; prefer using categoryId referencing VehicleCategory
  category: string; // previously enum
  categoryId?: Types.ObjectId; // new reference
  owner: "owned" | "rented";
  insuranceExpiry: Date;
  fitnessExpiry: Date;
  permitExpiry: Date;
  pollutionExpiry: Date;
  status: "active" | "maintenance" | "inactive";
  photo?: string; // vehicle image path
  document?: string; // RC/permit document path
  mileageTrips?: number;
  mileageKm?: number;
  createdAt: Date;
}

export interface IVehicleCategory {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface IVehicleServicingRecordBase {
  date: Date;
}

export interface IOilChange extends IVehicleServicingRecordBase {
  price: number;
  kilometers: number;
}

export interface IPartReplacement extends IVehicleServicingRecordBase {
  part: string;
  price: number;
}

export interface ITyreEntry extends IVehicleServicingRecordBase {
  details: string; // description or brand/model
  price: number;
}

export interface IInstallment extends IVehicleServicingRecordBase {
  description: string;
  amount: number;
}

export interface IInsuranceEntry extends IVehicleServicingRecordBase {
  provider?: string;
  policyNumber?: string;
  cost: number;
  validFrom?: Date;
  validTo?: Date;
}

export interface ILegalPaperEntry extends IVehicleServicingRecordBase {
  type: string; // pollution, registration, other
  description?: string;
  cost: number;
  expiryDate?: Date;
}

export interface IVehicleServicing {
  _id: Types.ObjectId;
  vehicleId: Types.ObjectId;
  oilChanges: IOilChange[];
  partsReplacements: IPartReplacement[];
  tyres: ITyreEntry[];
  installments: IInstallment[];
  insurances: IInsuranceEntry[];
  legalPapers: ILegalPaperEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  _id: Types.ObjectId;
  name: string;
  gst: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  outstandingAmount: number;
  createdAt: Date;
}

// ...existing code...

export interface IExpense {
  type: "fuel" | "toll" | "parking" | "other";
  amount: number;
  description: string;
  receipt?: string; // file path
}

export interface IStatusChange {
  status: IBooking["status"];
  timestamp: Date;
  changedBy: string;
}

export interface IAdvance {
  amount: number;
  date: Date;
  settled: boolean;
  description: string;
}

export interface IPayment {
  _id: Types.ObjectId;
  entityId: Types.ObjectId;
  entityType: "customer" | "driver";
  amount: number;
  type: "received" | "paid";
  date: Date;
  description: string;
  relatedAdvanceId?: string;
  // Driver payment specific (when entityType==='driver' and optionally tied to a booking)
  bookingId?: Types.ObjectId; // booking for which driver is paid
  driverPaymentMode?: "per-trip" | "daily" | "fuel-basis";
  fuelQuantity?: number; // litres when fuel-basis
  fuelRate?: number; // per litre rate snapshot
  computedAmount?: number; // system calculated amount (e.g., fuelQuantity * fuelRate) separate from amount if manual override
  distanceKm?: number; // total trip distance (km) used to derive fuelQuantity (distanceKm / mileage)
  mileage?: number; // km per litre used with distanceKm
  settled?: boolean; // whether this driver payment is settled/approved
  settledAt?: Date; // timestamp of settlement
}

export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole };
}

export interface IDutySlip {
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
}

export interface IBooking {
  _id: Types.ObjectId;
  customerId?: Types.ObjectId; // reference to Customer (optional for backward compatibility)
  customerName: string;
  customerPhone: string;
  bookingSource: "company" | "travel-agency" | "individual";
  companyId?: Types.ObjectId;
  pickupLocation: string;
  dropLocation: string;
  journeyType:
    | "outstation-one-way"
    | "outstation"
    | "local-outstation"
    | "local"
    | "transfer";
  cityOfWork?: string;
  startDate: Date;
  endDate: Date;
  vehicleId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  tariffRate: number;
  totalAmount: number;
  advanceReceived: number;
  balance: number;
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  dutySlips?: IDutySlip[];
  expenses: IExpense[];
  payments?: IBookingPayment[];
  billed: boolean;
  dutySlipSubmitted: boolean;
  dutySlipSubmittedToCompany: boolean;
  createdAt: Date;
  statusHistory: IStatusChange[];
}

export interface IBookingPayment {
  amount: number;
  comments?: string;
  collectedBy?: string;
  paidOn: Date;
}

export interface ICustomer {
  _id: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyId?: Types.ObjectId; // optional association to a company
  createdAt: Date;
}

// Driver performance / management report
export interface IDriverReportEntry {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  date: Date; // specific day within month
  totalKm?: number;
  daysWorked?: number; // number of day shifts counted for that date (usually 0 or 1)
  nightsWorked?: number; // number of night shifts counted for that date (0 or 1)
  nightAmount?: number; // amount earned for night work that date
  salaryRate?: number; // base salary/rate reference at that time
  totalAmount?: number; // computed = (daysWorked*salaryRate) + nightAmount or manual override
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Fuel entry
export interface IFuelEntry {
  _id: Types.ObjectId;
  vehicleId: Types.ObjectId;
  bookingId: Types.ObjectId; // associated trip / booking
  addedByType: "self" | "driver";
  fuelFillDate: Date;
  totalTripKm: number; // total km for trip segment
  vehicleFuelAverage: number; // vehicle average (km per litre)
  fuelQuantity: number; // litres
  fuelRate: number; // per litre rate
  totalAmount: number; // fuelQuantity * fuelRate
  comment?: string;
  includeInFinance: boolean; // whether to include in income/expense calculations
  createdAt: Date;
  updatedAt: Date;
}
