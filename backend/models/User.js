import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    full_name: { type: String },
    phone: { type: String },
    address: { type: String },
    bio: { type: String },
    avatar_url: { type: String },
    resume_url: { type: String },
    googleId: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
