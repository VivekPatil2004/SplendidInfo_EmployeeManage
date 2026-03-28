import { Response } from 'express';
import { chatService } from '../services/chatService';
import { HTTP_STATUS } from '../utils/constants';
import { AuthRequest } from '../middleware/auth';

export class ChatController {
  async getUnreadCounts(req: AuthRequest, res: Response) {
    const counts = await chatService.getUnreadCounts(req.user!.id);
    res.json(counts);
  }

  async getUsers(req: AuthRequest, res: Response) {
    const users = await chatService.getChatUsers(req.user!.id);
    res.json(users);
  }

  async sendMessage(req: AuthRequest, res: Response) {
    const message = await chatService.sendMessage(req.user!.id, req.body.receiverId, req.body.content);
    res.status(HTTP_STATUS.CREATED).json(message);
  }

  async getConversation(req: AuthRequest, res: Response) {
    const messages = await chatService.getConversation(req.user!.id, String(req.params.userId));
    res.json(messages);
  }
}

export const chatController = new ChatController();
