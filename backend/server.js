import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Ensure fetch is available on Node versions that don't provide it (Node < 18)
// We import node-fetch as an ESM module and only assign it if global fetch is missing.
try {
  // dynamic import so install is optional during development
  const nodeFetch = await import('node-fetch').then(m => m.default).catch(() => null);
  if (!globalThis.fetch && nodeFetch) {
    globalThis.fetch = nodeFetch;
  }
} catch (e) {
  // if import fails, we'll rely on native fetch (if present) or throw later when used
}

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import notificationRoutes from './routes/notifications.js';
import uploadRoutes from './routes/uploads.js';
import messageRoutes from './routes/message.js';
import contactRoutes from './routes/contact.js';
import { authRequired } from './middleware/auth.js';

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/uploads', uploadRoutes);
app.use('/messages', messageRoutes);
app.use('/contact', contactRoutes);

// AI: ATS Scoring (proxy to OpenRouter)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
function buildCompletionsUrl(base) {
  // Supports .../api/v and .../api/v1 inputs
  if (base.endsWith('/v')) return `${base}1/chat/completions`;
  return `${base}/chat/completions`;
}
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL_NAME || 'openrouter/auto';
app.post('/ai/ats-score', authRequired, async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not set on server' });
    const { resumeText, jobs } = req.body || {};
    if (!resumeText || !Array.isArray(jobs) || !jobs.length) return res.status(400).json({ error: 'resumeText and jobs[] are required' });

    const url = buildCompletionsUrl(OPENROUTER_BASE_URL);
    const prompt = `You are an ATS scoring assistant. Given a resume and a list of job postings, do the following:\n- Provide an overall ATS score (0-100) for the resume.\n- For each job, provide a score (0-100) and a brief reason.\n- Suggest up to 5 best-fit jobs by id.\nReturn STRICT JSON only in the following schema (no extra commentary):\n{\n  \"overallScore\": number,\n  \"jobScores\": [{\"jobId\": string, \"score\": number, \"reason\": string}],\n  \"topJobs\": [string]\n}\n\nResume:\n\"\"\"\n${(resumeText || '').slice(0, 20000)}\n\"\"\"\n\nJobs (JSON array of {id,title,company,description}):\n${JSON.stringify(jobs.map(j => ({ id: j._id || j.id, title: j.title, company: j.company, description: j.description }))).slice(0, 20000)}\n`;

    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'Return JSON only. Do not include prose. Keep scores between 0 and 100.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        // Recommended by OpenRouter for attribution
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'JobBoard ATS',
      },
      body: JSON.stringify(body),
    });

    let data;
    const text = await resp.text();
    try { data = JSON.parse(text); } catch { data = null; }

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: (data && (data.error || data.message)) || text || 'OpenRouter error',
        status: resp.status,
      });
    }

    const content = data?.choices?.[0]?.message?.content || '';
    let parsed;
    try { parsed = JSON.parse(content); } catch {}
    if (!parsed) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) { try { parsed = JSON.parse(match[0]); } catch {} }
    }
    if (!parsed || typeof parsed !== 'object') return res.status(502).json({ error: 'Failed to parse AI response', raw: content });

    return res.json(parsed);
  } catch (err) {
    console.error('ATS score error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Start server after DB connects
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect DB', err);
    process.exit(1);
  });
