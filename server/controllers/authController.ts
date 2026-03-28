import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { HTTP_STATUS, AUTH } from '../utils/constants';
import { AuthRequest } from '../middleware/auth';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: AUTH.REFRESH_COOKIE_MAX_AGE_MS,
  });
};

export class AuthController {
  async register(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(HTTP_STATUS.CREATED).json({ ...user, token: accessToken });
  }

  async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken);
    res.json({ ...user, token: accessToken });
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: 'No refresh token', code: 'NO_REFRESH_TOKEN' });
      return;
    }

    try {
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(token);
      setRefreshCookie(res, newRefreshToken);
      res.json({ token: accessToken });
    } catch (err: any) {
      res.clearCookie('refreshToken');
      res.status(err.statusCode || HTTP_STATUS.UNAUTHORIZED).json({ message: err.message, code: err.code });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    await authService.logout(req.user!.id, req.cookies?.refreshToken);
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const user = await authService.updateStatus(req.user!.id, req.body.onlineStatus);
    res.json(user);
  }

  async getAllUsers(req: AuthRequest, res: Response) {
    const users = await authService.getAllUsers();
    res.json(users);
  }
}

export const authController = new AuthController();
