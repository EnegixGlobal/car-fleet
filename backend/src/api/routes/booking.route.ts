// src/routes/booking.route.ts (Updated)
import { Router } from 'express';
import * as controller from '../controller/booking.controller';
import { auth } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/', auth(['admin', 'dispatcher']), controller.createBooking);
router.get('/', auth(['admin', 'dispatcher', 'driver', 'customer']), controller.getBookings); // Customer can read
router.get('/:id', auth(['admin', 'dispatcher', 'driver', 'customer']), controller.getBookingById);
router.put('/:id', auth(['admin', 'dispatcher']), controller.updateBooking); // No driver mutation
router.delete('/:id', auth(['admin', 'dispatcher']), controller.deleteBooking);
router.post('/:id/expenses', auth(['admin', 'dispatcher']), controller.addExpense);
router.put('/:id/expenses/:expenseId', auth(['admin', 'dispatcher']), controller.updateExpense);
router.delete('/:id/expenses/:expenseId', auth(['admin', 'dispatcher']), controller.deleteExpense);
router.put('/:id/status', auth(['admin', 'dispatcher', 'driver']), controller.updateStatus); // Driver can update status
router.post('/:id/duty-slips', auth(['admin', 'dispatcher']), controller.uploadDutySlips);
router.put('/:id/remove-duty-slip', auth(['admin', 'dispatcher']), controller.removeDutySlip);
router.post('/:id/payments', auth(['admin','accountant','dispatcher']), controller.addPayment);
router.get('/:id/payments', auth(['admin','accountant','dispatcher','customer']), controller.getPayments);
router.put('/:id/payments/:paymentId', auth(['admin','accountant','dispatcher']), controller.updatePayment);
router.delete('/:id/payments/:paymentId', auth(['admin','accountant','dispatcher']), controller.deletePayment);
// Driver payment (per booking)
router.post('/:id/driver-payments', auth(['admin','accountant','dispatcher']), controller.addDriverPayment);
router.get('/:id/driver-payments', auth(['admin','accountant','dispatcher']), controller.listDriverPayments);
router.put('/:id/driver-payments/:paymentId', auth(['admin','accountant','dispatcher']), controller.updateDriverPayment);
router.delete('/:id/driver-payments/:paymentId', auth(['admin','accountant','dispatcher']), controller.deleteDriverPayment);
router.get('/:id/driver-payments-export', auth(['admin','accountant','dispatcher']), controller.exportDriverPayments);
router.put('/:id/settle', auth(['admin','accountant','dispatcher']), controller.toggleSettled);

export { router as bookingRouter };