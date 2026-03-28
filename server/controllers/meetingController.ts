import { Response } from 'express';
import { meetingService } from '../services/meetingService';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middleware/auth';

export class MeetingController {
  async getMyMeetings(req: AuthRequest, res: Response) {
    const meetings = await meetingService.getMyMeetings(req.user!.id);
    res.json(meetings);
  }

  async getAllMeetings(req: AuthRequest, res: Response) {
    const meetings = await meetingService.getAllMeetings();
    res.json(meetings);
  }

  async create(req: AuthRequest, res: Response) {
    const meeting = await meetingService.createMeeting(req.user!.id, req.body);
    res.status(HTTP_STATUS.CREATED).json(meeting);
  }

  async update(req: AuthRequest, res: Response) {
    const meeting = await meetingService.updateMeeting(req.user!.id, req.user!.role, String(req.params.id), req.body);
    res.json(meeting);
  }

  async delete(req: AuthRequest, res: Response) {
    await meetingService.deleteMeeting(req.user!.id, req.user!.role, String(req.params.id));
    res.json({ message: 'Meeting deleted' });
  }
}

export const meetingController = new MeetingController();
