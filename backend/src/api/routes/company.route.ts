// src/routes/company.route.ts (Updated)
import { Router } from 'express';
import * as controller from '../controller/company.controller';
import { auth } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/', auth(['admin', 'dispatcher']), controller.createCompany);
router.get('/', auth(['admin', 'accountant', 'dispatcher', 'driver']), controller.getCompanies); // Dispatcher added
router.get('/:id', auth(['admin', 'accountant', 'dispatcher', 'driver']), controller.getCompanyById);
router.get('/:id/overview', auth(['admin', 'accountant', 'dispatcher', 'driver']), controller.getCompanyOverview);
router.put('/:id', auth(['admin', 'accountant']), controller.updateCompany);
router.delete('/:id', auth(['admin', 'accountant']), controller.deleteCompany);
router.post('/:id/payments', auth(['admin', 'accountant']), controller.recordPayment);

export { router as companyRouter };