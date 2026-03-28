import Meeting from '../models/Meeting';

export class MeetingRepository {
  async findInvolvingUser(userId: string) {
    return Meeting.find({
      $or: [{ organizer: userId }, { participants: userId }],
    })
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .sort({ startTime: 1 });
  }

  async findAll() {
    return Meeting.find({})
      .populate('organizer', 'name email')
      .populate('participants', 'name email')
      .sort({ startTime: 1 });
  }

  async create(data: Record<string, any>) {
    const meeting = await Meeting.create(data);
    return meeting.populate([
      { path: 'organizer', select: 'name email' },
      { path: 'participants', select: 'name email' },
    ]);
  }

  async findById(id: string) {
    return Meeting.findById(id);
  }

  async updateById(id: string, data: Record<string, any>) {
    return Meeting.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('organizer', 'name email')
      .populate('participants', 'name email');
  }

  async deleteById(id: string) {
    return Meeting.findByIdAndDelete(id);
  }
}

export const meetingRepository = new MeetingRepository();
