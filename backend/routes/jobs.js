import express from 'express';
import Job from '../models/Job.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public: list jobs (optionally filter by status)
router.get('/', async (req, res) => {
  const { status, featured } = req.query;
  const query = {};
  if (status) query.status = status;
  if (featured === 'true') query.is_featured = true;
  const jobs = await Job.find(query).sort({ createdAt: -1 }).lean();

  const now = new Date();
  const updates = [];
  const withAutoClose = jobs.map(j => {
    if (j && j.deadline_at && j.status !== 'closed') {
      const d = new Date(j.deadline_at);
      if (!isNaN(d) && d < now) {
        updates.push({ updateOne: { filter: { _id: j._id }, update: { $set: { status: 'closed' } } } });
        return { ...j, status: 'closed' };
      }
    }
    return j;
  });
  if (updates.length) {
    try { await Job.bulkWrite(updates, { ordered: false }); } catch (_) {}
  }
  res.json(withAutoClose);
});

// Public: featured list shortcut
router.get('/featured', async (req, res) => {
  const jobs = await Job.find({ status: 'active', is_featured: true })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();
  res.json(jobs);
});

// Public: get job by id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return res.status(404).json({ error: 'Not found' });
    let out = job;
    if (job.deadline_at && job.status !== 'closed') {
      const d = new Date(job.deadline_at);
      if (!isNaN(d) && d < new Date()) {
        out = { ...job, status: 'closed' };
        try { await Job.updateOne({ _id: job._id }, { $set: { status: 'closed' } }); } catch (_) {}
      }
    }
    res.json(out);
  } catch (err) {
    res.status(400).json({ error: 'Invalid id' });
  }
});

// Admin: create job
router.post('/', authRequired, adminOnly, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create job' });
  }
});

// Admin: update job
router.put('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update job' });
  }
});

// Admin: toggle/status
router.patch('/:id/status', authRequired, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true }).lean();
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update status' });
  }
});

// Admin: delete
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const r = await Job.deleteOne({ _id: req.params.id });
    if (r.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete job' });
  }
});

export default router;
