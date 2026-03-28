import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate, createLeaveSchema, reviewLeaveSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { leaveController } from '../controllers/leaveController';

const router = express.Router();

router.post('/', protect, validate(createLeaveSchema), asyncHandler(leaveController.requestLeave));
router.get('/me', protect, asyncHandler(leaveController.getMyLeaves));
router.get('/all', protect, adminOnly, asyncHandler(leaveController.getAllLeaves));
router.put('/:id', protect, adminOnly, validate(reviewLeaveSchema), asyncHandler(leaveController.reviewLeave));
router.delete('/:id', protect, asyncHandler(leaveController.cancelLeave));

export default router;
