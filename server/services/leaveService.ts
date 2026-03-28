import { leaveRepository } from '../repositories/leaveRepository';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import mongoose from 'mongoose';

export class LeaveService {
  async requestLeave(userId: string, data: any) {
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new AppError('endDate must be on or after startDate', HTTP_STATUS.BAD_REQUEST);
    }
    return leaveRepository.create({ ...data, userId });
  }

  async getMyLeaves(userId: string) {
    return leaveRepository.findByUser(userId);
  }

  async getAllLeaves() {
    return leaveRepository.findAll();
  }

  async reviewLeave(leaveId: string, adminId: string, status: string, adminComment?: string) {
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      throw new AppError('Invalid leave request ID', HTTP_STATUS.BAD_REQUEST);
    }

    const leave = await leaveRepository.updateById(leaveId, {
      status, 
      adminComment, 
      reviewedBy: adminId, 
      reviewedAt: new Date()
    });

    if (!leave) throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);

    if (status === 'approved') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const uId = (leave.userId as any)._id.toString();

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await attendanceRepository.upsertLeaveStatus(uId, dateStr, 'leave');
      }
    }

    return leave;
  }

  async cancelLeave(userId: string, leaveId: string) {
    if (!mongoose.Types.ObjectId.isValid(leaveId)) {
      throw new AppError('Invalid leave request ID', HTTP_STATUS.BAD_REQUEST);
    }

    const leave = await leaveRepository.findById(leaveId);
    if (!leave) throw new AppError('Leave not found', HTTP_STATUS.NOT_FOUND);

    if (leave.userId.toString() !== userId) {
      throw new AppError('Not authorized to cancel this leave request', HTTP_STATUS.FORBIDDEN);
    }
    if (leave.status !== 'pending') {
      throw new AppError('Cannot cancel a leave request that has been reviewed', HTTP_STATUS.BAD_REQUEST);
    }

    await leaveRepository.deleteById(leaveId);
  }
}

export const leaveService = new LeaveService();
