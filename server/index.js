import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { initializeDatabase, rollHash } from './db.js';
import { requireAuth, signToken } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'development-jwt-secret-change-before-deploy';
const ROLL_HASH_SECRET = process.env.ROLL_HASH_SECRET || 'development-roll-secret-change-before-deploy';
const CAPTAIN_CODE = process.env.CAPTAIN_CODE || 'BILTU-MILTU-2026';

initializeDatabase({ rollSecret: ROLL_HASH_SECRET });

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

const allowedCategories = ['Tiffin Theft', 'Bribes', 'Syllabus Bloat', 'Unfair Sports', 'Washroom Toll', 'Other'];
const allowedLocations = ['Library', 'Playground', 'Corridor', 'Classroom', 'Canteen', 'Washroom', 'School Gate'];
const loginAttempts = new Map();

function cleanText(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

function dashboardSummary() {
  const complaintTotal = db.prepare('SELECT COUNT(*) AS count FROM complaints').get().count;
  const warningCount = Math.min(complaintTotal, 3);
  const totalMoney = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM ledger_entries WHERE entry_type = 'payment'").get().total;
  const totalFood = db.prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM ledger_entries WHERE entry_type = 'food'").get().total;
  const activeSos = db.prepare("SELECT COUNT(*) AS count FROM sos_alerts WHERE status = 'active'").get().count;

  return {
    complaintTotal,
    warningCount,
    strikesLeft: Math.max(3 - warningCount, 0),
    impeached: warningCount >= 3,
    totalMoney,
    totalFood,
    activeSos
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Anti-Kuddus Protocol API' }));

app.post('/api/auth/login', (req, res) => {
  const roll = cleanText(req.body.roll, 20);
  const ipKey = req.ip || 'unknown';
  const attempt = loginAttempts.get(ipKey) || { count: 0, resetAt: Date.now() + 60_000 };
  if (Date.now() > attempt.resetAt) Object.assign(attempt, { count: 0, resetAt: Date.now() + 60_000 });
  if (attempt.count >= 12) return res.status(429).json({ message: 'Too many attempts. Please wait one minute.' });

  const student = db.prepare('SELECT id, display_name FROM students WHERE roll_hash = ?')
    .get(rollHash(roll, ROLL_HASH_SECRET));

  if (!student) {
    attempt.count += 1;
    loginAttempts.set(ipKey, attempt);
    return res.status(401).json({ message: 'This roll number is not in the secret class mapping.' });
  }

  loginAttempts.delete(ipKey);
  const anonymousAlias = `Whistleblower-${crypto.createHash('sha1').update(String(student.id)).digest('hex').slice(0, 4).toUpperCase()}`;
  const token = signToken({ sub: student.id, role: 'student', alias: anonymousAlias }, JWT_SECRET);
  res.json({ token, role: 'student', alias: anonymousAlias });
});

app.post('/api/auth/captain', (req, res) => {
  const code = cleanText(req.body.code, 80);
  const safeA = Buffer.from(code);
  const safeB = Buffer.from(CAPTAIN_CODE);
  const valid = safeA.length === safeB.length && crypto.timingSafeEqual(safeA, safeB);
  if (!valid) return res.status(401).json({ message: 'Captain access code is incorrect.' });

  const token = signToken({ sub: 'captain-dashboard', role: 'captain', alias: 'Biltu & Miltu' }, JWT_SECRET);
  res.json({ token, role: 'captain', alias: 'Biltu & Miltu' });
});

app.get('/api/dashboard', requireAuth(JWT_SECRET, ['student', 'captain']), (_req, res) => {
  res.json(dashboardSummary());
});

app.post('/api/complaints', requireAuth(JWT_SECRET, ['student']), (req, res) => {
  const category = allowedCategories.includes(req.body.category) ? req.body.category : 'Other';
  const description = cleanText(req.body.description, 500);
  if (description.length < 8) return res.status(400).json({ message: 'Please provide at least 8 characters of detail.' });

  db.prepare('INSERT INTO complaints(category, description) VALUES(?, ?)').run(category, description);
  res.status(201).json({ message: 'Complaint delivered anonymously.', summary: dashboardSummary() });
});

app.get('/api/complaints', requireAuth(JWT_SECRET, ['captain']), (_req, res) => {
  const complaints = db.prepare('SELECT id, category, description, created_at FROM complaints ORDER BY id DESC LIMIT 50').all();
  res.json(complaints);
});

app.post('/api/ledger', requireAuth(JWT_SECRET, ['student']), (req, res) => {
  const entryType = req.body.entryType === 'food' ? 'food' : 'payment';
  const amount = entryType === 'payment' ? Math.max(0, Number(req.body.amount || 0)) : 0;
  const quantity = entryType === 'food' ? Math.max(1, Math.round(Number(req.body.quantity || 1))) : 0;
  const foodItem = entryType === 'food' ? cleanText(req.body.foodItem, 80) : null;

  if (entryType === 'payment' && (!Number.isFinite(amount) || amount <= 0 || amount > 1000)) {
    return res.status(400).json({ message: 'Enter a valid payment amount.' });
  }
  if (entryType === 'food' && !foodItem) return res.status(400).json({ message: 'Enter the stolen food item.' });

  db.prepare('INSERT INTO ledger_entries(entry_type, amount, food_item, quantity) VALUES(?, ?, ?, ?)')
    .run(entryType, amount, foodItem, quantity);
  res.status(201).json({ message: 'Ledger entry saved anonymously.' });
});

app.get('/api/ledger', requireAuth(JWT_SECRET, ['student', 'captain']), (_req, res) => {
  const rows = db.prepare(`
    SELECT date(created_at) AS day,
      ROUND(SUM(CASE WHEN entry_type = 'payment' THEN amount ELSE 0 END), 2) AS money,
      SUM(CASE WHEN entry_type = 'food' THEN quantity ELSE 0 END) AS food
    FROM ledger_entries
    GROUP BY date(created_at)
    ORDER BY day ASC
    LIMIT 30
  `).all();
  const recent = db.prepare('SELECT id, entry_type, amount, food_item, quantity, created_at FROM ledger_entries ORDER BY id DESC LIMIT 12').all();
  res.json({ rows, recent, summary: dashboardSummary() });
});

app.post('/api/sos', requireAuth(JWT_SECRET, ['student']), (req, res) => {
  const location = allowedLocations.includes(req.body.location) ? req.body.location : null;
  if (!location) return res.status(400).json({ message: 'Select a valid school location.' });
  const result = db.prepare('INSERT INTO sos_alerts(location) VALUES(?)').run(location);
  res.status(201).json({ id: result.lastInsertRowid, message: `SOS sent from ${location}. Biltu and Miltu have been alerted.` });
});

app.get('/api/sos', requireAuth(JWT_SECRET, ['captain']), (_req, res) => {
  const alerts = db.prepare('SELECT id, location, status, created_at, resolved_at FROM sos_alerts ORDER BY status ASC, id DESC LIMIT 40').all();
  res.json(alerts);
});

app.patch('/api/sos/:id/resolve', requireAuth(JWT_SECRET, ['captain']), (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare("UPDATE sos_alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'").run(id);
  if (!result.changes) return res.status(404).json({ message: 'Active alert not found.' });
  res.json({ message: 'Alert marked as resolved.' });
});

app.post('/api/fact-check', requireAuth(JWT_SECRET, ['student', 'captain']), (req, res) => {
  const rawClaim = cleanText(req.body.claim, 400);
  if (rawClaim.length < 3) return res.status(400).json({ message: 'Type a claim or a few keywords.' });

  const banglaKeywordMap = [
    [/বাড়ির কাজ|বাড়ির কাজ|হোমওয়ার্ক|হোমওয়ার্ক/gu, ' homework '],
    [/ক্যাপ্টেন|অধিনায়ক/gu, ' captain '],
    [/ওয়াশরুম|ওয়াশরুম|টয়লেট|টয়লেট/gu, ' washroom '],
    [/টাকা|ফি|টোল|ঘুষ|চাঁদা/gu, ' money fee toll bribe '],
    [/টিফিন|খাবার|স্যান্ডউইচ|ফ্রাইড রাইস/gu, ' food tiffin sandwich fried rice '],
    [/খেলাধুলা|পিটি|লুডু|টুর্নামেন্ট/gu, ' sports pt ludu tournament '],
    [/পরীক্ষা|টেস্ট|সিলেবাস/gu, ' test syllabus '],
    [/বসার|সিট|আসন|উচ্চতা|দৃষ্টি/gu, ' seat seating height visibility view '],
    [/অভিযোগ|পরিচয়|পরিচয়|প্রতিশোধ/gu, ' complaint identity retaliation '],
    [/তিন|স্ট্রাইক|সতর্কতা|ইমপিচ|অপসারণ/gu, ' three strike warning impeachment '],
    [/জমা|দিতে হয় না|দিতে হয় না|করতে হয় না|করতে হয় না/gu, ' submit must '],
    [/অনুমতি|শিক্ষক/gu, ' permission teacher approval ']
  ];

  let normalizedClaim = rawClaim.toLowerCase();
  for (const [pattern, replacement] of banglaKeywordMap) normalizedClaim = normalizedClaim.replace(pattern, replacement);

  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'said', 'that', 'this',
    'can', 'do', 'does', 'have', 'has', 'must', 'for', 'from', 'with', 'will', 'should', 'students', 'student'
  ]);
  const tokens = [...new Set(normalizedClaim.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !stopWords.has(word)))];
  const rules = db.prepare('SELECT id, title, rule_text, keywords FROM school_rules').all();

  const scored = rules.map((rule) => {
    const haystack = `${rule.title} ${rule.rule_text} ${rule.keywords}`.toLowerCase();
    const matched = tokens.filter((token) => haystack.includes(token));
    const phraseBonus = haystack.includes(normalizedClaim.trim()) ? 3 : 0;
    return { ...rule, score: matched.length + phraseBonus, matched };
  }).filter((rule) => rule.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  res.json({ claim: rawClaim, matches: scored });
});

app.post('/api/summarize', requireAuth(JWT_SECRET, ['student']), async (req, res) => {
  const syllabus = cleanText(req.body.syllabus, 6000);
  const language = req.body.language === 'bn' ? 'bn' : 'en';
  if (syllabus.length < 25) return res.status(400).json({ message: 'Paste a longer syllabus statement first.' });

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const outputInstruction = language === 'bn'
    ? 'Write the final bullet list in simple, natural Bangla suitable for a Class 7 student.'
    : 'Use simple student-friendly English.';
  const prompt = `You are helping Class 7 students understand an exam syllabus.\n\nRules:\n- Return only a concise bulleted list.\n- Keep examinable chapters, topics, formulas, dates, and instructions.\n- Remove jokes, threats, biographies, indexes, cover-page details, barcodes, and unrelated filler.\n- Do not invent topics.\n- ${outputInstruction}\n\nSyllabus:\n${syllabus}`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 700 }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || 'Gemini API request failed.');
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
      if (!text) throw new Error('Gemini returned an empty response.');
      return res.json({ summary: text, mode: 'gemini' });
    } catch (error) {
      console.error('Gemini error:', error.message);
    }
  }

  const summary = localSyllabusFallback(syllabus, language);
  res.json({ summary, mode: 'demo', note: 'Local demo mode is active. Add GEMINI_API_KEY to .env for live LLM summarization.' });
});

function localSyllabusFallback(text, language = 'en') {
  const noise = language === 'bn'
    ? /(বারকোড|পেছনের কভার|লেখকের জীবনী|সূচি|ঝালমুড়ি|ঝালমুড়ি|ক্রিকেট ফাইনাল|কভারের রং)/iu
    : /(barcode|back cover|writer.?s biography|index|jhalmuri|cricket final|terrifying|doomsday|cover colour|cover color)/i;
  const parts = text.split(/[\n.;।]+/).map((part) => part.trim()).filter((part) => part.length > 3 && !noise.test(part));
  const bullets = [];

  if (language === 'bn') {
    const bnRange = text.match(/([০-৯\d]+)\s*(?:থেকে|[-–])\s*([০-৯\d]+)\s*(?:অধ্যায়|অধ্যায়)/u);
    if (bnRange) {
      const normalizeDigits = (value) => Number(value.replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit)));
      const start = normalizeDigits(bnRange[1]);
      const end = Math.min(normalizeDigits(bnRange[2]), start + 20);
      for (let chapter = start; chapter <= end; chapter += 1) bullets.push(`অধ্যায় ${chapter}`);
    }
  } else {
    const chapterMatches = [...text.matchAll(/chapters?\s*(\d+)\s*(?:to|[-–])\s*(\d+)/gi)];
    for (const match of chapterMatches) {
      const start = Number(match[1]);
      const end = Math.min(Number(match[2]), start + 20);
      for (let chapter = start; chapter <= end; chapter += 1) bullets.push(`Chapter ${chapter}`);
    }
  }

  for (const part of parts) {
    if (!bullets.some((item) => part.toLowerCase().includes(item.toLowerCase()))) bullets.push(part.replace(/^[-•]\s*/, ''));
  }

  const fallback = language === 'bn' ? 'শিক্ষকের নিশ্চিত করা অধ্যায়ের তালিকা দেখুন।' : 'Review the teacher-confirmed chapter list.';
  return [...new Set(bullets)].slice(0, 14).map((item) => `• ${item}`).join('\n') || `• ${fallback}`;
}

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (error) => error && next());
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`Anti-Kuddus API running at http://localhost:${PORT}`);
  if (!process.env.JWT_SECRET) console.log('Development secrets are active. Copy .env.example to .env before deployment.');
});
