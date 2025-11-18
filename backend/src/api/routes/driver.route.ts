// src/routes/driver.route.ts
import { Router } from 'express';
import * as controller from '../controller/driver.controller';
import * as reportController from '../controller/driverReport.controller';
import { auth, upload } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/', auth(['admin', 'dispatcher']), upload, controller.createDriver);
router.get('/', auth(['admin', 'dispatcher', 'driver']), controller.getDrivers);
router.get('/:id', auth(['admin', 'dispatcher', 'driver']), controller.getDriverById);
router.put('/:id', auth(['admin', 'dispatcher']), upload, controller.updateDriver);
router.delete('/:id', auth(['admin', 'dispatcher']), controller.deleteDriver);
router.post('/:id/advances', auth(['admin', 'accountant']), controller.addAdvance);
router.put('/:id/settle-advance', auth(['admin', 'accountant']), controller.settleAdvance);

// Driver management report endpoints
router.get('/:driverId/reports', auth(['admin','dispatcher','accountant']), reportController.listDriverMonthReports);
router.put('/:driverId/reports', auth(['admin','dispatcher','accountant']), reportController.upsertDriverReport);


export { router as driverRouter };