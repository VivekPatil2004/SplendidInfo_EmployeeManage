import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate, createEmployeeSchema, updateEmployeeSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { employeeController } from '../controllers/employeeController';

const router = express.Router();

router.get('/', protect, asyncHandler(employeeController.getAll));
router.post('/', protect, adminOnly, validate(createEmployeeSchema), asyncHandler(employeeController.create));
router.put('/:id', protect, adminOnly, validate(updateEmployeeSchema), asyncHandler(employeeController.update));
router.delete('/:id', protect, adminOnly, asyncHandler(employeeController.delete));

export default router;
