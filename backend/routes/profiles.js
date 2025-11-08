import express from 'express';
import { authRequired } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get my profile
router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: user._id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    phone: user.phone,
    address: user.address,
    bio: user.bio,
    avatar_url: user.avatar_url,
    resume_url: user.resume_url,
  });
});

// Update my profile
router.put('/me', authRequired, async (req, res) => {
  const updates = (({ full_name, phone, address, bio, avatar_url, resume_url }) => ({ full_name, phone, address, bio, avatar_url, resume_url }))(req.body);
  try {
    await User.updateOne({ _id: req.user.id }, { $set: updates });
    const updated = await User.findById(req.user.id).lean();
    res.json({
      id: updated._id,
      email: updated.email,
      role: updated.role,
      full_name: updated.full_name,
      phone: updated.phone,
      address: updated.address,
      bio: updated.bio,
      avatar_url: updated.avatar_url,
      resume_url: updated.resume_url,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
