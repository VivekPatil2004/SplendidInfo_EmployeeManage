import { meetingRepository } from '../repositories/meetingRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import mongoose from 'mongoose';

export class MeetingService {
  async getMyMeetings(userId: string) {
    return meetingRepository.findInvolvingUser(userId);
  }

  async getAllMeetings() {
    return meetingRepository.findAll();
  }

  async createMeeting(organizerId: string, data: any) {
    return meetingRepository.create({ ...data, organizer: organizerId });
  }

  async updateMeeting(userId: string, userRole: string, meetingId: string, data: any) {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      throw new AppError('Invalid meeting ID', HTTP_STATUS.BAD_REQUEST);
    }

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) throw new AppError('Meeting not found', HTTP_STATUS.NOT_FOUND);

    if (meeting.organizer.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to edit this meeting', HTTP_STATUS.FORBIDDEN);
    }

    return meetingRepository.updateById(meetingId, data);
  }

  async deleteMeeting(userId: string, userRole: string, meetingId: string) {
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
      throw new AppError('Invalid meeting ID', HTTP_STATUS.BAD_REQUEST);
    }

    const meeting = await meetingRepository.findById(meetingId);
    if (!meeting) throw new AppError('Meeting not found', HTTP_STATUS.NOT_FOUND);

    if (meeting.organizer.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized', HTTP_STATUS.FORBIDDEN);
    }

    await meetingRepository.deleteById(meetingId);
  }
}

export const meetingService = new MeetingService();
