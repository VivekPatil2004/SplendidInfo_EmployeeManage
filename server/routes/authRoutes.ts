import express from 'express';
import { protect, adminOnly } from '../middleware/auth';
import { validate, registerSchema, loginSchema, statusSchema } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { authController } from '../controllers/authController';

const router = express.Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refresh));
router.post('/logout', protect, asyncHandler(authController.logout));
router.patch('/status', protect, validate(statusSchema), asyncHandler(authController.updateStatus));
router.get('/users', protect, adminOnly, asyncHandler(authController.getAllUsers));

export default router;
