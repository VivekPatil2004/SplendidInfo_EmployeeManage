import mongoose from 'mongoose';

const attendanceLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: 'YYYY-MM-DD'
  loginTime: { type: Date },
  logoutTime: { type: Date },
  totalHours: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'leave', 'holiday'], default: 'present' },
}, { timestamps: true });

// Compound index so each user has one record per day
attendanceLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('AttendanceLog', attendanceLogSchema);
