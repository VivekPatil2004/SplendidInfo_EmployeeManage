import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Strongly-typed JWT payload — no more `as any` casts */
export interface AuthPayload {
  id: string;
  role: 'admin' | 'employee';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

// ─── Access Token Middleware ──────────────────────────────────────────────────

/**
 * `protect` — verifies the Bearer JWT from Authorization header.
 * Attaches the strongly-typed `AuthPayload` to `req.user`.
 */
export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired, please log in again', code: 'TOKEN_EXPIRED' });
    } else {
      res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }
};

// ─── Role-Based Authorization ─────────────────────────────────────────────────

/**
 * `requireRole(...roles)` — flexible RBAC middleware.
 * Usage: router.get('/admin', protect, requireRole('admin'), handler)
 * Usage: router.get('/multi', protect, requireRole('admin', 'manager'), handler)
 */
export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: requires one of [${roles.join(', ')}] role`,
      });
      return;
    }
    next();
  };

/** Convenience alias for admin-only routes */
export const adminOnly = requireRole('admin');

// ─── Socket.IO JWT Verification ──────────────────────────────────────────────

/**
 * Verifies a JWT token string (extracted from socket handshake).
 * Returns the decoded payload or throws if invalid/expired.
 */
export const verifySocketToken = (token: string): AuthPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
};
