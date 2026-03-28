import mongoose from 'mongoose';
import Message from '../models/Message';

export class ChatRepository {
  async getUnreadMessageCounts(receiverId: string) {
    const receiverObjId = new mongoose.Types.ObjectId(receiverId);
    return Message.aggregate([
      { $match: { receiverId: receiverObjId, isRead: false } },
      { $group: { _id: '$senderId', count: { $sum: 1 } } },
    ]);
  }

  async createMessage(senderId: string, receiverId: string, content: string) {
    return Message.create({ senderId, receiverId, content });
  }

  async getConversation(user1: string, user2: string) {
    return Message.find({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    }).sort({ createdAt: 1 });
  }

  async markMessagesAsRead(senderId: string, receiverId: string) {
    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
  }
}

export const chatRepository = new ChatRepository();
