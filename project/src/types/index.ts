export type UserRole =
  | "admin"
  | "accountant"
  | "dispatcher"
  | "driver"
  | "customer";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  driverId?: string;
  customerId?: string;
  createdAt: string;
  password?: string; // demo only (plain text)
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  aadhaar: string;
  photo?: string;
  vehicleType: "owned" | "rented";
  licenseExpiry: string;
  policeVerificationExpiry: string;
  licenseDocument?: string | UploadedFile; // Cloudinary URL or full uploaded file object
  policeVerificationDocument?: string | UploadedFile; // Cloudinary URL or uploaded file object
  paymentMode: "per-trip" | "daily" | "monthly" | "fuel-basis";
  salary?: number;
  dateOfJoining: string;
  referenceNote?: string;
  document?: string | UploadedFile; // allow simple path string
  advances: Advance[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  // Category is now dynamic, managed in DB; keep legacy values but allow any string
  category: string;
  categoryDescription?: string;
  categoryId?: string;
  owner: "owned" | "rented";
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  photo?: string;
  document?: string;
  status: "active" | "maintenance" | "inactive";
  mileageTrips?: number;
  mileageKm?: number;
  createdAt: string;
}

export interface VehicleCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface OilChangeEntry {
  id?: string;
  date?: string;
  price: number;
  kilometers: number;
}
export interface PartReplacementEntry {
  id?: string;
  date?: string;
  part: string;
  price: number;
}
export interface TyreEntry {
  id?: string;
  date?: string;
  details: string;
  price: number;
}
export interface InstallmentEntry {
  id?: string;
  date?: string;
  description: string;
  amount: number;
}
export interface InsuranceEntry {
  id?: string;
  date?: string;
  provider?: string;
  policyNumber?: string;
  cost: number;
  validFrom?: string;
  validTo?: string;
}
export interface LegalPaperEntry {
  id?: string;
  date?: string;
  type: string;
  description?: string;
  cost: number;
  expiryDate?: string;
}

export interface VehicleServicingDoc {
  vehicleId: string;
  oilChanges: OilChangeEntry[];
  partsReplacements: PartReplacementEntry[];
  tyres: TyreEntry[];
  installments: InstallmentEntry[];
  insurances: InsuranceEntry[];
  legalPapers: LegalPaperEntry[];
}

export interface Company {
  id: string;
  name: string;
  gst: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  outstandingAmount: number;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerId?: string; // reference to customer entity
  customerName: string;
  customerPhone: string;
  bookingSource: "company" | "travel-agency" | "individual";
  companyId?: string;
  pickupLocation: string;
  dropLocation: string;
  journeyType:
    | "outstation-one-way"
    | "outstation"
    | "local-outstation"
    | "local"
    | "transfer";
  cityOfWork?: string;
  startDate: string;
  endDate: string;
  vehicleId?: string;
  vehicleCategoryId?: string;
  driverId?: string;
  tariffRate: number;
  totalAmount: number;
  advanceReceived: number;
  balance: number;
  advanceReason?: string; // Reason for giving advance to driver
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  dutySlips?: UploadedFile[]; // multiple uploads (pdf/images)
  expenses: Expense[];
  payments?: BookingPayment[];
  // Total amount finally paid to driver for this booking
  finalPaid?: number;
  settled?: boolean;
  billed: boolean;
  dutySlipSubmitted: boolean;
  dutySlipSubmittedToCompany: boolean;
  createdAt: string;
  statusHistory: StatusChange[];

  driverName?: string;
  vehicleNumber?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: "fuel" | "toll" | "parking" | "night" | "perday" | "rent" | "other";
  amount: number;
  description: string;
  receipt?: string;
}

export interface BookingPayment {
  id: string;
  amount: number;
  comments?: string;
  collectedBy?: string;
  paidOn: string; // ISO date
}

export interface StatusChange {
  id: string;
  status: Booking["status"];
  timestamp: string;
  changedBy: string;
}

export interface Advance {
  id: string;
  amount: number;
  date: string;
  settled: boolean;
  description: string;
}

export interface Payment {
  id: string;
  entityId: string;
  entityType: "customer" | "driver";
  amount: number;
  type: "received" | "paid";
  date: string;
  description: string;
  // Optional link if this payment settles a specific driver advance
  payments?: BookingPayment[];
  relatedAdvanceId?: string;
}

// Driver payment linked to a booking (separate from customer-side booking payments)
export interface DriverPayment {
  id: string;
  bookingId: string;
  driverId: string;
  mode: "per-trip" | "daily" | "fuel-basis";
  amount: number; // final paid amount
  description?: string;
  date: string; // created date
  fuelQuantity?: number;
  fuelRate?: number;
  computedAmount?: number; // system computed when fuel-basis
  distanceKm?: number; // optional distance used to derive fuel
  mileage?: number; // km per litre reference
  settled?: boolean;
  settledAt?: string;
  type?: "paid" | "received";
}

// Payment returned from finance driver payments endpoint (may include booking meta)
export interface DriverFinancePayment {
  id: string;
  amount: number;
  type: "paid" | "received";
  date: string;
  description?: string;
  bookingId?: string;
  booking?: {
    id: string;
    pickupLocation?: string;
    dropLocation?: string;
    startDate?: string;
    endDate?: string;
  };
  mode?: "per-trip" | "daily" | "fuel-basis";
  fuelQuantity?: number;
  fuelRate?: number;
  computedAmount?: number;
  distanceKm?: number;
  mileage?: number;
  settled?: boolean;
  settledAt?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string; // mime
  size: number; // bytes
  data: string; // base64 data URL
  uploadedAt: string;
}

export interface DriverReportEntry {
  id?: string;
  driverId: string;
  date: string; // ISO date (day)
  totalKm?: number;
  daysWorked?: number;
  nightsWorked?: number;
  nightAmount?: number;
  salaryRate?: number;
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
