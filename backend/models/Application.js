import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    job_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    full_name: { type: String },
    email: { type: String },
    phone: { type: String },
    resume_url: { type: String },
    cover_letter: { type: String },
    experience_years: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

export default mongoose.model('Application', applicationSchema);
