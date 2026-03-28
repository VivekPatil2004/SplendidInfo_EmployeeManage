import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { attendanceController } from '../controllers/attendanceController';

const router = express.Router();

router.post('/login', protect, asyncHandler(attendanceController.login));
router.post('/logout', protect, asyncHandler(attendanceController.logout));
router.get('/me', protect, asyncHandler(attendanceController.getMyAttendance));
router.get('/today', protect, adminOnly, asyncHandler(attendanceController.getTodayOverall));
router.get('/all', protect, adminOnly, asyncHandler(attendanceController.getAllAttendance));

export default router;
