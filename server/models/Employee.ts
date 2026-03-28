import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  department: { type: String, required: true },
  role: { type: String },
  salary: { type: Number, required: true },
  joiningDate: { type: String },
  performanceRating: { type: Number, default: 4.0 },
  isActive: { type: Boolean, default: true },
  skills: [{ type: String }],
  address: {
    city: { type: String },
    country: { type: String }
  }
}, { timestamps: true });

export default mongoose.model('Employee', employeeSchema);
