import express from 'express';
import { authRequired } from '../middleware/auth.js';
import ContactMessage from '../models/ContactMessage.js';

const router = express.Router();

// Submit a contact message (authenticated users)
router.post('/', authRequired, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'name, email, subject and message are required' });
    }

    const doc = await ContactMessage.create({
      user_id: req.user?.id || null,
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('Contact submit error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
