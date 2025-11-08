import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// User: create application
router.post('/', authRequired, async (req, res) => {
  try {
    const { job_id, full_name, email, phone, cover_letter, experience_years, resume_url } = req.body;
    // Basic checks
    const job = await Job.findById(job_id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const app = await Application.create({
      job_id,
      user_id: req.user.id,
      full_name,
      email,
      phone,
      cover_letter,
      experience_years: Number(experience_years) || 0,
      resume_url,
      status: 'pending',
    });

    res.status(201).json(app);
  } catch (err) {
    res.status(400).json({ error: 'Failed to submit application' });
  }
});

// User: my applications
router.get('/me', authRequired, async (req, res) => {
  const apps = await Application.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  // Attach minimal job info for UI
  const jobIds = [...new Set(apps.map(a => String(a.job_id)))];
  const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
  const jobMap = Object.fromEntries(jobs.map(j => [String(j._id), j]));
  const withJobs = apps.map(a => ({
    ...a,
    jobs: a.job_id ? {
      title: jobMap[String(a.job_id)]?.title,
      company: jobMap[String(a.job_id)]?.company,
      location: jobMap[String(a.job_id)]?.location,
    } : undefined,
  }));
  res.json(withJobs);
});

// Admin: list all applications with joined user + job info
router.get('/', authRequired, adminOnly, async (req, res) => {
  const apps = await Application.find({}).sort({ createdAt: -1 }).lean();
  const userIds = [...new Set(apps.map(a => String(a.user_id)))];
  const jobIds = [...new Set(apps.map(a => String(a.job_id)))];
  const [users, jobs] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    Job.find({ _id: { $in: jobIds } }).lean(),
  ]);
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));
  const jobMap = Object.fromEntries(jobs.map(j => [String(j._id), j]));
  const formatted = apps.map(a => ({
    ...a,
    profiles: userMap[String(a.user_id)] ? {
      full_name: userMap[String(a.user_id)].full_name,
      email: userMap[String(a.user_id)].email,
    } : undefined,
    jobs: jobMap[String(a.job_id)] ? {
      title: jobMap[String(a.job_id)].title,
      company: jobMap[String(a.job_id)].company,
    } : undefined,
  }));
  res.json(formatted);
});

// Admin: update status and create notification
router.patch('/:id/status', authRequired, adminOnly, async (req, res) => {
  const { status, message } = req.body;
  if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const appDoc = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!appDoc) return res.status(404).json({ error: 'Application not found' });

    const job = await Job.findById(appDoc.job_id).lean();
    await Notification.create({
      user_id: appDoc.user_id,
      application_id: appDoc._id,
      message: message || `Your application for "${job?.title || 'a job'}" has been updated to: ${status}`,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update status' });
  }
});

// Admin: download resume file for an application
router.get('/:id/resume', authRequired, adminOnly, async (req, res) => {
  try {
    const appDoc = await Application.findById(req.params.id).lean();
    if (!appDoc || !appDoc.resume_url) return res.status(404).json({ error: 'Resume not found' });

    const filename = path.basename(appDoc.resume_url);
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server' });

    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

export default router;
