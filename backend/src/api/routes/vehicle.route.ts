// src/routes/vehicle.route.ts
import { Router } from 'express';
import * as controller from '../controller/vehicle.controller';
import { auth, upload } from '../middleware';
import { UserRole } from '../types';

const router = Router();

router.post('/', auth(['admin', 'dispatcher']), upload, controller.createVehicle);
router.get('/', auth(['admin', 'dispatcher', 'driver']), controller.getVehicles);
router.get('/:id', auth(['admin', 'dispatcher', 'driver']), controller.getVehicleById);
router.put('/:id', auth(['admin', 'dispatcher']), upload, controller.updateVehicle);
router.delete('/:id', auth(['admin', 'dispatcher']), controller.deleteVehicle);

export { router as vehicleRouter };