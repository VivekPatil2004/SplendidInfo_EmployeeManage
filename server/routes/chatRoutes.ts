import express from 'express';
import { protect } from '../middleware/auth';
import { validate, sendMessageSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { chatController } from '../controllers/chatController';

const router = express.Router();

// Specific routes MUST come before param routes
router.get('/unread/counts', protect, asyncHandler(chatController.getUnreadCounts));
router.get('/users', protect, asyncHandler(chatController.getUsers));
router.post('/', protect, validate(sendMessageSchema), asyncHandler(chatController.sendMessage));

// Param routes
router.get('/:userId', protect, asyncHandler(chatController.getConversation));

export default router;
