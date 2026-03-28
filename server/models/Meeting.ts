import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String, default: 'Online' },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  meetingLink: { type: String },
}, { timestamps: true });

export default mongoose.model('Meeting', meetingSchema);
