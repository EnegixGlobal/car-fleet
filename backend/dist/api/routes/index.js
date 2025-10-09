"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const auth_route_1 = require("./auth.route");
const booking_route_1 = require("./booking.route");
const driver_route_1 = require("./driver.route");
const vehicle_route_1 = require("./vehicle.route");
const company_route_1 = require("./company.route");
const payment_route_1 = require("./payment.route");
const report_route_1 = require("./report.route");
const finance_route_1 = require("./finance.route");
const customer_route_1 = require("./customer.route");
const vehicleCategory_route_1 = require("./vehicleCategory.route");
const vehicleServicing_route_1 = require("./vehicleServicing.route");
const fuel_route_1 = require("./fuel.route");
const city_route_1 = require("./city.route");
const middleware_1 = require("../middleware");
const driverReportController = __importStar(require("../controller/driverReport.controller"));
const router = (0, express_1.Router)();
exports.apiRouter = router;
router.use('/auth', auth_route_1.authRouter);
router.use('/bookings', middleware_1.apiLimiter, booking_route_1.bookingRouter);
router.use('/drivers', middleware_1.apiLimiter, driver_route_1.driverRouter);
router.use('/vehicles', middleware_1.apiLimiter, vehicle_route_1.vehicleRouter);
router.use('/companies', middleware_1.apiLimiter, company_route_1.companyRouter);
router.use('/payments', middleware_1.apiLimiter, payment_route_1.paymentRouter);
router.use('/reports', middleware_1.apiLimiter, report_route_1.reportRouter);
router.use('/finance', middleware_1.apiLimiter, finance_route_1.financeRouter);
router.use('/customers', middleware_1.apiLimiter, customer_route_1.customerRouter);
router.use('/vehicle-categories', middleware_1.apiLimiter, vehicleCategory_route_1.vehicleCategoryRouter);
router.use('/vehicles', middleware_1.apiLimiter, vehicleServicing_route_1.vehicleServicingRouter); // nested servicing endpoints under /vehicles/:vehicleId/servicing
router.use('/fuel', middleware_1.apiLimiter, fuel_route_1.fuelRouter);
router.use('/cities', city_route_1.cityRouter);
// aggregated driver reports month listing
router.get('/driver-reports', middleware_1.apiLimiter, (0, middleware_1.auth)(['admin', 'dispatcher', 'accountant']), driverReportController.listAllDriverMonthReports);
