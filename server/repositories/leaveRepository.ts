import LeaveRequest from '../models/LeaveRequest';

export class LeaveRepository {
  async create(data: Record<string, any>) {
    return LeaveRequest.create(data);
  }

  async findByUser(userId: string) {
    return LeaveRequest.find({ userId }).sort({ createdAt: -1 });
  }

  async findAll() {
    return LeaveRequest.find({})
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return LeaveRequest.findById(id);
  }

  async updateById(id: string, data: Record<string, any>) {
    return LeaveRequest.findByIdAndUpdate(id, data, { new: true }).populate('userId', 'name email');
  }

  async deleteById(id: string) {
    return LeaveRequest.findByIdAndDelete(id);
  }
}

export const leaveRepository = new LeaveRepository();
