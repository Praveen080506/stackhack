import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobboard';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err;
  }
}
