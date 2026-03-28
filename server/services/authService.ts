import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { HTTP_STATUS, AUTH } from '../utils/constants';

export class AuthService {
  private generateAccessToken(id: string, role: string): string {
    return jwt.sign({ id, role }, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY as unknown as number });
  }

  private generateRefreshToken(id: string): string {
    return jwt.sign({ id }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY as unknown as number });
  }

  private sanitizeUser(user: any) {
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      onlineStatus: user.onlineStatus,
    };
  }

  async register(data: any) {
    const userExists = await userRepository.findByEmail(data.email);
    if (userExists) {
      throw new AppError('An account with this email already exists', HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);
    const role = data.email === 'admin@splendidinfo.com' ? 'admin' : 'employee';

    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      role,
      name: data.name || data.email.split('@')[0],
    });

    const accessToken = this.generateAccessToken(user._id.toString(), user.role);
    const refreshToken = this.generateRefreshToken(user._id.toString());
    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await userRepository.pushRefreshToken(user._id.toString(), hashedRefresh);

    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async login(data: any) {
    const user = await userRepository.findByEmailWithAuthFields(data.email);
    const INVALID_MSG = 'Invalid email or password';

    if (!user) {
      throw new AppError(INVALID_MSG, HTTP_STATUS.UNAUTHORIZED);
    }

    if (user.isAccountLocked()) {
      const unlockIn = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
      throw new AppError(`Account temporarily locked. Try again in ${unlockIn} minute(s).`, HTTP_STATUS.LOCKED, 'ACCOUNT_LOCKED');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      await user.registerFailedLogin();
      const remaining = AUTH.MAX_FAILED_ATTEMPTS - (user.failedLoginAttempts || 0);
      const msg = remaining > 0
        ? `${INVALID_MSG}. ${remaining} attempt(s) remaining before lockout.`
        : `${INVALID_MSG}. Account is now locked for 15 minutes.`;
      throw new AppError(msg, HTTP_STATUS.UNAUTHORIZED);
    }

    await user.resetLoginAttempts();
    await userRepository.updateById(user._id.toString(), { onlineStatus: 'online', lastSeen: new Date() });

    const accessToken = this.generateAccessToken(user._id.toString(), user.role);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const existingTokens = user.refreshTokens || [];
    const updatedTokens = [...existingTokens.slice(-4), hashedRefresh]; // keep last 5 sessions max
    
    await userRepository.updateRefreshTokens(user._id.toString(), updatedTokens);

    return {
      user: this.sanitizeUser({ ...user.toObject(), onlineStatus: 'online' }),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(cookieToken: string) {
    try {
      const decoded = jwt.verify(cookieToken, env.JWT_REFRESH_SECRET) as { id: string };
      const hashedToken = crypto.createHash('sha256').update(cookieToken).digest('hex');

      const user = await userRepository.findByIdWithRefreshTokens(decoded.id);
      
      if (!user || !(user.refreshTokens || []).includes(hashedToken)) {
        if (user) {
          await userRepository.updateRefreshTokens(user._id.toString(), []); // token reuse block
        }
        throw new AppError('Refresh token invalid or reused', HTTP_STATUS.UNAUTHORIZED, 'REFRESH_INVALID');
      }

      const newAccessToken = this.generateAccessToken(user._id.toString(), user.role);
      const newRefreshToken = this.generateRefreshToken(user._id.toString());
      const newHashed = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

      const updatedTokens = (user.refreshTokens || [])
        .filter((t: string) => t !== hashedToken)
        .concat(newHashed);
      await userRepository.updateRefreshTokens(user._id.toString(), updatedTokens);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Refresh token expired, please log in again', HTTP_STATUS.UNAUTHORIZED, 'REFRESH_EXPIRED');
    }
  }

  async logout(userId: string, cookieToken?: string) {
    if (cookieToken) {
      const hashedToken = crypto.createHash('sha256').update(cookieToken).digest('hex');
      await userRepository.removeRefreshTokenAndSetStatusOffline(userId, hashedToken);
    } else {
      await userRepository.updateById(userId, { onlineStatus: 'offline', lastSeen: new Date() });
    }
  }

  async updateStatus(userId: string, status: string) {
    const user = await userRepository.updateById(userId, { onlineStatus: status, lastSeen: new Date() });
    if (!user) throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    return this.sanitizeUser(user);
  }

  async getAllUsers() {
    const users = await userRepository.findAllUsers();
    return users.map(u => this.sanitizeUser(u));
  }
}

export const authService = new AuthService();
