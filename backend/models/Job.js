import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    job_type: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship'], default: 'full-time' },
    salary_range: { type: String },
    description: { type: String },
    requirements: { type: String },
    responsibilities: { type: String },
    benefits: { type: String },
    is_featured: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    deadline_at: { type: Date },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Job', jobSchema);
