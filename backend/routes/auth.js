import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

function signToken(user) {
  const payload = { id: user._id, role: user.role };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'user', admin_code } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (role === 'admin') {
      if (!admin_code || String(admin_code) !== '1122') {
        return res.status(403).json({ error: 'Enter correct admin code' });
      }
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, full_name, role });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google Sign-In
router.post('/google', async (req, res) => {
  try {
    const { id_token, role, admin_code } = req.body || {};
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!id_token || !clientId) return res.status(400).json({ error: 'Missing id_token or client configuration' });

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(401).json({ error: 'Invalid Google token' });

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const full_name = payload.name || '';
    const avatar_url = payload.picture || '';

    let user = await User.findOne({ email });
    const wantsAdmin = String(role) === 'admin' && String(admin_code) === '1122';
    if (!user) {
      user = await User.create({ email, role: wantsAdmin ? 'admin' : 'user', full_name, avatar_url, googleId });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.avatar_url && avatar_url) user.avatar_url = avatar_url;
      if (!user.full_name && full_name) user.full_name = full_name;
      if (wantsAdmin && user.role !== 'admin') user.role = 'admin';
      await user.save();
    }

    const token = signToken(user);
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err) {
    return res.status(500).json({ error: 'Google auth failed' });
  }
});

// Me
router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ id: user._id, email: user.email, role: user.role, full_name: user.full_name, avatar_url: user.avatar_url, resume_url: user.resume_url, phone: user.phone, address: user.address, bio: user.bio });
});

export default router;
