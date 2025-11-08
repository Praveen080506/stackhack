import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Ensure fetch is available for Node < 18
try {
  const nodeFetch = await import('node-fetch').then(m => m.default).catch(() => null);
  if (!globalThis.fetch && nodeFetch) globalThis.fetch = nodeFetch;
} catch {}

// Import routes
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

/* ---------------------- 🛡️ CORS CONFIGURATION ---------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'https://jobportal-frontend-opzq.onrender.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow server-to-server or tools
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Handle preflight requests globally
app.options('*', cors());

/* ---------------------- ⚙️ MIDDLEWARES ---------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Fix for Cross-Origin-Opener-Policy blocking postMessage in browser
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------- 🚏 ROUTES ---------------------- */
app.use('/auth', authRoutes);
app.use('/profiles', profileRoutes);
app.use('/jobs', jobRoutes);
app.use('/applications', applicationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/uploads', uploadRoutes);
app.use('/messages', messageRoutes);
app.use('/contact', contactRoutes);

/* ---------------------- 🤖 AI: ATS SCORE ROUTE ---------------------- */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL_NAME || 'openrouter/auto';

function buildCompletionsUrl(base) {
  return base.endsWith('/v') ? `${base}1/chat/completions` : `${base}/chat/completions`;
}

// ✅ Public route (no authRequired)
app.post('/ai/ats-score', async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not set on server' });
    }

    const { resumeText, jobs } = req.body || {};
    if (!resumeText || !Array.isArray(jobs) || !jobs.length) {
      return res.status(400).json({ error: 'resumeText and jobs[] are required' });
    }

    const url = buildCompletionsUrl(OPENROUTER_BASE_URL);
    const prompt = `You are an ATS scoring assistant. Given a resume and a list of job postings, do the following:
- Provide an overall ATS score (0-100) for the resume.
- For each job, provide a score (0-100) and a brief reason.
- Suggest up to 5 best-fit jobs by id.
Return STRICT JSON only in this schema (no extra commentary):
{
  "overallScore": number,
  "jobScores": [{"jobId": string, "score": number, "reason": string}],
  "topJobs": [string]
}

Resume:
"""
${(resumeText || '').slice(0, 20000)}
"""

Jobs (JSON array of {id,title,company,description}):
${JSON.stringify(
  jobs.map(j => ({
    id: j._id || j.id,
    title: j.title,
    company: j.company,
    description: j.description,
  }))
).slice(0, 20000)}
`;

    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Return JSON only. Do not include prose. Keep scores between 0 and 100.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://jobportal-frontend-opzq.onrender.com',
        'X-Title': 'JobBoard ATS',
      },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!resp.ok) {
      console.error('❌ OpenRouter API Error:', text);
      return res.status(resp.status).json({
        error: (data && (data.error || data.message)) || text || 'OpenRouter error',
        status: resp.status,
      });
    }

    const content = data?.choices?.[0]?.message?.content || '';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {}
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('⚠️ AI response parse failed:', content);
      return res.status(502).json({ error: 'Failed to parse AI response', raw: content });
    }

    return res.json(parsed);
  } catch (err) {
    console.error('ATS score error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/* ---------------------- ❤️ HEALTH CHECK ---------------------- */
app.get('/health', (req, res) => res.json({ ok: true }));

/* ---------------------- 🚀 START SERVER ---------------------- */
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ API running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to connect DB', err);
    process.exit(1);
  });
