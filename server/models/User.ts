import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false }, // excluded from queries by default
    role: { type: String, enum: ['admin', 'employee', 'viewer'], default: 'employee' },
    name: { type: String, default: '', trim: true },
    onlineStatus: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline',
    },
    lastSeen: { type: Date, default: Date.now },

    // ── Account Lockout (brute-force protection) ──
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // ── Refresh Token Rotation ──
    refreshTokens: { type: [String], default: [], select: false },
  },
  { timestamps: true }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

userSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.registerFailedLogin = async function (): Promise<void> {
  this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  role: 'admin' | 'employee' | 'viewer';
  name: string;
  onlineStatus: string;
  lastSeen: Date;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  refreshTokens: string[];
  isAccountLocked(): boolean;
  registerFailedLogin(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  comparePassword(candidate: string): Promise<boolean>;
}

export default mongoose.model<IUser>('User', userSchema);
