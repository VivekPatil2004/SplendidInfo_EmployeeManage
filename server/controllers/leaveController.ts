import { Response } from 'express';
import { leaveService } from '../services/leaveService';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middleware/auth';

export class LeaveController {
  async requestLeave(req: AuthRequest, res: Response) {
    const leave = await leaveService.requestLeave(req.user!.id, req.body);
    res.status(HTTP_STATUS.CREATED).json(leave);
  }

  async getMyLeaves(req: AuthRequest, res: Response) {
    const leaves = await leaveService.getMyLeaves(req.user!.id);
    res.json(leaves);
  }

  async getAllLeaves(req: AuthRequest, res: Response) {
    const leaves = await leaveService.getAllLeaves();
    res.json(leaves);
  }

  async reviewLeave(req: AuthRequest, res: Response) {
    const leave = await leaveService.reviewLeave(String(req.params.id), req.user!.id, req.body.status, req.body.adminComment);
    res.json(leave);
  }

  async cancelLeave(req: AuthRequest, res: Response) {
    await leaveService.cancelLeave(req.user!.id, String(req.params.id));
    res.json({ message: 'Leave request cancelled' });
  }
}

export const leaveController = new LeaveController();
