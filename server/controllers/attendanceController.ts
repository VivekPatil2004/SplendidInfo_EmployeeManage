import { Response } from 'express';
import { attendanceService } from '../services/attendanceService';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middleware/auth';

export class AttendanceController {
  async login(req: AuthRequest, res: Response) {
    const log = await attendanceService.recordLogin(req.user!.id);
    res.status(HTTP_STATUS.CREATED).json(log);
  }

  async logout(req: AuthRequest, res: Response) {
    const log = await attendanceService.recordLogout(req.user!.id);
    res.json(log);
  }

  async getMyAttendance(req: AuthRequest, res: Response) {
    const logs = await attendanceService.getMyAttendance(req.user!.id);
    res.json(logs);
  }

  async getTodayOverall(req: AuthRequest, res: Response) {
    const result = await attendanceService.getTodayOverall();
    res.json(result);
  }

  async getAllAttendance(req: AuthRequest, res: Response) {
    const date = req.query.date as string | undefined;
    const logs = await attendanceService.getAllAttendance(date);
    res.json(logs);
  }
}

export const attendanceController = new AttendanceController();
