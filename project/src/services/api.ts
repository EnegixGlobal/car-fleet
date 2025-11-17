// src/services/api.ts
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { DriverPayment } from "../types";
type RawDriverPayment = {
  _id?: string;
  id?: string;
  bookingId?: string;
  entityId?: string;
  driverPaymentMode?: string;
  amount: number;
  description?: string;
  date?: string;
  fuelQuantity?: number;
  fuelRate?: number;
  computedAmount?: number;
  distanceKm?: number;
  mileage?: number;
  settled?: boolean;
  settledAt?: string;
};
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Custom error response type
interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
}

// Create custom events
const sessionExpiredEvent = new Event("session-expired");

// Toast message state tracking
const toastMessages = new Set<string>();

// Helper to show toast only once
const showToastOnce = (
  message: string,
  id: string,
  type: "error" | "success" = "error"
) => {
  if (!toastMessages.has(id)) {
    toastMessages.add(id);
    toast[type](message, { id });
    // Clean up after toast duration (default is 4000ms)
    setTimeout(() => toastMessages.delete(id), 4000);
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isValidationRequest = error.config?.url?.includes("/validate");
      const isLoginRequest = error.config?.url?.includes("/login");

      if (!isValidationRequest && !isLoginRequest) {
        // Only clear storage and dispatch event if not already on login page
        if (!window.location.pathname.includes("/login")) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          // Dispatch session expired event instead of direct navigation
          window.dispatchEvent(sessionExpiredEvent);
          showToastOnce(
            "Session expired. Please login again.",
            "session-expired"
          );
        }
      }
    } else if (error.response?.status === 429) {
      showToastOnce("Too many requests. Please try again later.", "rate-limit");
    } else if ((error.response?.status ?? 0) >= 500) {
      const data = error.response?.data as ApiErrorResponse;
      const errorMessage =
        data?.message || data?.error || "Server error. Please try again later.";
      showToastOnce(errorMessage, "server-error");
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "accountant" | "dispatcher" | "driver" | "customer";
    phone: string;
    createdAt: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: "admin" | "accountant" | "dispatcher" | "driver" | "customer";
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "admin" | "accountant" | "dispatcher" | "driver" | "customer";
  createdAt: string;
}

interface RawUser {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  phone: string;
  role: User["role"];
  createdAt?: string | Date;
}

// Company types (reuse existing front-end Company but define raw)
export interface CompanyDTO {
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

interface RawCompany {
  _id?: string;
  id?: string;
  name: string;
  gst: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  outstandingAmount?: number;
  createdAt?: string | Date;
}

interface RawBooking {
  _id?: string;
  id?: string;
  companyId?: string;
  pickupLocation: string;
  dropLocation: string;
  startDate: string;
  endDate: string;
  status: string;
  totalAmount: number;
  expenses?: { amount: number }[];
}
interface RawPayment {
  _id?: string;
  id?: string;
  amount: number;
  type: string;
  date: string;
  description?: string;
  entityType: string;
  entityId: string;
}
interface CompanyOverviewResponse {
  company: RawCompany;
  metrics: {
    bookings: number;
    revenue: number;
    expenses: number;
    completed: number;
    outstanding: number;
  };
  bookings: RawBooking[];
  payments: RawPayment[];
}

// Vehicle raw types
interface RawVehicle {
  _id?: string;
  id?: string;
  registrationNumber: string;
  category?: string;
  categoryDescription?: string;
  categoryId?: string | { _id?: string; name?: string; description?: string };
  owner: "owned" | "rented";
  insuranceExpiry: string | Date;
  fitnessExpiry: string | Date;
  permitExpiry: string | Date;
  pollutionExpiry: string | Date;
  photo?: string;
  document?: string;
  status: "active" | "maintenance" | "inactive";
  mileageTrips?: number;
  mileageKm?: number;
  createdAt?: string | Date;
}
export interface VehicleDTO {
  id: string;
  registrationNumber: string;
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

// Driver raw & DTO types
interface RawAdvance {
  amount: number;
  date: string | Date;
  settled?: boolean;
  description?: string;
  id?: string;
  _id?: string;
}
interface RawDriver {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  licenseNumber: string;
  aadhaar: string;
  vehicleType: "owned" | "rented";
  licenseExpiry: string | Date;
  policeVerificationExpiry: string | Date;
  paymentMode: "per-trip" | "daily" | "monthly" | "fuel-basis";
  salary?: number;
  dateOfJoining: string | Date;
  referenceNote?: string;
  document?: string;
  photo?: string;
  advances?: RawAdvance[];
  status: "active" | "inactive";
  createdAt?: string | Date;
}
export interface DriverDTO {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  aadhaar: string;
  vehicleType: "owned" | "rented";
  licenseExpiry: string;
  policeVerificationExpiry: string;
  paymentMode: "per-trip" | "daily" | "monthly" | "fuel-basis";
  salary?: number;
  dateOfJoining: string;
  referenceNote?: string;
  document?: string;
  photo?: string;
  advances: {
    id: string;
    amount: number;
    date: string;
    settled: boolean;
    description: string;
  }[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Auth API functions
export const authAPI = {
  // Internal helper to normalize mongoose docs
  _normalize(raw: RawUser): User {
    return {
      id: raw.id || raw._id || "",
      email: raw.email,
      name: raw.name,
      phone: raw.phone,
      role: raw.role,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post("/auth/register", userData);
    return authAPI._normalize(response.data);
  },

  getUsers: async (
    page = 1,
    limit = 10
  ): Promise<{ users: User[]; total: number }> => {
    const response = await api.get(`/auth/users?page=${page}&limit=${limit}`);
    const data = response.data as { users: RawUser[]; total: number };
    return {
      users: data.users.map((u) => authAPI._normalize(u)),
      total: data.total,
    };
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/auth/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put(`/auth/users/${id}`, updates);
    return authAPI._normalize(response.data);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
  },
};

// Company API
export const companyAPI = {
  _normalize(raw: RawCompany): CompanyDTO {
    return {
      id: raw.id || raw._id || "",
      name: raw.name,
      gst: raw.gst,
      address: raw.address,
      contactPerson: raw.contactPerson,
      phone: raw.phone,
      email: raw.email,
      outstandingAmount: raw.outstandingAmount ?? 0,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<CompanyDTO[]> => {
    const res = await api.get("/companies");
    // backend returns { companies, total } or maybe just array? examine service: getCompanies returns { companies, total }
    const data = res.data as
      | { companies: RawCompany[]; total: number }
      | RawCompany[];
    if (Array.isArray(data)) return data.map(companyAPI._normalize);
    return data.companies.map(companyAPI._normalize);
  },
  get: async (id: string): Promise<CompanyDTO> => {
    const res = await api.get(`/companies/${id}`);
    return companyAPI._normalize(res.data as RawCompany);
  },
  create: async (
    payload: Omit<CompanyDTO, "id" | "createdAt" | "outstandingAmount">
  ): Promise<CompanyDTO> => {
    const res = await api.post("/companies", payload);
    return companyAPI._normalize(res.data as RawCompany);
  },
  update: async (
    id: string,
    updates: Partial<Omit<CompanyDTO, "id">>
  ): Promise<CompanyDTO> => {
    const res = await api.put(`/companies/${id}`, updates);
    return companyAPI._normalize(res.data as RawCompany);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },
  recordPayment: async (
    id: string,
    amount: number,
    description?: string
  ): Promise<void> => {
    await api.post(`/companies/${id}/payments`, { amount, description });
  },
  overview: async (
    id: string
  ): Promise<{
    company: CompanyDTO;
    metrics: {
      bookings: number;
      revenue: number;
      expenses: number;
      completed: number;
      outstanding: number;
    };
    bookings: RawBooking[];
    payments: RawPayment[];
  }> => {
    const res = await api.get(`/companies/${id}/overview`);
    const data = res.data as CompanyOverviewResponse;
    return { ...data, company: companyAPI._normalize(data.company) };
  },
};

// Vehicle API
export const vehicleAPI = {
  _normalize(raw: RawVehicle): VehicleDTO {
    return {
      id: raw.id || raw._id || "",
      registrationNumber: raw.registrationNumber,
      category:
        raw.category ||
        (typeof raw.categoryId === "object" ? raw.categoryId.name || "" : ""),
      categoryDescription:
        raw.categoryDescription ||
        (typeof raw.categoryId === "object"
          ? raw.categoryId.description
          : undefined),
      categoryId:
        typeof raw.categoryId === "object"
          ? raw.categoryId._id
          : raw.categoryId,
      owner: raw.owner,
      insuranceExpiry:
        typeof raw.insuranceExpiry === "string"
          ? raw.insuranceExpiry
          : new Date(raw.insuranceExpiry).toISOString(),
      fitnessExpiry:
        typeof raw.fitnessExpiry === "string"
          ? raw.fitnessExpiry
          : new Date(raw.fitnessExpiry).toISOString(),
      permitExpiry:
        typeof raw.permitExpiry === "string"
          ? raw.permitExpiry
          : new Date(raw.permitExpiry).toISOString(),
      pollutionExpiry:
        typeof raw.pollutionExpiry === "string"
          ? raw.pollutionExpiry
          : new Date(raw.pollutionExpiry).toISOString(),
      photo: raw.photo,
      document: raw.document,
      status: raw.status,
      mileageTrips: raw.mileageTrips,
      mileageKm: raw.mileageKm,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<VehicleDTO[]> => {
    const res = await api.get("/vehicles");
    const data = res.data as
      | { vehicles: RawVehicle[]; total: number }
      | RawVehicle[];
    if (Array.isArray(data)) return data.map(vehicleAPI._normalize);
    return data.vehicles.map(vehicleAPI._normalize);
  },
  get: async (id: string): Promise<VehicleDTO> => {
    const res = await api.get(`/vehicles/${id}`);
    return vehicleAPI._normalize(res.data as RawVehicle);
  },
  create: async (
    payload: Omit<VehicleDTO, "id" | "createdAt" | "status" | "category"> & {
      status?: VehicleDTO["status"];
      category?: string;
      categoryId?: string;
      photoFile?: File;
      documentFile?: File;
    }
  ): Promise<VehicleDTO> => {
    // If files present, send multipart
    if (payload.photoFile || payload.documentFile) {
      const fd = new FormData();
      const body = normalizeVehicleDates(payload);
      Object.entries(body).forEach(([k, v]) => {
        if (k === "photoFile" || k === "documentFile") return;
        if (v == null) return;
        fd.append(k, String(v));
      });
      if (payload.photoFile) fd.append("photo", payload.photoFile);
      if (payload.documentFile) fd.append("document", payload.documentFile);
      const res = await api.post("/vehicles", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return vehicleAPI._normalize(res.data as RawVehicle);
    }
    const res = await api.post("/vehicles", normalizeVehicleDates(payload));
    return vehicleAPI._normalize(res.data as RawVehicle);
  },
  update: async (
    id: string,
    updates: Partial<VehicleDTO>
  ): Promise<VehicleDTO> => {
    // Optional multipart when files provided
    const maybeFileUpdates = updates as Partial<VehicleDTO> & {
      photoFile?: File;
      documentFile?: File;
    };
    if (maybeFileUpdates.photoFile || maybeFileUpdates.documentFile) {
      const fd = new FormData();
      const body = normalizeVehicleDates(maybeFileUpdates);
      Object.entries(body).forEach(([k, v]) => {
        if (k === "photoFile" || k === "documentFile") return;
        if (v == null) return;
        fd.append(k, String(v));
      });
      if (maybeFileUpdates.photoFile)
        fd.append("photo", maybeFileUpdates.photoFile);
      if (maybeFileUpdates.documentFile)
        fd.append("document", maybeFileUpdates.documentFile);
      const res = await api.put(`/vehicles/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return vehicleAPI._normalize(res.data as RawVehicle);
    }
    const res = await api.put(
      `/vehicles/${id}`,
      normalizeVehicleDates(updates)
    );
    return vehicleAPI._normalize(res.data as RawVehicle);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicles/${id}`);
  },
};

// Vehicle Category API
interface RawVehicleCategory {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  createdAt?: string | Date;
}
export interface VehicleCategoryDTO {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}
export const vehicleCategoryAPI = {
  _normalize(raw: RawVehicleCategory): VehicleCategoryDTO {
    return {
      id: raw.id || raw._id || "",
      name: raw.name,
      description: raw.description,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<VehicleCategoryDTO[]> => {
    const res = await api.get("/vehicle-categories");
    const data = res.data as
      | { categories: RawVehicleCategory[]; total: number }
      | RawVehicleCategory[];
    const arr = Array.isArray(data) ? data : data.categories;
    return arr.map(vehicleCategoryAPI._normalize);
  },
  create: async (payload: {
    name: string;
    description?: string;
  }): Promise<VehicleCategoryDTO> => {
    const res = await api.post("/vehicle-categories", payload);
    return vehicleCategoryAPI._normalize(res.data as RawVehicleCategory);
  },
  update: async (
    id: string,
    updates: Partial<{ name: string; description?: string }>
  ): Promise<VehicleCategoryDTO> => {
    const res = await api.put(`/vehicle-categories/${id}`, updates);
    return vehicleCategoryAPI._normalize(res.data as RawVehicleCategory);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/vehicle-categories/${id}`);
  },
};

// Driver API
export const driverAPI = {
  _normalize(raw: RawDriver): DriverDTO {
    return {
      id: raw.id || raw._id || "",
      name: raw.name,
      phone: raw.phone,
      licenseNumber: raw.licenseNumber,
      aadhaar: raw.aadhaar,
      vehicleType: raw.vehicleType,
      licenseExpiry:
        typeof raw.licenseExpiry === "string"
          ? raw.licenseExpiry
          : new Date(raw.licenseExpiry).toISOString(),
      policeVerificationExpiry:
        typeof raw.policeVerificationExpiry === "string"
          ? raw.policeVerificationExpiry
          : new Date(raw.policeVerificationExpiry).toISOString(),
      paymentMode: raw.paymentMode,
      salary: raw.salary,
      dateOfJoining: raw.dateOfJoining
        ? typeof raw.dateOfJoining === "string"
          ? raw.dateOfJoining
          : new Date(raw.dateOfJoining).toISOString()
        : typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date(raw.createdAt || Date.now()).toISOString(),
      referenceNote: raw.referenceNote,
      document: raw.document,
      photo: raw.photo,
      advances: (raw.advances || []).map((a) => ({
        id: a.id || a._id || "",
        amount: a.amount,
        date:
          typeof a.date === "string" ? a.date : new Date(a.date).toISOString(),
        settled: a.settled ?? false,
        description: a.description || "",
      })),
      status: raw.status,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<DriverDTO[]> => {
    const res = await api.get("/drivers");
    const data = res.data as
      | { drivers: RawDriver[]; total: number }
      | RawDriver[];
    if (Array.isArray(data)) return data.map(driverAPI._normalize);
    return data.drivers.map(driverAPI._normalize);
  },
  get: async (id: string): Promise<DriverDTO> => {
    const res = await api.get(`/drivers/${id}`);
    return driverAPI._normalize(res.data as RawDriver);
  },
  create: async (
    payload: Omit<DriverDTO, "id" | "createdAt" | "advances" | "status"> & {
      status?: DriverDTO["status"];
    }
  ): Promise<DriverDTO> => {
    const body = normalizeDriverDates(payload);
    const res = await api.post("/drivers", body);
    return driverAPI._normalize(res.data as RawDriver);
  },
  createMultipart: async (payload: Record<string, unknown>, files: File[]) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v == null) return;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        // normalize date-only to ISO
        fd.append(k, new Date(v + "T00:00:00.000Z").toISOString());
      } else {
        fd.append(k, String(v));
      }
    });
    files.forEach((f) => fd.append("files", f));
    const res = await api.post("/drivers", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return driverAPI._normalize(res.data as RawDriver);
  },
  update: async (
    id: string,
    updates: Partial<DriverDTO>
  ): Promise<DriverDTO> => {
    const res = await api.put(`/drivers/${id}`, normalizeDriverDates(updates));
    return driverAPI._normalize(res.data as RawDriver);
  },
  updateMultipart: async (
    id: string,
    updates: Record<string, unknown>,
    files: File[]
  ) => {
    const fd = new FormData();
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null) return;
      if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        fd.append(k, new Date(v + "T00:00:00.000Z").toISOString());
      } else {
        fd.append(k, String(v));
      }
    });
    files.forEach((f) => fd.append("files", f));
    const res = await api.put(`/drivers/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return driverAPI._normalize(res.data as RawDriver);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },
  addAdvance: async (
    id: string,
    amount: number,
    description?: string
  ): Promise<DriverDTO> => {
    const res = await api.post(`/drivers/${id}/advances`, {
      amount,
      description,
    });
    return driverAPI._normalize(res.data as RawDriver);
  },
  settleAdvance: async (id: string, advanceId: string): Promise<void> => {
    await api.put(`/drivers/${id}/settle-advance`, { advanceId });
  },
};

// Driver Management Report API
interface RawDriverReport {
  _id?: string;
  id?: string;
  driverId: string;
  date: string | Date;
  totalKm?: number;
  daysWorked?: number;
  nightsWorked?: number;
  nightAmount?: number;
  salaryRate?: number;
  totalAmount?: number;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
export const driverReportAPI = {
  _normalize(raw: RawDriverReport) {
    return {
      id: raw.id || raw._id || "",
      driverId: raw.driverId,
      date:
        typeof raw.date === "string"
          ? raw.date
          : new Date(raw.date).toISOString(),
      totalKm: raw.totalKm,
      daysWorked: raw.daysWorked,
      nightsWorked: raw.nightsWorked,
      nightAmount: raw.nightAmount,
      salaryRate: raw.salaryRate,
      totalAmount: raw.totalAmount,
      notes: raw.notes,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
      updatedAt:
        typeof raw.updatedAt === "string"
          ? raw.updatedAt
          : new Date(raw.updatedAt || Date.now()).toISOString(),
    };
  },
  listForDriverMonth: async (driverId: string, year: number, month: number) => {
    const res = await api.get(`/drivers/${driverId}/reports`, {
      params: { year, month },
    });
    return (res.data as RawDriverReport[]).map(driverReportAPI._normalize);
  },
  upsert: async (
    driverId: string,
    payload: { date: string } & Partial<
      Omit<RawDriverReport, "_id" | "id" | "driverId">
    >
  ) => {
    const res = await api.put(`/drivers/${driverId}/reports`, payload);
    return driverReportAPI._normalize(res.data as RawDriverReport);
  },
  listAllMonth: async (year: number, month: number) => {
    const res = await api.get("/driver-reports", { params: { year, month } });
    return (res.data as RawDriverReport[]).map(driverReportAPI._normalize);
  },
};

// Fuel API
interface RawFuelEntry {
  _id?: string;
  id?: string;
  vehicleId: string | { _id?: string; registrationNumber?: string };
  bookingId:
    | string
    | { _id?: string; pickupLocation?: string; dropLocation?: string };
  addedByType: "self" | "driver";
  fuelFillDate: string | Date;
  totalTripKm: number;
  vehicleFuelAverage: number;
  fuelQuantity: number;
  fuelRate: number;
  totalAmount: number;
  comment?: string;
  includeInFinance: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
export interface FuelEntryDTO {
  id: string;
  vehicleId: string;
  vehicleLabel?: string;
  bookingId: string;
  bookingLabel?: string;
  addedByType: "self" | "driver";
  fuelFillDate: string;
  totalTripKm: number;
  vehicleFuelAverage: number;
  fuelQuantity: number;
  fuelRate: number;
  totalAmount: number;
  comment?: string;
  includeInFinance: boolean;
  createdAt: string;
  updatedAt: string;
}
export const fuelAPI = {
  _normalize(raw: RawFuelEntry): FuelEntryDTO {
    return {
      id: raw.id || raw._id || "",
      vehicleId:
        typeof raw.vehicleId === "object"
          ? raw.vehicleId._id || ""
          : raw.vehicleId,
      vehicleLabel:
        typeof raw.vehicleId === "object"
          ? raw.vehicleId.registrationNumber
          : undefined,
      bookingId:
        typeof raw.bookingId === "object"
          ? raw.bookingId._id || ""
          : raw.bookingId,
      bookingLabel:
        typeof raw.bookingId === "object"
          ? `${raw.bookingId.pickupLocation || ""} -> ${
              raw.bookingId.dropLocation || ""
            }`
          : undefined,
      addedByType: raw.addedByType,
      fuelFillDate:
        typeof raw.fuelFillDate === "string"
          ? raw.fuelFillDate
          : new Date(raw.fuelFillDate).toISOString(),
      totalTripKm: raw.totalTripKm,
      vehicleFuelAverage: raw.vehicleFuelAverage,
      fuelQuantity: raw.fuelQuantity,
      fuelRate: raw.fuelRate,
      totalAmount: raw.totalAmount,
      comment: raw.comment,
      includeInFinance: raw.includeInFinance,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
      updatedAt:
        typeof raw.updatedAt === "string"
          ? raw.updatedAt
          : new Date(raw.updatedAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<FuelEntryDTO[]> => {
    const res = await api.get("/fuel");
    const data = res.data as RawFuelEntry[];
    return data.map(fuelAPI._normalize);
  },
  create: async (
    payload: Omit<
      FuelEntryDTO,
      "id" | "totalAmount" | "createdAt" | "updatedAt"
    >
  ): Promise<FuelEntryDTO> => {
    const res = await api.post("/fuel", payload);
    return fuelAPI._normalize(res.data as RawFuelEntry);
  },
  update: async (
    id: string,
    updates: Partial<FuelEntryDTO>
  ): Promise<FuelEntryDTO> => {
    const res = await api.put(`/fuel/${id}`, updates);
    return fuelAPI._normalize(res.data as RawFuelEntry);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/fuel/${id}`);
  },
  get: async (id: string): Promise<FuelEntryDTO> => {
    const res = await api.get(`/fuel/${id}`);
    return fuelAPI._normalize(res.data as RawFuelEntry);
  },
};

// Booking API
interface RawStatusChange {
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  timestamp: string | Date;
  changedBy: string;
  _id?: string;
  id?: string;
}
interface RawExpense {
  id?: string;
  _id?: string;
  type: "fuel" | "toll" | "parking" | "night" | "perday" | "rent" | "other";
  amount: number;
  description: string;
}
interface RawDutySlip {
  id?: string;
  _id?: string;
  path?: string;
  uploadedAt?: string | Date;
  uploadedBy?: string;
  description?: string;
  name?: string;
  size?: number;
  data?: string;
  type?: string;
}
interface RawBookingPayment {
  id?: string;
  _id?: string;
  amount: number;
  comments?: string;
  collectedBy?: string;
  paidOn: string | Date;
}
type MaybePopulated<T> = T | { _id?: string; id?: string } | undefined;
interface RawCustomer {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyId?: string;
  createdAt?: string | Date;
}
export interface CustomerDTO {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  companyId?: string;
  createdAt: string;
}

interface RawFullBooking {
  _id?: string;
  id?: string;
  customerId?: MaybePopulated<string>;
  customerName: string;
  customerPhone: string;
  bookingSource: "company" | "travel-agency" | "individual";
  companyId?: MaybePopulated<string>;
  pickupLocation: string;
  dropLocation: string;
  journeyType:
    | "outstation-one-way"
    | "outstation"
    | "local-outstation"
    | "local"
    | "transfer";
  cityOfWork?: string;
  startDate: string | Date;
  endDate: string | Date;
  vehicleId?: MaybePopulated<string>;
  driverId?: MaybePopulated<string>;
  tariffRate: number;
  totalAmount: number;
  advanceReceived: number;
  balance: number;
  advanceReason?: string;
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  expenses: RawExpense[];
  payments?: RawBookingPayment[];
  finalPaid?: number;
  billed: boolean;
  dutySlipSubmitted: boolean;
  dutySlipSubmittedToCompany: boolean;
  statusHistory: RawStatusChange[];
  dutySlips?: RawDutySlip[];
  createdAt?: string | Date;
}
export interface BookingDTO {
  id: string;
  customerId?: string;
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
  driverId?: string;
  tariffRate: number;
  totalAmount: number;
  advanceReceived: number;
  balance: number;
  advanceReason?: string;
  status: "booked" | "ongoing" | "completed" | "yet-to-start" | "canceled";
  expenses: {
    id: string;
    type: RawExpense["type"];
    amount: number;
    description: string;
  }[];
  payments?: {
    id: string;
    amount: number;
    comments?: string;
    collectedBy?: string;
    paidOn: string;
  }[];
  finalPaid?: number;
  billed: boolean;
  dutySlipSubmitted: boolean;
  dutySlipSubmittedToCompany: boolean;
  statusHistory: {
    id: string;
    status: BookingDTO["status"];
    timestamp: string;
    changedBy: string;
  }[];
  dutySlips?: RawDutySlip[];
  createdAt: string;
}

export const customerAPI = {
  _normalize(raw: RawCustomer): CustomerDTO {
    return {
      id: raw.id || raw._id || "",
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      address: raw.address,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
      companyId: raw.companyId,
    };
  },
  list: async (): Promise<CustomerDTO[]> => {
    const res = await api.get("/customers");
    const data = res.data as
      | { customers: RawCustomer[]; total: number }
      | RawCustomer[];
    if (Array.isArray(data)) return data.map(customerAPI._normalize);
    return data.customers.map(customerAPI._normalize);
  },
  get: async (id: string): Promise<CustomerDTO> => {
    const res = await api.get(`/customers/${id}`);
    return customerAPI._normalize(res.data as RawCustomer);
  },
  create: async (
    payload: Omit<CustomerDTO, "id" | "createdAt">
  ): Promise<CustomerDTO> => {
    const res = await api.post("/customers", payload);
    return customerAPI._normalize(res.data as RawCustomer);
  },
  update: async (
    id: string,
    updates: Partial<Omit<CustomerDTO, "id">>
  ): Promise<CustomerDTO> => {
    const res = await api.put(`/customers/${id}`, updates);
    return customerAPI._normalize(res.data as RawCustomer);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

export const bookingAPI = {
  _normalize(raw: RawFullBooking): BookingDTO {
    return {
      id: raw.id || raw._id || "",
      customerId: (typeof raw.customerId === "object" && raw.customerId?._id
        ? raw.customerId._id || raw.customerId.id
        : raw.customerId) as string | undefined,
      customerName: raw.customerName,
      customerPhone: raw.customerPhone,
      bookingSource: raw.bookingSource,
      companyId: (typeof raw.companyId === "object" && raw.companyId?._id
        ? raw.companyId._id || raw.companyId.id
        : raw.companyId) as string | undefined,
      pickupLocation: raw.pickupLocation,
      dropLocation: raw.dropLocation,
      journeyType: raw.journeyType,
      cityOfWork: raw.cityOfWork,
      startDate:
        typeof raw.startDate === "string"
          ? raw.startDate
          : new Date(raw.startDate).toISOString(),
      endDate:
        typeof raw.endDate === "string"
          ? raw.endDate
          : new Date(raw.endDate).toISOString(),
      vehicleId: (typeof raw.vehicleId === "object" && raw.vehicleId?._id
        ? raw.vehicleId._id || raw.vehicleId.id
        : raw.vehicleId) as string | undefined,
      driverId: (typeof raw.driverId === "object" && raw.driverId?._id
        ? raw.driverId._id || raw.driverId.id
        : raw.driverId) as string | undefined,
      tariffRate: raw.tariffRate,
      totalAmount: raw.totalAmount,
      advanceReceived: raw.advanceReceived,
      balance: raw.balance,
      advanceReason: raw.advanceReason,
      status: raw.status,
      expenses: (raw.expenses || []).map((e) => ({
        id: e.id || e._id || "",
        type: e.type,
        amount: e.amount,
        description: e.description,
      })),
      payments: (raw.payments || []).map((p) => ({
        id: p.id || p._id || "",
        amount: p.amount,
        comments: p.comments,
        collectedBy: p.collectedBy,
        paidOn:
          typeof p.paidOn === "string"
            ? p.paidOn
            : new Date(p.paidOn).toISOString(),
      })),
      finalPaid: raw.finalPaid,
      billed: raw.billed,
      dutySlipSubmitted: raw.dutySlipSubmitted,
      dutySlipSubmittedToCompany: raw.dutySlipSubmittedToCompany,
      statusHistory: (raw.statusHistory || []).map((s) => ({
        id: s.id || s._id || "",
        status: s.status,
        timestamp:
          typeof s.timestamp === "string"
            ? s.timestamp
            : new Date(s.timestamp).toISOString(),
        changedBy: s.changedBy,
      })),
      dutySlips: raw.dutySlips,
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : new Date(raw.createdAt || Date.now()).toISOString(),
    };
  },
  list: async (): Promise<BookingDTO[]> => {
    const res = await api.get("/bookings");
    const data = res.data as
      | { bookings: RawFullBooking[]; total: number }
      | RawFullBooking[];
    if (Array.isArray(data)) return data.map(bookingAPI._normalize);
    return data.bookings.map(bookingAPI._normalize);
  },
  get: async (id: string): Promise<BookingDTO> => {
    const res = await api.get(`/bookings/${id}`);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  create: async (
    payload: Omit<
      BookingDTO,
      | "id"
      | "createdAt"
      | "expenses"
      | "statusHistory"
      | "billed"
      | "balance"
      | "status"
    > & { status?: BookingDTO["status"] }
  ): Promise<BookingDTO> => {
    const body = normalizeBookingDates(payload);
    const res = await api.post("/bookings", body);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  update: async (
    id: string,
    updates: Partial<BookingDTO>
  ): Promise<BookingDTO> => {
    const res = await api.put(
      `/bookings/${id}`,
      normalizeBookingDates(updates)
    );
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },
  addExpense: async (
    id: string,
    expense: { type: RawExpense["type"]; amount: number; description: string }
  ): Promise<BookingDTO> => {
    const res = await api.post(`/bookings/${id}/expenses`, expense);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  updateExpense: async (
    id: string,
    expenseId: string,
    updates: Partial<{ type: RawExpense["type"]; amount: number; description: string }>
  ): Promise<BookingDTO> => {
    const res = await api.put(`/bookings/${id}/expenses/${expenseId}`, updates);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  deleteExpense: async (id: string, expenseId: string): Promise<BookingDTO> => {
    const res = await api.delete(`/bookings/${id}/expenses/${expenseId}`);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  addPayment: async (
    id: string,
    payment: {
      amount: number;
      comments?: string;
      collectedBy?: string;
      paidOn: string;
    }
  ): Promise<BookingDTO> => {
    const body = { ...payment };
    // Ensure backend receives ISO datetime; convert YYYY-MM-DD to T00:00:00.000Z
    if (/^\d{4}-\d{2}-\d{2}$/.test(body.paidOn)) {
      body.paidOn = new Date(body.paidOn + "T00:00:00.000Z").toISOString();
    }
    const res = await api.post(`/bookings/${id}/payments`, body);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  updatePayment: async (
    id: string,
    paymentId: string,
    updates: Partial<{
      amount: number;
      comments?: string;
      collectedBy?: string;
      paidOn: string;
    }>
  ): Promise<BookingDTO> => {
    const body: any = { ...updates };
    if (body.paidOn && /^\d{4}-\d{2}-\d{2}$/.test(body.paidOn)) {
      body.paidOn = new Date(body.paidOn + 'T00:00:00.000Z').toISOString();
    }
    const res = await api.put(`/bookings/${id}/payments/${paymentId}`, body);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  deletePayment: async (id: string, paymentId: string): Promise<BookingDTO> => {
    const res = await api.delete(`/bookings/${id}/payments/${paymentId}`);
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  updateStatus: async (
    id: string,
    status: BookingDTO["status"],
    changedBy: string
  ): Promise<BookingDTO> => {
    const res = await api.put(`/bookings/${id}/status`, { status, changedBy });
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  toggleBilled: async (id: string, billed: boolean): Promise<BookingDTO> => {
    const res = await api.put(`/bookings/${id}`, { billed });
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  toggleDutySlipSubmitted: async (
    id: string,
    dutySlipSubmitted: boolean
  ): Promise<BookingDTO> => {
    const res = await api.put(`/bookings/${id}`, { dutySlipSubmitted });
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  toggleDutySlipSubmittedToCompany: async (
    id: string,
    dutySlipSubmittedToCompany: boolean
  ): Promise<BookingDTO> => {
    const res = await api.put(`/bookings/${id}`, {
      dutySlipSubmittedToCompany,
    });
    return bookingAPI._normalize(res.data as RawFullBooking);
  },
  addDriverPayment: async (
    bookingId: string,
    payload: {
      driverId: string;
      mode: "per-trip" | "daily" | "fuel-basis";
      amount?: number;
      fuelQuantity?: number;
      fuelRate?: number;
      description?: string;
      distanceKm?: number;
      mileage?: number;
    }
  ): Promise<DriverPayment> => {
    const res = await api.post(`/bookings/${bookingId}/driver-payments`, {
      ...payload,
    });
    const raw = res.data as {
      _id?: string;
      id?: string;
      bookingId?: string;
      entityId?: string;
      driverPaymentMode?: string;
      amount: number;
      description?: string;
      date?: string;
      fuelQuantity?: number;
      fuelRate?: number;
      computedAmount?: number;
      distanceKm?: number;
      mileage?: number;
    };
    return {
      id: raw.id || raw._id || "",
      bookingId: (raw.bookingId || bookingId) as string,
      driverId: raw.entityId || payload.driverId,
      mode: (raw.driverPaymentMode as DriverPayment["mode"]) || payload.mode,
      amount: raw.amount,
      description: raw.description,
      date: raw.date || new Date().toISOString(),
      fuelQuantity: raw.fuelQuantity,
      fuelRate: raw.fuelRate,
      computedAmount: raw.computedAmount,
      distanceKm: raw.distanceKm,
      mileage: raw.mileage,
    };
  },
  listDriverPayments: async (bookingId: string): Promise<DriverPayment[]> => {
    const res = await api.get(`/bookings/${bookingId}/driver-payments`);
    const arr = res.data as RawDriverPayment[];
    return arr.map((raw) => ({
      id: raw.id || raw._id || "",
      bookingId: (raw.bookingId || bookingId) as string,
      driverId: raw.entityId || "",
      mode: (raw.driverPaymentMode as DriverPayment["mode"]) || "per-trip",
      amount: raw.amount,
      description: raw.description,
      date: raw.date || new Date().toISOString(),
      fuelQuantity: raw.fuelQuantity,
      fuelRate: raw.fuelRate,
      computedAmount: raw.computedAmount,
      distanceKm: raw.distanceKm,
      mileage: raw.mileage,
      settled: raw.settled,
      settledAt: raw.settledAt,
    }));
  },
  updateDriverPayment: async (
    bookingId: string,
    paymentId: string,
    updates: Partial<{
      mode: "per-trip" | "daily" | "fuel-basis";
      amount: number;
      fuelQuantity: number;
      fuelRate: number;
      description: string;
      settle: boolean;
      distanceKm: number;
      mileage: number;
    }>
  ): Promise<DriverPayment> => {
    const res = await api.put(
      `/bookings/${bookingId}/driver-payments/${paymentId}`,
      updates
    );
    const raw = res.data as RawDriverPayment;
    return {
      id: raw.id || raw._id || "",
      bookingId: raw.bookingId || bookingId,
      driverId: raw.entityId || "",
      mode: (raw.driverPaymentMode as DriverPayment["mode"]) || "per-trip",
      amount: raw.amount,
      description: raw.description,
      date: raw.date || new Date().toISOString(),
      fuelQuantity: raw.fuelQuantity,
      fuelRate: raw.fuelRate,
      computedAmount: raw.computedAmount,
      distanceKm: raw.distanceKm,
      mileage: raw.mileage,
      settled: raw.settled,
      settledAt: raw.settledAt,
    };
  },
  deleteDriverPayment: async (
    bookingId: string,
    paymentId: string
  ): Promise<void> => {
    await api.delete(`/bookings/${bookingId}/driver-payments/${paymentId}`);
  },
  exportDriverPayments: async (bookingId: string): Promise<Blob> => {
    const res = await api.get(`/bookings/${bookingId}/driver-payments-export`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};

// Finance API
export interface FinanceMetricsDTO {
  totalRevenue: number;
  totalOutstanding: number;
  totalExpenses: number;
  netProfit: number;
}
export const financeAPI = {
  getMetrics: async (): Promise<FinanceMetricsDTO> => {
    const res = await api.get("/finance/metrics");
    return res.data as FinanceMetricsDTO;
  },
  getDriverPayments: async (driverId: string) => {
    const res = await api.get(`/finance/drivers/${driverId}/payments`);
    // Backend returns Payment docs (possibly populated bookingId) including driver specific fields
    interface RawBackendDriverPayment {
      _id?: string;
      id?: string;
      amount: number;
      type: "paid" | "received";
      date: string;
      description?: string;
      bookingId?:
        | string
        | {
            _id: string;
            pickupLocation?: string;
            dropLocation?: string;
            startDate?: string;
            endDate?: string;
          };
      driverPaymentMode?: "per-trip" | "daily" | "fuel-basis";
      fuelQuantity?: number;
      fuelRate?: number;
      computedAmount?: number;
      settled?: boolean;
      settledAt?: string;
    }
    const raw = (res.data as RawBackendDriverPayment[]) || [];
    return raw.map((p) => {
      const bookingObj =
        p.bookingId && typeof p.bookingId === "object"
          ? (p.bookingId as Exclude<
              RawBackendDriverPayment["bookingId"],
              string
            >)
          : undefined;
      return {
        id: p._id || p.id!,
        amount: p.amount,
        type: p.type,
        date: p.date,
        description: p.description,
        bookingId:
          bookingObj?._id ||
          (typeof p.bookingId === "string" ? p.bookingId : undefined),
        booking: bookingObj
          ? {
              id: bookingObj._id,
              pickupLocation: bookingObj.pickupLocation,
              dropLocation: bookingObj.dropLocation,
              startDate: bookingObj.startDate,
              endDate: bookingObj.endDate,
            }
          : undefined,
        mode: p.driverPaymentMode,
        fuelQuantity: p.fuelQuantity,
        fuelRate: p.fuelRate,
        computedAmount: p.computedAmount,
        settled: p.settled,
        settledAt: p.settledAt,
      };
    });
  },
  addDriverPayment: async (
    bookingId: string,
    payload: {
      driverId: string;
      mode: "per-trip" | "daily" | "fuel-basis";
      amount?: number;
      fuelQuantity?: number;
      fuelRate?: number;
      description?: string;
      distanceKm?: number;
      mileage?: number;
    }
  ): Promise<DriverPayment> => {
    const res = await api.post(`/bookings/${bookingId}/driver-payments`, {
      ...payload,
    });
    const raw = res.data as {
      _id?: string;
      id?: string;
      amount: number;
      type: "paid" | "received";
      date: string;
      description?: string;
      bookingId?: string;
      driverPaymentMode?: "per-trip" | "daily" | "fuel-basis";
      fuelQuantity?: number;
      fuelRate?: number;
      computedAmount?: number;
      settled?: boolean;
      settledAt?: string;
      distanceKm?: number;
      mileage?: number;
    };
    return {
      id: raw._id || raw.id!,
      bookingId: raw.bookingId || bookingId,
      driverId: payload.driverId,
      mode: (raw.driverPaymentMode as DriverPayment["mode"]) || payload.mode,
      amount: raw.amount,
      description: raw.description,
      date: raw.date,
      fuelQuantity: raw.fuelQuantity,
      fuelRate: raw.fuelRate,
      computedAmount: raw.computedAmount,
      distanceKm: raw.distanceKm,
      mileage: raw.mileage,
      settled: raw.settled,
      settledAt: raw.settledAt,
    };
  },
};

function normalizeBookingDates<T extends Record<string, unknown>>(obj: T): T {
  const copy: Record<string, unknown> = { ...obj };
  ["startDate", "endDate"].forEach((key) => {
    const value = copy[key];
    if (
      typeof value === "string" &&
      value.length === 16 &&
      value.includes("T")
    ) {
      // datetime-local (no seconds)
      copy[key] = new Date(value + ":00.000Z").toISOString();
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      copy[key] = new Date(value + "T00:00:00.000Z").toISOString();
    }
  });
  return copy as T;
}

function normalizeDriverDates<T extends Record<string, unknown>>(obj: T): T {
  const copy: Record<string, unknown> = { ...obj };
  ["licenseExpiry", "policeVerificationExpiry", "dateOfJoining"].forEach(
    (key) => {
      const value = copy[key];
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        copy[key] = new Date(value + "T00:00:00.000Z").toISOString();
      }
    }
  );
  return copy as T;
}

// Normalize date-only (YYYY-MM-DD) strings to full ISO for backend zod datetime validation
function normalizeVehicleDates<T extends Record<string, unknown>>(obj: T): T {
  const copy: Record<string, unknown> = { ...obj };
  [
    "insuranceExpiry",
    "fitnessExpiry",
    "permitExpiry",
    "pollutionExpiry",
  ].forEach((key) => {
    const value = copy[key];
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      copy[key] = new Date(value + "T00:00:00.000Z").toISOString();
    }
  });
  return copy as T;
}

// Vehicle Servicing API
export interface VehicleServicingDTO {
  vehicleId: string;
  oilChanges: {
    id?: string;
    date?: string;
    price: number;
    kilometers: number;
  }[];
  partsReplacements: {
    id?: string;
    date?: string;
    part: string;
    price: number;
  }[];
  tyres: { id?: string; date?: string; details: string; price: number }[];
  installments: {
    id?: string;
    date?: string;
    description: string;
    amount: number;
  }[];
  insurances: {
    id?: string;
    date?: string;
    provider?: string;
    policyNumber?: string;
    cost: number;
    validFrom?: string;
    validTo?: string;
  }[];
  legalPapers: {
    id?: string;
    date?: string;
    type: string;
    description?: string;
    cost: number;
    expiryDate?: string;
  }[];
}

export const vehicleServicingAPI = {
  get: async (vehicleId: string): Promise<VehicleServicingDTO> => {
    const res = await api.get(`/vehicles/${vehicleId}/servicing`);
    const data = res.data as VehicleServicingDTO;
    // Ensure arrays exist
    return {
      vehicleId: data.vehicleId || vehicleId,
      oilChanges: data.oilChanges || [],
      partsReplacements: data.partsReplacements || [],
      tyres: data.tyres || [],
      installments: data.installments || [],
      insurances: data.insurances || [],
      legalPapers: data.legalPapers || [],
    };
  },
  upsert: async (
    vehicleId: string,
    payload: Partial<VehicleServicingDTO>
  ): Promise<VehicleServicingDTO> => {
    await api.put(`/vehicles/${vehicleId}/servicing`, payload);
    return vehicleServicingAPI.get(vehicleId);
  },
  appendSection: async <K extends keyof VehicleServicingDTO>(
    vehicleId: string,
    section: K,
    entries: VehicleServicingDTO[K] extends Array<infer U> ? U[] : never
  ): Promise<VehicleServicingDTO> => {
    await api.post(`/vehicles/${vehicleId}/servicing/${section}`, entries);
    return vehicleServicingAPI.get(vehicleId);
  },
};

export default api;
// City API
export interface CityDTO {
  id: string;
  name: string;
  createdAt: string;
}
const pickId = (obj: { id?: string; _id?: string } | unknown): string => {
  const o = obj as { id?: string; _id?: string };
  return o?.id || o?._id || "";
};

export const cityAPI = {
  list: async (): Promise<CityDTO[]> => {
    const res = await api.get("/cities");
    const data = res.data as {
      id?: string;
      _id?: string;
      name: string;
      createdAt?: string | Date;
    }[];
    return data.map((c) => ({
      id: pickId(c),
      name: c.name,
      createdAt:
        typeof c.createdAt === "string"
          ? c.createdAt
          : new Date(c.createdAt || Date.now()).toISOString(),
    }));
  },
  create: async (name: string): Promise<CityDTO> => {
    const res = await api.post("/cities", { name });
    const c = res.data as {
      id?: string;
      _id?: string;
      name: string;
      createdAt?: string | Date;
    };
    return {
      id: pickId(c),
      name: c.name,
      createdAt:
        typeof c.createdAt === "string"
          ? c.createdAt
          : new Date(c.createdAt || Date.now()).toISOString(),
    };
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cities/${id}`);
  },
};
