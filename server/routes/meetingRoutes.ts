import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate, createMeetingSchema, updateMeetingSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { meetingController } from '../controllers/meetingController';

const router = express.Router();

router.get('/', protect, asyncHandler(meetingController.getMyMeetings));
router.get('/all', protect, adminOnly, asyncHandler(meetingController.getAllMeetings));
router.post('/', protect, validate(createMeetingSchema), asyncHandler(meetingController.create));
router.put('/:id', protect, validate(updateMeetingSchema), asyncHandler(meetingController.update));
router.delete('/:id', protect, asyncHandler(meetingController.delete));

export default router;
