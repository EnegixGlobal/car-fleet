// // src/validation/index.ts
// import { z } from 'zod';

// export const registerSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(6),
//   name: z.string().min(1),
//   phone: z.string().min(10),
//   role: z.enum(['admin', 'accountant', 'dispatcher', 'driver', 'customer']),
// });

// export const loginSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(1),
// });

// export const bookingSchema = z.object({
//   customerName: z.string().min(1),
//   customerPhone: z.string().min(10),
//   bookingSource: z.enum(['company', 'travel-agency', 'individual']),
//   companyId: z.string().optional(),
//   pickupLocation: z.string().min(1),
//   dropLocation: z.string().min(1),
//   journeyType: z.enum(['outstation', 'local', 'one-way', 'round-trip']),
//   startDate: z.string().datetime(),
//   endDate: z.string().datetime(),
//   vehicleId: z.string().optional(),
//   driverId: z.string().optional(),
//   tariffRate: z.number().min(0),
//   totalAmount: z.number().min(0),
//   advanceReceived: z.number().min(0),
// });

// export const updateBookingSchema = bookingSchema.partial().refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

// export const expenseSchema = z.object({
//   type: z.enum(['fuel', 'toll', 'parking', 'other']),
//   amount: z.number().min(0),
//   description: z.string().min(1),
// });

// export const statusSchema = z.object({
//   status: z.enum(['booked', 'ongoing', 'completed']),
// });

// export const driverSchema = z.object({
//   name: z.string().min(1),
//   phone: z.string().min(10),
//   licenseNumber: z.string().min(1),
//   aadhaar: z.string().min(12),
//   vehicleType: z.enum(['owned', 'rented']),
//   licenseExpiry: z.string().datetime(),
//   policeVerificationExpiry: z.string().datetime(),
//   paymentMode: z.enum(['per-trip', 'daily', 'monthly', 'fuel-basis']),
//   salary: z.number().min(0),
// });

// export const updateDriverSchema = driverSchema.partial();

// export const advanceSchema = z.object({
//   amount: z.number().min(0),
//   description: z.string().optional(),
// });

// export const vehicleSchema = z.object({
//   registrationNumber: z.string().min(1),
//   category: z.enum(['SUV', 'sedan', 'bus', 'mini-bus']),
//   owner: z.enum(['owned', 'rented']),
//   insuranceExpiry: z.string().datetime(),
//   fitnessExpiry: z.string().datetime(),
//   permitExpiry: z.string().datetime(),
//   pollutionExpiry: z.string().datetime(),
// });

// export const updateVehicleSchema = vehicleSchema.partial().extend({
//   status: z.enum(['active', 'maintenance', 'inactive']).optional(),
//   mileageTrips: z.number().optional(),
//   mileageKm: z.number().optional(),
// });

// export const companySchema = z.object({
//   name: z.string().min(1),
//   gst: z.string().min(15),
//   address: z.string().min(1),
//   contactPerson: z.string().min(1),
//   phone: z.string().min(10),
//   email: z.string().email(),
// });

// export const updateCompanySchema = companySchema.partial().extend({
//   outstandingAmount: z.number().min(0).optional(),
// });

// export const paymentSchema = z.object({
//   entityId: z.string(),
//   entityType: z.enum(['customer', 'driver']),
//   amount: z.number().min(0),
//   type: z.enum(['received', 'paid']),
//   description: z.string().optional(),
//   relatedAdvanceId: z.string().optional(),
// });

// src/validation/index.ts
import { z } from "zod";

// src/validation/index.ts (Update date fields)
const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
  .transform((val) => new Date(val));

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
  name: z.string().min(1, "Name required"),
  phone: z.string().min(10, "Invalid phone"),
  role: z.enum(["admin", "accountant", "dispatcher", "driver", "customer"]),
  driverId: z.string().optional(),
  customerId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export const updateUserSchema = registerSchema.partial();

export const bookingSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name required"),
  customerPhone: z.string().min(10, "Invalid phone"),
  bookingSource: z.enum(["company", "travel-agency", "individual"]),
  companyId: z.string().optional(),
  pickupLocation: z.string().min(1, "Pickup required"),
  dropLocation: z.string().min(1, "Drop required"),
  journeyType: z.enum([
    "outstation-one-way",
    "outstation",
    "local-outstation",
    "local",
    "transfer",
  ]),
  cityOfWork: z.string().optional(),
  startDate: z.string().datetime("Invalid date"),
  endDate: z.string().datetime("Invalid date"),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  tariffRate: z.number().min(0, "Positive rate"),
  totalAmount: z.number().min(0, "Positive amount"),
  advanceReceived: z.number().min(0, "Positive advance"),
  advanceReason: z.string().optional(),
});

export const updateBookingSchema = bookingSchema.partial().extend({
  billed: z.boolean().optional(),
  dutySlipSubmitted: z.boolean().optional(),
  dutySlipSubmittedToCompany: z.boolean().optional(),
  finalPaid: z.number().min(0).optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional(),
  address: z.string().optional(),
  companyId: z.string().optional(),
});

export const updateCustomerSchema = customerSchema.partial();

export const expenseSchema = z.object({
  type: z.enum(["fuel", "toll", "parking", "night", "perday", "rent", "other"]),
  amount: z.number().min(0),
  description: z.string().min(1),
});

export const bookingPaymentSchema = z.object({
  amount: z.number().min(0),
  comments: z.string().optional(),
  collectedBy: z.string().optional(),
  paidOn: z.string().datetime(),
});

export const statusSchema = z.object({
  status: z.enum([
    "booked",
    "ongoing",
    "completed",
    "yet-to-start",
    "canceled",
  ]),
  changedBy: z.string().min(1),
});

export const driverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  licenseNumber: z.string().min(1),
  aadhaar: z.string().min(12),
  vehicleType: z.enum(["owned", "rented"]),
  licenseExpiry: z.string().datetime(),
  policeVerificationExpiry: z.string().datetime(),
  paymentMode: z.enum(["per-trip", "daily", "monthly", "fuel-basis"]),
  // salary optional now
  salary: z.number().min(0).optional(),
  dateOfJoining: z.string().datetime(),
  referenceNote: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateDriverSchema = driverSchema.partial();

export const advanceSchema = z.object({
  amount: z.number().min(0),
  description: z.string().optional(),
});

export const vehicleSchema = z
  .object({
    registrationNumber: z.string().min(1),
    // Accept either a free-form legacy category string or a managed categoryId (one must be provided)
    category: z.string().min(1).optional(),
    categoryId: z.string().optional(),
    owner: z.enum(["owned", "rented"]),
    insuranceExpiry: z.string().datetime(),
    fitnessExpiry: z.string().datetime(),
    permitExpiry: z.string().datetime(),
    pollutionExpiry: z.string().datetime(),
    photo: z.string().optional(),
    document: z.string().optional(),
  })
  .refine((d) => !!d.category || !!d.categoryId, {
    message: "category or categoryId is required",
    path: ["category"],
  });

export const updateVehicleSchema = vehicleSchema.partial().extend({
  status: z.enum(["active", "maintenance", "inactive"]).optional(),
  mileageTrips: z.number().optional(),
  mileageKm: z.number().optional(),
});

// Vehicle Category
export const vehicleCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateVehicleCategorySchema = vehicleCategorySchema.partial();

// Vehicle Servicing validation (allows partial updates of arrays of records)
const dateString = z.string().datetime().optional();

const oilChangeItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  price: z.number().min(0),
  kilometers: z.number().min(0),
});
const partReplacementItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  part: z.string().min(1),
  price: z.number().min(0),
});
const tyreItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  details: z.string().min(1),
  price: z.number().min(0),
});
const installmentItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  description: z.string().min(1),
  amount: z.number().min(0),
});
const insuranceItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  provider: z.string().optional(),
  policyNumber: z.string().optional(),
  cost: z.number().min(0),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});
const legalPaperItem = z.object({
  _id: z.string().optional(),
  date: z.string().datetime().optional(),
  type: z.string().min(1),
  description: z.string().optional(),
  cost: z.number().min(0),
  expiryDate: z.string().datetime().optional(),
});

export const vehicleServicingSchema = z.object({
  vehicleId: z.string().min(1),
  oilChanges: z.array(oilChangeItem).optional(),
  partsReplacements: z.array(partReplacementItem).optional(),
  tyres: z.array(tyreItem).optional(),
  installments: z.array(installmentItem).optional(),
  insurances: z.array(insuranceItem).optional(),
  legalPapers: z.array(legalPaperItem).optional(),
});

export const updateVehicleServicingSchema = vehicleServicingSchema.partial();

export const companySchema = z.object({
  name: z.string().min(1),
  gst: z.string().min(15),
  address: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email(),
});

export const updateCompanySchema = companySchema.partial().extend({
  outstandingAmount: z.number().min(0).optional(),
});

export const paymentSchema = z.object({
  entityId: z.string().uuid(),
  entityType: z.enum(["customer", "driver"]),
  amount: z.number().min(0).positive(),
  type: z.enum(["received", "paid"]),
  description: z.string().optional(),
  relatedAdvanceId: z.string().uuid().optional(),
});

// Driver payment for a specific booking
export const driverBookingPaymentSchema = z
  .object({
    driverId: z.string().min(1),
    bookingId: z.string().min(1),
    mode: z.enum(["per-trip", "daily", "fuel-basis"]),
    amount: z.number().min(0).optional(), // may be auto-computed for fuel-basis
    fuelQuantity: z.number().min(0).optional(),
    fuelRate: z.number().min(0).optional(),
    distanceKm: z.number().min(0).optional(),
    mileage: z.number().min(0).optional(),
    description: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.mode === "fuel-basis") {
        const hasExplicit =
          d.fuelQuantity !== undefined && d.fuelRate !== undefined;
        const hasDerived =
          d.distanceKm !== undefined &&
          d.mileage !== undefined &&
          d.mileage > 0 &&
          d.fuelRate !== undefined;
        return hasExplicit || hasDerived;
      }
      return d.amount !== undefined; // per-trip or daily must provide amount
    },
    {
      message:
        "Provide amount (per-trip/daily) OR (fuelQuantity & fuelRate) OR (distanceKm & mileage ( >0 ) & fuelRate) for fuel-basis",
    }
  );

export const driverBookingPaymentUpdateSchema = z
  .object({
    mode: z.enum(["per-trip", "daily", "fuel-basis"]).optional(),
    amount: z.number().min(0).optional(),
    fuelQuantity: z.number().min(0).optional(),
    fuelRate: z.number().min(0).optional(),
    distanceKm: z.number().min(0).optional(),
    mileage: z.number().min(0).optional(),
    description: z.string().optional(),
    settle: z.boolean().optional(), // if true -> mark settled
  })
  .superRefine((d, ctx) => {
    if (d.mode === "fuel-basis") {
      const hasExplicit =
        d.fuelQuantity !== undefined && d.fuelRate !== undefined;
      const hasDerived =
        d.distanceKm !== undefined &&
        d.mileage !== undefined &&
        d.mileage > 0 &&
        d.fuelRate !== undefined;
      if (!hasExplicit && !hasDerived) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Provide (fuelQuantity & fuelRate) OR (distanceKm & mileage (>0) & fuelRate) for fuel-basis",
        });
      }
    } else if (d.mode === "per-trip" || d.mode === "daily") {
      if (d.amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "amount required for per-trip/daily",
        });
      }
    }
  });

// Fuel entry creation validation
export const fuelEntrySchema = z.object({
  vehicleId: z.string().min(1),
  bookingId: z.string().min(1),
  addedByType: z.enum(["self", "driver"]),
  fuelFillDate: z.string().datetime(),
  totalTripKm: z.number().min(0),
  vehicleFuelAverage: z.number().min(0),
  fuelQuantity: z.number().min(0),
  fuelRate: z.number().min(0),
  comment: z.string().optional(),
  includeInFinance: z.boolean().optional(),
});
