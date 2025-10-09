/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  Booking,
  Driver,
  Vehicle,
  Company,
  Payment,
  Advance,
  Customer,
} from "../types";
import {
  mockBookings,
  mockDrivers,
  mockVehicles,
  mockCompanies,
} from "../data/mockData";
import {
  companyAPI,
  vehicleAPI,
  driverAPI,
  bookingAPI,
  customerAPI,
} from "../services/api";

interface AppContextType {
  // Bookings
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  updateBookingStatus: (
    id: string,
    status: Booking["status"],
    changedBy: string
  ) => Promise<void>;
  toggleBookingBilled: (id: string, billed: boolean) => Promise<void>;
  toggleDutySlipSubmitted: (
    id: string,
    dutySlipSubmitted: boolean
  ) => Promise<void>;
  toggleDutySlipSubmittedToCompany: (
    id: string,
    dutySlipSubmittedToCompany: boolean
  ) => Promise<void>;
  bookingsLoading?: boolean;

  // Drivers
  drivers: Driver[];
  addDriver: (driver: Omit<Driver, "id" | "createdAt">) => void;
  // Append a driver already created on the server (avoid extra POST)
  appendDriverLocal: (driver: Driver) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
  addDriverAdvance: (
    driverId: string,
    advance: Omit<Advance, "id" | "settled">
  ) => void;
  driversLoading?: boolean;

  // Vehicles
  vehicles: Vehicle[];
  addVehicle: (
    vehicle: Omit<Vehicle, "id" | "createdAt">,
    files?: { photoFile?: File; documentFile?: File }
  ) => void;
  updateVehicle: (
    id: string,
    updates: Partial<Vehicle>,
    files?: { photoFile?: File; documentFile?: File }
  ) => void;
  deleteVehicle: (id: string) => void;
  vehiclesLoading?: boolean;

  // Companies
  companies: Company[];
  addCompany: (company: Omit<Company, "id" | "createdAt">) => void;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  customersLoading?: boolean;

  // Payments
  payments: Payment[];
  addPayment: (payment: Omit<Payment, "id">) => void;
  settleDriverAdvance: (
    driverId: string,
    advanceId: string,
    amount?: number
  ) => void;
  recordCompanyPayment: (
    companyId: string,
    amount: number,
    description?: string
  ) => void;
  resetSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedBookings = localStorage.getItem("bolt_bookings");
    const savedDrivers = localStorage.getItem("bolt_drivers");
    const savedVehicles = localStorage.getItem("bolt_vehicles");
    const savedPayments = localStorage.getItem("bolt_payments");

    (async () => {
      try {
        setBookingsLoading(true);
        const list = await bookingAPI.list();
        const normalized: Booking[] = list.map(
          (b) =>
            ({
              ...b,
              expenses: b.expenses,
              statusHistory: b.statusHistory,
            } as unknown as Booking)
        );
        setBookings(normalized);
        localStorage.setItem("bolt_bookings", JSON.stringify(normalized));
      } catch (err) {
        console.error(
          "Failed to load bookings from API, using saved/mock",
          err
        );
        if (savedBookings) {
          try {
            setBookings(JSON.parse(savedBookings));
          } catch {
            setBookings(mockBookings);
          }
        } else {
          setBookings(mockBookings);
        }
      } finally {
        setBookingsLoading(false);
      }
    })();
    (async () => {
      try {
        setDriversLoading(true);
        const list = await driverAPI.list();
        const normalized: Driver[] = list.map(
          (d) => ({ ...d, advances: d.advances } as unknown as Driver)
        );
        setDrivers(normalized); // even if empty; don't inject mock IDs that won't match bookings
        localStorage.setItem("bolt_drivers", JSON.stringify(normalized));
      } catch (err) {
        console.error("Failed to load drivers from API, using saved/mock", err);
        if (savedDrivers) {
          try {
            setDrivers(JSON.parse(savedDrivers));
          } catch {
            setDrivers(mockDrivers);
          }
        } else {
          setDrivers(mockDrivers);
        }
      } finally {
        setDriversLoading(false);
      }
    })();
    // Vehicles now fetched from backend (fallback to local storage / mock on failure)
    (async () => {
      try {
        setVehiclesLoading(true);
        const apiVehicles = await vehicleAPI.list();
        const normalized: Vehicle[] = apiVehicles.map(
          (v) => ({ ...v } as Vehicle)
        );
        setVehicles(normalized); // even if empty, reflect backend state
        localStorage.setItem("bolt_vehicles", JSON.stringify(normalized));
      } catch (err) {
        console.error(
          "Failed to load vehicles from API, using saved/mock",
          err
        );
        if (savedVehicles) {
          try {
            setVehicles(JSON.parse(savedVehicles));
          } catch {
            setVehicles(mockVehicles);
          }
        } else {
          setVehicles(mockVehicles);
        }
      } finally {
        setVehiclesLoading(false);
      }
    })();
    // Companies now fetched from backend; fall back to mock only if request fails
    (async () => {
      try {
        const list = await companyAPI.list();
        // Map API DTO to frontend Company shape (same fields) adding password? not needed
        const normalized: Company[] = list.map(
          (c) =>
            ({
              id: c.id,
              name: c.name,
              gst: c.gst,
              address: c.address,
              contactPerson: c.contactPerson,
              phone: c.phone,
              email: c.email,
              outstandingAmount: c.outstandingAmount,
              createdAt: c.createdAt,
            } as Company)
        );
        setCompanies(normalized);
      } catch (err) {
        console.error("Failed to load companies from API, using mock", err);
        setCompanies(mockCompanies);
      }
    })();
    // Customers fetch
    (async () => {
      try {
        setCustomersLoading(true);
        const list = await customerAPI.list();
        const normalized: Customer[] = list.map((c) => ({ ...c } as Customer));
        setCustomers(normalized);
        localStorage.setItem("bolt_customers", JSON.stringify(normalized));
      } catch (err) {
        console.error("Failed to load customers from API", err);
        const saved = localStorage.getItem("bolt_customers");
        if (saved) {
          try {
            setCustomers(JSON.parse(saved));
          } catch {
            setCustomers([]);
          }
        } else {
          setCustomers([]);
        }
      } finally {
        setCustomersLoading(false);
      }
    })();
    setPayments(savedPayments ? JSON.parse(savedPayments) : []);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem("bolt_bookings", JSON.stringify(bookings));
  }, [bookings]);

  // When bookings load, lazily fetch any driver/vehicle not yet in local state (prevents Unknown labels after edits)
  useEffect(() => {
    const missingDriverIds = Array.from(
      new Set(
        bookings
          .map((b) => b.driverId)
          .filter((id) => id && !drivers.find((d) => d.id === id)) as string[]
      )
    );
    const missingVehicleIds = Array.from(
      new Set(
        bookings
          .map((b) => b.vehicleId)
          .filter((id) => id && !vehicles.find((v) => v.id === id)) as string[]
      )
    );
    (async () => {
      for (const id of missingDriverIds) {
        try {
          const d = await driverAPI.get(id);
          setDrivers((prev) => [...prev, d as unknown as Driver]);
        } catch {
          /* ignore */
        }
      }
      for (const id of missingVehicleIds) {
        try {
          const v = await vehicleAPI.get(id);
          setVehicles((prev) => [...prev, v as unknown as Vehicle]);
        } catch {
          /* ignore */
        }
      }
    })();
  }, [bookings, drivers, vehicles]);

  useEffect(() => {
    localStorage.setItem("bolt_drivers", JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem("bolt_vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem("bolt_companies", JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem("bolt_customers", JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem("bolt_payments", JSON.stringify(payments));
  }, [payments]);

  // Booking functions
  const addBooking = async (booking: Omit<Booking, "id" | "createdAt">) => {
    try {
      const created = await bookingAPI.create(
        booking as unknown as Omit<Booking, "id" | "createdAt">
      );
      const newBooking: Booking = { ...(created as Booking) };
      setBookings((prev) => [...prev, newBooking]);
    } catch (err) {
      console.error("Create booking failed", err);
      const fallback: Booking = {
        ...booking,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as Booking;
      setBookings((prev) => [...prev, fallback]);
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    // optimistic
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    try {
      const updated = await bookingAPI.update(id, updates as Partial<Booking>);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...(updated as Booking) } : b))
      );
    } catch (err) {
      console.error("Update booking failed", err);
    }
  };

  const updateBookingStatus = async (
    id: string,
    status: Booking["status"],
    changedBy: string
  ) => {
    // optimistic status update
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    try {
      const updated = await bookingAPI.updateStatus(id, status, changedBy);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...(updated as Booking) } : b))
      );
    } catch (err) {
      console.error("Update booking status failed", err);
    }
  };

  const toggleBookingBilled = async (id: string, billed: boolean) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, billed } : b))
    );
    try {
      const updated = await bookingAPI.toggleBilled(id, billed);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...(updated as Booking) } : b))
      );
    } catch (err) {
      console.error("Toggle billed failed", err);
    }
  };

  const toggleDutySlipSubmitted = async (
    id: string,
    dutySlipSubmitted: boolean
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, dutySlipSubmitted } : b))
    );
    try {
      const updated = await bookingAPI.toggleDutySlipSubmitted(
        id,
        dutySlipSubmitted
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...(updated as Booking) } : b))
      );
    } catch (err) {
      console.error("Toggle duty slip submitted failed", err);
    }
  };

  const toggleDutySlipSubmittedToCompany = async (
    id: string,
    dutySlipSubmittedToCompany: boolean
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, dutySlipSubmittedToCompany } : b))
    );
    try {
      const updated = await bookingAPI.toggleDutySlipSubmittedToCompany(
        id,
        dutySlipSubmittedToCompany
      );
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...(updated as Booking) } : b))
      );
    } catch (err) {
      console.error("Toggle duty slip submitted to company failed", err);
    }
  };

  const deleteBooking = async (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
    try {
      /* await bookingAPI.delete(id); */
    } catch (err) {
      console.error("Delete booking failed", err);
    }
  };

  // Driver functions
  const addDriver = async (driver: Omit<Driver, "id" | "createdAt">) => {
    try {
      const created = await driverAPI.create({
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        aadhaar: driver.aadhaar,
        vehicleType: driver.vehicleType,
        licenseExpiry: driver.licenseExpiry,
        policeVerificationExpiry: driver.policeVerificationExpiry,
        paymentMode: driver.paymentMode,
        salary: driver.salary,
        dateOfJoining: driver.dateOfJoining,
        referenceNote: driver.referenceNote,
        status: driver.status,
        document:
          typeof driver.document === "string" ? driver.document : undefined,
        photo: driver.photo,
        advances: [],
      } as unknown as {
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
        status?: "active" | "inactive";
        document?: string;
        photo?: string;
        advances: [];
      });
      const newDriver: Driver = { ...(created as Driver) };
      setDrivers((prev) => [...prev, newDriver]);
    } catch (err) {
      console.error("Create driver failed", err);
      const fallback: Driver = {
        ...driver,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as Driver;
      setDrivers((prev) => [...prev, fallback]);
    }
  };

  const appendDriverLocal = (driver: Driver) => {
    setDrivers((prev) => [...prev, driver]);
  };

  const updateDriver = async (id: string, updates: Partial<Driver>) => {
    setDrivers((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
    try {
      const updated = await driverAPI.update(id, {
        ...updates,
        document:
          typeof updates.document === "string" ? updates.document : undefined,
      } as unknown as {
        name?: string;
        phone?: string;
        licenseNumber?: string;
        aadhaar?: string;
        vehicleType?: "owned" | "rented";
        licenseExpiry?: string;
        policeVerificationExpiry?: string;
        paymentMode?: "per-trip" | "daily" | "monthly" | "fuel-basis";
        salary?: number;
        dateOfJoining?: string;
        referenceNote?: string;
        status?: "active" | "inactive";
        document?: string;
        photo?: string;
      });
      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      );
    } catch (err) {
      console.error("Update driver failed", err);
    }
  };

  const deleteDriver = async (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    try {
      await driverAPI.delete(id);
    } catch (err) {
      console.error("Delete driver failed", err);
    }
  };

  const addDriverAdvance = async (
    driverId: string,
    advance: Omit<Advance, "id" | "settled">
  ) => {
    try {
      const updated = await driverAPI.addAdvance(
        driverId,
        advance.amount,
        advance.description
      );
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, ...updated } : d))
      );
    } catch (err) {
      console.error("Add advance failed", err);
      const newAdvance: Advance = {
        ...advance,
        id: Date.now().toString(),
        settled: false,
      };
      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driverId
            ? { ...d, advances: [...d.advances, newAdvance] }
            : d
        )
      );
    }
  };

  // Vehicle functions
  const addVehicle = async (
    vehicle: Omit<Vehicle, "id" | "createdAt">,
    files?: { photoFile?: File; documentFile?: File }
  ) => {
    try {
      type VehicleCreatePayload = Parameters<typeof vehicleAPI.create>[0];
      const payload: VehicleCreatePayload = {
        registrationNumber: vehicle.registrationNumber,
        categoryId: vehicle.categoryId,
        category: vehicle.category,
        owner: vehicle.owner,
        insuranceExpiry: vehicle.insuranceExpiry,
        fitnessExpiry: vehicle.fitnessExpiry,
        permitExpiry: vehicle.permitExpiry,
        pollutionExpiry: vehicle.pollutionExpiry,
        status: vehicle.status,
        ...(files?.photoFile ? { photoFile: files.photoFile } : {}),
        ...(files?.documentFile ? { documentFile: files.documentFile } : {}),
      };
      const created = await vehicleAPI.create(payload);
      const newVehicle: Vehicle = { ...(created as Vehicle) };
      setVehicles((prev) => [...prev, newVehicle]);
    } catch (err) {
      console.error("Create vehicle failed", err);
      // fallback local add so user not blocked
      const fallback: Vehicle = {
        ...vehicle,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      } as Vehicle;
      setVehicles((prev) => [...prev, fallback]);
    }
  };

  const updateVehicle = async (
    id: string,
    updates: Partial<Vehicle>,
    files?: { photoFile?: File; documentFile?: File }
  ) => {
    // optimistic update
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
    try {
      type VehicleUpdatePayload = Parameters<typeof vehicleAPI.update>[1];
      const payload: VehicleUpdatePayload = {
        registrationNumber: updates.registrationNumber,
        categoryId: updates.categoryId,
        category: updates.category,
        owner: updates.owner,
        insuranceExpiry: updates.insuranceExpiry,
        fitnessExpiry: updates.fitnessExpiry,
        permitExpiry: updates.permitExpiry,
        pollutionExpiry: updates.pollutionExpiry,
        status: updates.status,
        mileageTrips: updates.mileageTrips,
        mileageKm: updates.mileageKm,
        ...(files?.photoFile ? { photoFile: files.photoFile } : {}),
        ...(files?.documentFile ? { documentFile: files.documentFile } : {}),
      } as VehicleUpdatePayload;
      const updated = await vehicleAPI.update(id, payload);
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updated } : v))
      );
    } catch (err) {
      console.error("Update vehicle failed", err);
    }
  };

  const deleteVehicle = async (id: string) => {
    // optimistic remove
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    try {
      await vehicleAPI.delete(id);
    } catch (err) {
      console.error("Delete vehicle failed", err);
    }
  };

  // Company functions
  const addCompany = async (company: Omit<Company, "id" | "createdAt">) => {
    try {
      const created = await companyAPI.create({
        name: company.name,
        gst: company.gst,
        address: company.address,
        contactPerson: company.contactPerson,
        phone: company.phone,
        email: company.email,
      });
      const newCompany: Company = { ...created } as Company;
      setCompanies((prev) => [...prev, newCompany]);
    } catch (err) {
      console.error("Create company failed", err);
    }
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    try {
      const updated = await companyAPI.update(id, updates);
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === id ? { ...company, ...updated } : company
        )
      );
    } catch (err) {
      console.error("Update company failed", err);
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      await companyAPI.delete(id);
      setCompanies((prev) => prev.filter((company) => company.id !== id));
    } catch (err) {
      console.error("Delete company failed", err);
    }
  };

  // Customer functions
  const addCustomer = async (customer: Omit<Customer, "id" | "createdAt">) => {
    try {
      const created = await customerAPI.create(customer);
      setCustomers((prev) => [...prev, created as Customer]);
    } catch (err) {
      console.error("Create customer failed", err);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const updated = await customerAPI.update(id, updates);
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
      );
    } catch (err) {
      console.error("Update customer failed", err);
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerAPI.delete(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Delete customer failed", err);
    }
  };

  // Payment functions
  const addPayment = (payment: Omit<Payment, "id">) => {
    const newPayment: Payment = { ...payment, id: Date.now().toString() };
    setPayments((prev) => [...prev, newPayment]);

    // Side effects: adjust outstanding / advance settlement if applicable
    if (
      newPayment.entityType === "customer" &&
      newPayment.type === "received"
    ) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === newPayment.entityId
            ? {
                ...c,
                outstandingAmount: Math.max(
                  0,
                  c.outstandingAmount - newPayment.amount
                ),
              }
            : c
        )
      );
    }

    if (
      newPayment.entityType === "driver" &&
      newPayment.type === "paid" &&
      newPayment.relatedAdvanceId
    ) {
      setDrivers((prev) =>
        prev.map((d) => {
          if (d.id !== newPayment.entityId) return d;
          return {
            ...d,
            advances: d.advances.map((a) =>
              a.id === newPayment.relatedAdvanceId ? { ...a, settled: true } : a
            ),
          };
        })
      );
    }
  };

  const settleDriverAdvance = async (
    driverId: string,
    advanceId: string,
    amount?: number
  ) => {
    const driver = drivers.find((d) => d.id === driverId);
    const adv = driver?.advances.find((a) => a.id === advanceId);
    if (!driver || !adv || adv.settled) return;
    addPayment({
      entityId: driverId,
      entityType: "driver",
      amount: amount ?? adv.amount,
      type: "paid",
      date: new Date().toISOString(),
      description: `Advance settlement (#${advanceId})`,
      relatedAdvanceId: advanceId,
    });
    try {
      await driverAPI.settleAdvance(driverId, advanceId);
    } catch (err) {
      console.error("Settle advance failed", err);
    }
  };

  const recordCompanyPayment = (
    companyId: string,
    amount: number,
    description?: string
  ) => {
    // optimistic UI update
    addPayment({
      entityId: companyId,
      entityType: "customer",
      amount,
      type: "received",
      date: new Date().toISOString(),
      description: description || "Customer payment",
    });
    companyAPI.recordPayment(companyId, amount, description).catch((err) => {
      console.error("Record payment failed", err);
    });
  };

  const resetSampleData = () => {
    setBookings(mockBookings);
    setDrivers(mockDrivers);
    setVehicles(mockVehicles);
    setCompanies(mockCompanies);
    setCustomers([]);
    setPayments([]);
    localStorage.setItem("bolt_bookings", JSON.stringify(mockBookings));
    localStorage.setItem("bolt_drivers", JSON.stringify(mockDrivers));
    localStorage.setItem("bolt_vehicles", JSON.stringify(mockVehicles));
    localStorage.setItem("bolt_companies", JSON.stringify(mockCompanies));
    localStorage.setItem("bolt_payments", JSON.stringify([]));
  };

  return (
    <AppContext.Provider
      value={{
        bookings,
        addBooking,
        updateBooking,
        deleteBooking,
        updateBookingStatus,
        toggleBookingBilled,
        toggleDutySlipSubmitted,
        toggleDutySlipSubmittedToCompany,
        bookingsLoading,
        drivers,
        addDriver,
        appendDriverLocal,
        updateDriver,
        deleteDriver,
        addDriverAdvance,
        driversLoading,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        vehiclesLoading,
        companies,
        addCompany,
        updateCompany,
        deleteCompany,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        customersLoading,
        payments,
        addPayment,
        settleDriverAdvance,
        recordCompanyPayment,
        resetSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
//export
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
