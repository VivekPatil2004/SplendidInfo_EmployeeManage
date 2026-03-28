import AttendanceLog from '../models/AttendanceLog';

export class AttendanceRepository {
  async findByUserAndDate(userId: string, date: string) {
    return AttendanceLog.findOne({ userId, date });
  }

  async create(data: Record<string, any>) {
    return AttendanceLog.create(data);
  }

  async updateById(id: string, data: Record<string, any>) {
    return AttendanceLog.findByIdAndUpdate(id, data, { new: true });
  }

  async findByUser(userId: string) {
    return AttendanceLog.find({ userId }).sort({ date: -1 });
  }

  async findByDate(date: string) {
    return AttendanceLog.find({ date }).populate('userId', 'name email onlineStatus role');
  }

  async findAll(filter: Record<string, any>) {
    return AttendanceLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ date: -1, createdAt: -1 });
  }

  async upsertLeaveStatus(userId: string, dateStr: string, status: string) {
    return AttendanceLog.findOneAndUpdate(
      { userId, date: dateStr },
      { userId, date: dateStr, status },
      { upsert: true, new: true }
    );
  }
}

export const attendanceRepository = new AttendanceRepository();
