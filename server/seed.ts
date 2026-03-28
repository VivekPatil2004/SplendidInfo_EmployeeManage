import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Employee from './models/Employee';
import { employees } from '../src/data/employees';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splendidinfo');
    
    // Clear the database and insert the original static array of employees
    await Employee.deleteMany(); 
    await Employee.insertMany(employees);
    
    console.log('Database Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
