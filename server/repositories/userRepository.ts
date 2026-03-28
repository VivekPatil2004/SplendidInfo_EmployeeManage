import User, { IUser } from '../models/User';

export class UserRepository {
  async findByEmailWithAuthFields(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil +refreshTokens');
  }

  async findByIdWithRefreshTokens(id: string): Promise<IUser | null> {
    return User.findById(id).select('+refreshTokens +lockUntil');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async pushRefreshToken(id: string, tokenHash: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $push: { refreshTokens: tokenHash } });
  }

  async updateRefreshTokens(id: string, tokens: string[]): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshTokens: tokens });
  }

  async removeRefreshTokenAndSetStatusOffline(id: string, tokenHash: string): Promise<void> {
    await User.findByIdAndUpdate(id, {
      $pull: { refreshTokens: tokenHash },
      onlineStatus: 'offline',
      lastSeen: new Date(),
    });
  }

  async findAllUsers(): Promise<IUser[]> {
    return User.find({});
  }

  async findAllExcluding(id: string): Promise<IUser[]> {
    return User.find({ _id: { $ne: id } });
  }
}

export const userRepository = new UserRepository();
