import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splendidinfo');
    
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      role: String,
      name: String,
      onlineStatus: String,
      lastSeen: Date,
    }));

    const newPassword = 'Admin@123';
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    const result = await User.findOneAndUpdate(
      { email: 'admin@splendidinfo.com' },
      { password: hashed, role: 'admin', name: 'Admin', onlineStatus: 'offline' },
      { new: true }
    );

    if (result) {
      console.log('✅ Admin password reset successfully!');
      console.log('   Email:    admin@splendidinfo.com');
      console.log('   Password: Admin@123');
    } else {
      console.log('❌ Admin user not found. Please register at http://localhost:5173/register first.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAdmin();
