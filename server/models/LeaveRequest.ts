import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['sick', 'casual', 'annual', 'other'], required: true },
  startDate: { type: String, required: true }, // 'YYYY-MM-DD'
  endDate: { type: String, required: true },   // 'YYYY-MM-DD'
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminComment: { type: String },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
