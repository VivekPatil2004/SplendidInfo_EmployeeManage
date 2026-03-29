import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { z } from 'zod';

/**
 * Middleware factory: validates req.body against a Zod schema.
 * On failure returns 400 with structured validation errors.
 */
export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: err.issues.map((issue) => ({
            field: issue.path.map(String).join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      next(err);
    }
  };

// --- Reusable field validators ---
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const emailField = z.string().email('Invalid email address').toLowerCase().trim();

// --- Auth Schemas ---
export const registerSchema = z.object({
  email: emailField,
  password: strongPassword,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required').max(128),
});

export const statusSchema = z.object({
  onlineStatus: z.enum(['online', 'away', 'busy', 'offline']),
});

// --- Employee Schemas ---
export const createEmployeeSchema = z.object({
  id: z.number().int().positive(),
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  email: emailField,
  phone: z.string().max(20).trim().optional(),
  department: z.string().min(1).max(100).trim(),
  role: z.string().max(100).trim().optional(),
  salary: z.number().nonnegative().finite(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  performanceRating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
  skills: z.array(z.string().trim().max(50)).max(20).optional(),
  address: z
    .object({
      city: z.string().max(100).trim().optional(),
      country: z.string().max(100).trim().optional(),
    })
    .optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ id: true });

// --- Meeting Schemas ---
const meetingBase = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  // Accept both datetime-local format ("2026-03-29T08:19") and full ISO strings
  startTime: z.string().min(1, 'Start time is required').refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'startTime must be a valid date' }
  ),
  endTime: z.string().min(1, 'End time is required').refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'endTime must be a valid date' }
  ),
  location: z.string().max(200).trim().optional(),
  meetingLink: z.string().url('meetingLink must be a valid URL').optional().or(z.literal('')).optional(),
  participants: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid participant ID'))
    .max(100)
    .optional(),
});

export const createMeetingSchema = meetingBase.refine(
  (d) => new Date(d.endTime) > new Date(d.startTime),
  {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  }
);

export const updateMeetingSchema = meetingBase.partial().refine(
  (d) => {
    if (d.startTime && d.endTime) {
      return new Date(d.endTime) > new Date(d.startTime);
    }
    return true;
  },
  {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  }
);

// --- Chat Schema ---
export const sendMessageSchema = z.object({
  receiverId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid receiver ID'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long').trim(),
});

// --- Leave Schema ---
export const createLeaveSchema = z.object({
  type: z.enum(['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid', 'other']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
  reason: z.string().min(10, 'Please provide a reason (min 10 characters)').max(1000).trim(),
});

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminComment: z.string().max(500).trim().optional(),
});
