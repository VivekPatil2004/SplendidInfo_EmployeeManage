import { Types } from 'mongoose';

export interface BaseEntity {
  _id: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type Role = 'admin' | 'employee';
export type OnlineStatus = 'online' | 'away' | 'busy' | 'offline';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
