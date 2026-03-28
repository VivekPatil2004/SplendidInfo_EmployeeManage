import { chatRepository } from '../repositories/chatRepository';
import { userRepository } from '../repositories/userRepository';
import { AppError } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';

export class ChatService {
  async getUnreadCounts(receiverId: string) {
    return chatRepository.getUnreadMessageCounts(receiverId);
  }

  async getChatUsers(currentUserId: string) {
    return userRepository.findAllExcluding(currentUserId);
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const receiverExists = await userRepository.findById(receiverId);
    if (!receiverExists) {
      throw new AppError('Recipient not found', HTTP_STATUS.NOT_FOUND);
    }
    return chatRepository.createMessage(senderId, receiverId, content);
  }

  async getConversation(me: string, other: string) {
    const messages = await chatRepository.getConversation(me, other);
    // Mark received messages as read
    await chatRepository.markMessagesAsRead(other, me);
    return messages;
  }
}

export const chatService = new ChatService();
