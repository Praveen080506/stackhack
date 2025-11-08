import express from 'express';
import { authRequired } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get my notifications
router.get('/me', authRequired, async (req, res) => {
  const items = await Notification.find({ user_id: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(items);
});

// Mark as read
router.patch('/:id/read', authRequired, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { is_read: true },
      { new: true }
    ).lean();
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update notification' });
  }
});

export default router;
