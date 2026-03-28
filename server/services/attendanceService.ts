import { attendanceRepository } from '../repositories/attendanceRepository';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Helper: get today's date string in IST (UTC+5:30)
const todayStr = (): string => {
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60 * 1000);
  return ist.toISOString().split('T')[0];
};

const isValidDateStr = (d: string): boolean => {
  if (!DATE_REGEX.test(d)) return false;
  const dt = new Date(d);
  return !isNaN(dt.getTime());
};

export class AttendanceService {
  async recordLogin(userId: string) {
    const date = todayStr();
    const existing = await attendanceRepository.findByUserAndDate(userId, date);
    if (existing) return existing;
    return attendanceRepository.create({ userId, date, loginTime: new Date(), status: 'present' });
  }

  async recordLogout(userId: string) {
    const date = todayStr();
    const log = await attendanceRepository.findByUserAndDate(userId, date);
    if (!log) throw new AppError('No login record found for today', HTTP_STATUS.NOT_FOUND);
    
    const logoutTime = new Date();
    const totalHours = log.loginTime
      ? parseFloat(((logoutTime.getTime() - (log.loginTime as Date).getTime()) / 3600000).toFixed(2))
      : 0;
      
    return attendanceRepository.updateById(log._id.toString(), { logoutTime, totalHours });
  }

  async getMyAttendance(userId: string) {
    return attendanceRepository.findByUser(userId);
  }

  async getTodayOverall() {
    const date = todayStr();
    const logs = await attendanceRepository.findByDate(date);
    const allUsers = await userRepository.findAllUsers();

    return allUsers.map((u) => {
      const log = logs.find((l: any) => l.userId?._id?.toString() === u._id.toString());
      return {
        user: u,
        attendance: log || null,
        status: log ? log.status : 'absent',
      };
    });
  }

  async getAllAttendance(date?: string) {
    if (date !== undefined) {
      if (typeof date !== 'string' || !isValidDateStr(date)) {
        throw new AppError('Invalid date format. Use YYYY-MM-DD.', HTTP_STATUS.BAD_REQUEST);
      }
    }
    const filter: Record<string, string> = {};
    if (date) filter.date = date as string;

    return attendanceRepository.findAll(filter);
  }
}

export const attendanceService = new AttendanceService();
