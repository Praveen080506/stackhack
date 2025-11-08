import express from 'express';
import Message from '../models/Message.js';
import { authRequired } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Create/send a message
router.post('/', authRequired, async (req, res) => {
  try {
    const { conversationId, participants, text, meta } = req.body || {};
    if (!conversationId || !Array.isArray(participants) || participants.length < 2 || !text) {
      return res.status(400).json({ error: 'conversationId, participants[>=2], and text are required' });
    }

    const doc = await Message.create({
      conversationId,
      participants: Array.from(new Set(participants)).sort(),
      sender: req.user?.email || req.user?.id || 'unknown',
      text,
      meta: meta || {},
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('Create message error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Conversations list for current user (by email)
router.get('/conversations/list', authRequired, async (req, res) => {
  try {
    const me = (req.user?.email || req.user?.id || '').toLowerCase();
    if (!me) return res.json({ conversations: [] });

    const agg = await Message.aggregate([
      { $match: { participants: me } },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$text' },
          lastAt: { $first: '$createdAt' },
          participants: { $first: '$participants' },
        }
      },
      { $project: {
          id: '$_id',
          lastMessage: 1,
          lastAt: 1,
          participants: 1,
        }
      },
      { $sort: { lastAt: -1 } }
    ]);

    // Map to UI shape with friendly name (full_name when available)
    const conversations = [];
    for (const c of (agg || [])) {
      const others = (c.participants || []).filter(p => String(p).toLowerCase() !== me);
      const otherIdentifier = (others[0] || 'unknown@example.com');
      let displayName = otherIdentifier;
      let otherRole = null;
      let avatar = null;
      try {
        // Prefer lookup by email; fallback to id
        let userDoc = await User.findOne({ email: otherIdentifier }).lean();
        if (!userDoc && otherIdentifier.match(/^[a-fA-F0-9]{24}$/)) {
          userDoc = await User.findById(otherIdentifier).lean();
        }
        if (userDoc?.full_name) displayName = userDoc.full_name;
        if (userDoc?.role) otherRole = userDoc.role;
        if (userDoc?.avatar_url) avatar = userDoc.avatar_url;
      } catch (_) {}

      conversations.push({
        id: c.id,
        name: displayName,
        lastMessage: c.lastMessage || '',
        participants: c.participants || [],
        otherRole,
        avatar: avatar,
        img: avatar ? avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      });
    }

    return res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// List messages in a conversation (ascending by time)
router.get('/:conversationId', authRequired, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 500);

    const items = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return res.json(items);
  } catch (err) {
    console.error('List messages error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Delete a conversation (all messages)
router.delete('/:conversationId', authRequired, async (req, res) => {
  try {
    const { conversationId } = req.params;
    await Message.deleteMany({ conversationId });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete conversation error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
