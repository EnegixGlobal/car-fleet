"use strict";
// // src/validation/index.ts
// import { z } from 'zod';
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuelEntrySchema = exports.driverBookingPaymentUpdateSchema = exports.driverBookingPaymentSchema = exports.paymentSchema = exports.updateCompanySchema = exports.companySchema = exports.updateVehicleServicingSchema = exports.vehicleServicingSchema = exports.updateVehicleCategorySchema = exports.vehicleCategorySchema = exports.updateVehicleSchema = exports.vehicleSchema = exports.advanceSchema = exports.updateDriverSchema = exports.driverSchema = exports.statusSchema = exports.bookingPaymentSchema = exports.expenseSchema = exports.updateCustomerSchema = exports.customerSchema = exports.updateBookingSchema = exports.bookingSchema = exports.updateUserSchema = exports.loginSchema = exports.registerSchema = void 0;
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
const zod_1 = require("zod");
// src/validation/index.ts (Update date fields)
const dateSchema = zod_1.z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" })
    .transform((val) => new Date(val));
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password too short"),
    name: zod_1.z.string().min(1, "Name required"),
    phone: zod_1.z.string().min(10, "Invalid phone"),
    role: zod_1.z.enum(["admin", "accountant", "dispatcher", "driver", "customer"]),
    driverId: zod_1.z.string().optional(),
    customerId: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(1, "Password required"),
});
exports.updateUserSchema = exports.registerSchema.partial();
exports.bookingSchema = zod_1.z.object({
    customerId: zod_1.z.string().optional(),
    customerName: zod_1.z.string().min(1, "Customer name required"),
    customerPhone: zod_1.z.string().min(10, "Invalid phone"),
    bookingSource: zod_1.z.enum(["company", "travel-agency", "individual"]),
    companyId: zod_1.z.string().optional(),
    pickupLocation: zod_1.z.string().min(1, "Pickup required"),
    dropLocation: zod_1.z.string().min(1, "Drop required"),
    journeyType: zod_1.z.enum([
        "outstation-one-way",
        "outstation",
        "local-outstation",
        "local",
        "transfer",
    ]),
    cityOfWork: zod_1.z.string().optional(),
    startDate: zod_1.z.string().datetime("Invalid date"),
    endDate: zod_1.z.string().datetime("Invalid date"),
    vehicleId: zod_1.z.string().optional(),
    vehicleCategoryId: zod_1.z.string().optional(),
    driverId: zod_1.z.string().optional(),
    tariffRate: zod_1.z.number().min(0, "Positive rate"),
    totalAmount: zod_1.z.number().min(0, "Positive amount"),
    advanceReceived: zod_1.z.number().min(0, "Positive advance"),
    advanceReason: zod_1.z.string().optional(),
});
exports.updateBookingSchema = exports.bookingSchema.partial().extend({
    billed: zod_1.z.boolean().optional(),
    dutySlipSubmitted: zod_1.z.boolean().optional(),
    dutySlipSubmittedToCompany: zod_1.z.boolean().optional(),
    finalPaid: zod_1.z.number().min(0).optional(),
});
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(10),
    email: zod_1.z.string().email().optional(),
    address: zod_1.z.string().optional(),
    companyId: zod_1.z.string().optional(),
});
exports.updateCustomerSchema = exports.customerSchema.partial();
exports.expenseSchema = zod_1.z.object({
    type: zod_1.z.enum(["fuel", "toll", "parking", "night", "perday", "rent", "other"]),
    amount: zod_1.z.number().min(0),
    description: zod_1.z.string().min(1),
});
exports.bookingPaymentSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0),
    comments: zod_1.z.string().optional(),
    collectedBy: zod_1.z.string().optional(),
    paidOn: zod_1.z.string().datetime(),
});
exports.statusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        "booked",
        "ongoing",
        "completed",
        "yet-to-start",
        "canceled",
    ]),
    changedBy: zod_1.z.string().min(1),
});
exports.driverSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(10),
    licenseNumber: zod_1.z.string().min(1),
    aadhaar: zod_1.z.string().min(12),
    vehicleType: zod_1.z.enum(["owned", "rented"]),
    licenseExpiry: zod_1.z.string().datetime(),
    policeVerificationExpiry: zod_1.z.string().datetime(),
    paymentMode: zod_1.z.enum(["per-trip", "daily", "monthly", "fuel-basis"]),
    // salary optional now
    salary: zod_1.z.number().min(0).optional(),
    dateOfJoining: zod_1.z.string().datetime(),
    referenceNote: zod_1.z.string().optional(),
    status: zod_1.z.enum(["active", "inactive"]).optional(),
});
exports.updateDriverSchema = exports.driverSchema.partial();
exports.advanceSchema = zod_1.z.object({
    amount: zod_1.z.number().min(0),
    description: zod_1.z.string().optional(),
});
exports.vehicleSchema = zod_1.z
    .object({
    registrationNumber: zod_1.z.string().min(1),
    // Accept either a free-form legacy category string or a managed categoryId (one must be provided)
    category: zod_1.z.string().min(1).optional(),
    categoryId: zod_1.z.string().optional(),
    owner: zod_1.z.enum(["owned", "rented"]),
    insuranceExpiry: zod_1.z.string().datetime(),
    fitnessExpiry: zod_1.z.string().datetime(),
    permitExpiry: zod_1.z.string().datetime(),
    pollutionExpiry: zod_1.z.string().datetime(),
    photo: zod_1.z.string().optional(),
    document: zod_1.z.string().optional(),
})
    .refine((d) => !!d.category || !!d.categoryId, {
    message: "category or categoryId is required",
    path: ["category"],
});
exports.updateVehicleSchema = exports.vehicleSchema.partial().extend({
    status: zod_1.z.enum(["active", "maintenance", "inactive"]).optional(),
    mileageTrips: zod_1.z.number().optional(),
    mileageKm: zod_1.z.number().optional(),
});
// Vehicle Category
exports.vehicleCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
exports.updateVehicleCategorySchema = exports.vehicleCategorySchema.partial();
// Vehicle Servicing validation (allows partial updates of arrays of records)
const dateString = zod_1.z.string().datetime().optional();
const oilChangeItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    price: zod_1.z.number().min(0),
    kilometers: zod_1.z.number().min(0),
});
const partReplacementItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    part: zod_1.z.string().min(1),
    price: zod_1.z.number().min(0),
});
const tyreItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    details: zod_1.z.string().min(1),
    price: zod_1.z.number().min(0),
});
const installmentItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    description: zod_1.z.string().min(1),
    amount: zod_1.z.number().min(0),
});
const insuranceItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    provider: zod_1.z.string().optional(),
    policyNumber: zod_1.z.string().optional(),
    cost: zod_1.z.number().min(0),
    validFrom: zod_1.z.string().datetime().optional(),
    validTo: zod_1.z.string().datetime().optional(),
});
const legalPaperItem = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    date: zod_1.z.string().datetime().optional(),
    type: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    cost: zod_1.z.number().min(0),
    expiryDate: zod_1.z.string().datetime().optional(),
});
exports.vehicleServicingSchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1),
    oilChanges: zod_1.z.array(oilChangeItem).optional(),
    partsReplacements: zod_1.z.array(partReplacementItem).optional(),
    tyres: zod_1.z.array(tyreItem).optional(),
    installments: zod_1.z.array(installmentItem).optional(),
    insurances: zod_1.z.array(insuranceItem).optional(),
    legalPapers: zod_1.z.array(legalPaperItem).optional(),
});
exports.updateVehicleServicingSchema = exports.vehicleServicingSchema.partial();
exports.companySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    gst: zod_1.z.string().min(15),
    address: zod_1.z.string().min(1),
    contactPerson: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(10),
    email: zod_1.z.string().email(),
});
exports.updateCompanySchema = exports.companySchema.partial().extend({
    outstandingAmount: zod_1.z.number().min(0).optional(),
});
exports.paymentSchema = zod_1.z.object({
    entityId: zod_1.z.string().uuid(),
    entityType: zod_1.z.enum(["customer", "driver"]),
    amount: zod_1.z.number().min(0).positive(),
    type: zod_1.z.enum(["received", "paid"]),
    description: zod_1.z.string().optional(),
    relatedAdvanceId: zod_1.z.string().uuid().optional(),
});
// Driver payment for a specific booking
exports.driverBookingPaymentSchema = zod_1.z
    .object({
    driverId: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().min(1),
    mode: zod_1.z.enum(["per-trip", "daily", "fuel-basis"]),
    amount: zod_1.z.number().min(0).optional(), // may be auto-computed for fuel-basis
    fuelQuantity: zod_1.z.number().min(0).optional(),
    fuelRate: zod_1.z.number().min(0).optional(),
    distanceKm: zod_1.z.number().min(0).optional(),
    mileage: zod_1.z.number().min(0).optional(),
    description: zod_1.z.string().optional(),
})
    .refine((d) => {
    if (d.mode === "fuel-basis") {
        const hasExplicit = d.fuelQuantity !== undefined && d.fuelRate !== undefined;
        const hasDerived = d.distanceKm !== undefined &&
            d.mileage !== undefined &&
            d.mileage > 0 &&
            d.fuelRate !== undefined;
        return hasExplicit || hasDerived;
    }
    return d.amount !== undefined; // per-trip or daily must provide amount
}, {
    message: "Provide amount (per-trip/daily) OR (fuelQuantity & fuelRate) OR (distanceKm & mileage ( >0 ) & fuelRate) for fuel-basis",
});
exports.driverBookingPaymentUpdateSchema = zod_1.z
    .object({
    mode: zod_1.z.enum(["per-trip", "daily", "fuel-basis"]).optional(),
    amount: zod_1.z.number().min(0).optional(),
    fuelQuantity: zod_1.z.number().min(0).optional(),
    fuelRate: zod_1.z.number().min(0).optional(),
    distanceKm: zod_1.z.number().min(0).optional(),
    mileage: zod_1.z.number().min(0).optional(),
    description: zod_1.z.string().optional(),
    settle: zod_1.z.boolean().optional(), // if true -> mark settled
})
    .superRefine((d, ctx) => {
    if (d.mode === "fuel-basis") {
        const hasExplicit = d.fuelQuantity !== undefined && d.fuelRate !== undefined;
        const hasDerived = d.distanceKm !== undefined &&
            d.mileage !== undefined &&
            d.mileage > 0 &&
            d.fuelRate !== undefined;
        if (!hasExplicit && !hasDerived) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "Provide (fuelQuantity & fuelRate) OR (distanceKm & mileage (>0) & fuelRate) for fuel-basis",
            });
        }
    }
    else if (d.mode === "per-trip" || d.mode === "daily") {
        if (d.amount === undefined) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                message: "amount required for per-trip/daily",
            });
        }
    }
});
// Fuel entry creation validation
exports.fuelEntrySchema = zod_1.z.object({
    vehicleId: zod_1.z.string().min(1),
    bookingId: zod_1.z.string().min(1),
    addedByType: zod_1.z.enum(["self", "driver"]),
    fuelFillDate: zod_1.z.string().datetime(),
    totalTripKm: zod_1.z.number().min(0),
    vehicleFuelAverage: zod_1.z.number().min(0),
    fuelQuantity: zod_1.z.number().min(0),
    fuelRate: zod_1.z.number().min(0),
    comment: zod_1.z.string().optional(),
    includeInFinance: zod_1.z.boolean().optional(),
});
