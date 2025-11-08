import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

// Load env variables early
dotenv.config();

// Check OpenRouter key
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ Missing OPENROUTER_API_KEY in environment variables!');
} else {
  console.log('✅ OPENROUTER_API_KEY detected.');
}

// Polyfill fetch for Node <18
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

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------------- 🛡️ CORS CONFIG ---------------------- */
const allowedOrigins = [
  'http://localhost:5173',
  'https://jobportal-frontend-opzq.onrender.com',
  'https://job-portal-sryt.onrender.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow tools or server-side calls
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`🚫 Blocked CORS request from: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.options('*', cors());

/* ---------------------- ⚙️ MIDDLEWARES ---------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Fix for COOP blocking postMessage
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Serve uploads
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

/* ---------------------- 🤖 AI: ATS SCORE ---------------------- */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || process.env.OPENROUTER_MODEL_NAME || 'openrouter/auto';

function buildCompletionsUrl(base) {
  return base.endsWith('/v') ? `${base}1/chat/completions` : `${base}/chat/completions`;
}

app.post('/ai/ats-score', async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY missing on server');
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server' });
    }

    const { resumeText, jobs } = req.body || {};
    if (!resumeText || !Array.isArray(jobs) || !jobs.length) {
      return res.status(400).json({ error: 'resumeText and jobs[] are required' });
    }

    const url = buildCompletionsUrl(OPENROUTER_BASE_URL);
    const prompt = `You are an ATS scoring assistant. Given a resume and job postings:
Return STRICT JSON:
{
  "overallScore": number,
  "jobScores": [{"jobId": string, "score": number, "reason": string}],
  "topJobs": [string]
}

Resume:
${(resumeText || '').slice(0, 15000)}

Jobs:
${JSON.stringify(jobs.map(j => ({
  id: j._id || j.id,
  title: j.title,
  company: j.company,
  description: j.description,
}))).slice(0, 15000)}
`;

    const body = {
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: 'Return only valid JSON, no explanations.' },
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

    if (resp.status === 401) {
      console.error('❌ Unauthorized: Invalid or inactive OpenRouter API key.');
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing OpenRouter API key.',
        hint: 'Double-check OPENROUTER_API_KEY in Render dashboard.',
      });
    }

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
        error: data?.error || text || 'OpenRouter API error',
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
      console.error('⚠️ Could not parse AI response:', content);
      return res.status(502).json({ error: 'Invalid AI response', raw: content });
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
