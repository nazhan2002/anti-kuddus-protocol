const allowedCategories = ['Tiffin Theft', 'Bribes', 'Syllabus Bloat', 'Unfair Sports', 'Washroom Toll', 'Other'];
const allowedLocations = ['Library', 'Playground', 'Corridor', 'Classroom', 'Canteen', 'Washroom', 'School Gate'];
const studentRolls = {
  '701': 'Araf', '702': 'Nabila', '703': 'Rafi', '704': 'Mim',
  '705': 'Siam', '706': 'Tania', '707': 'Hasib', '708': 'Jannat',
  '709': 'Nayeem', '710': 'Sadia', '711': 'Bashir', '712': 'Orpa'
};

let initPromise;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });

  try {
    if (!env.DB) return json({ message: 'Cloudflare D1 database binding "DB" is missing.' }, 500);
    initPromise ||= initializeDatabase(env.DB);
    await initPromise;

    const route = url.pathname.replace(/^\/api/, '') || '/';
    const method = request.method.toUpperCase();

    if (method === 'GET' && route === '/health') {
      return json({ ok: true, service: 'Anti-Kuddus Protocol Cloudflare API' });
    }

    if (method === 'POST' && route === '/auth/login') {
      const body = await bodyJson(request);
      const roll = cleanText(body.roll, 20);
      if (!studentRolls[roll]) return json({ message: 'This roll number is not in the secret class mapping.' }, 401);
      const aliasSeed = await sha256Hex(`${roll}:${env.ROLL_HASH_SECRET || 'cloudflare-roll-secret'}`);
      const alias = `Whistleblower-${aliasSeed.slice(0, 4).toUpperCase()}`;
      const token = await signToken({ sub: roll, role: 'student', alias }, secret(env));
      return json({ token, role: 'student', alias });
    }

    if (method === 'POST' && route === '/auth/captain') {
      const body = await bodyJson(request);
      const code = cleanText(body.code, 80);
      const expected = env.CAPTAIN_CODE || 'BILTU-MILTU-2026';
      if (!(await safeEqual(code, expected))) return json({ message: 'Captain access code is incorrect.' }, 401);
      const token = await signToken({ sub: 'captain-dashboard', role: 'captain', alias: 'Biltu & Miltu' }, secret(env));
      return json({ token, role: 'captain', alias: 'Biltu & Miltu' });
    }

    const user = await authenticate(request, secret(env));

    if (method === 'GET' && route === '/dashboard') {
      requireRole(user, ['student', 'captain']);
      return json(await dashboardSummary(env.DB));
    }

    if (route === '/complaints' && method === 'POST') {
      requireRole(user, ['student']);
      const body = await bodyJson(request);
      const category = allowedCategories.includes(body.category) ? body.category : 'Other';
      const description = cleanText(body.description, 500);
      if (description.length < 8) return json({ message: 'Please provide at least 8 characters of detail.' }, 400);
      await env.DB.prepare('INSERT INTO complaints(category, description) VALUES(?, ?)').bind(category, description).run();
      return json({ message: 'Complaint delivered anonymously.', summary: await dashboardSummary(env.DB) }, 201);
    }

    if (route === '/complaints' && method === 'GET') {
      requireRole(user, ['captain']);
      const { results } = await env.DB.prepare('SELECT id, category, description, created_at FROM complaints ORDER BY id DESC LIMIT 50').all();
      return json(results || []);
    }

    if (route === '/ledger' && method === 'POST') {
      requireRole(user, ['student']);
      const body = await bodyJson(request);
      const entryType = body.entryType === 'food' ? 'food' : 'payment';
      const amount = entryType === 'payment' ? Math.max(0, Number(body.amount || 0)) : 0;
      const quantity = entryType === 'food' ? Math.max(1, Math.round(Number(body.quantity || 1))) : 0;
      const foodItem = entryType === 'food' ? cleanText(body.foodItem, 80) : null;
      if (entryType === 'payment' && (!Number.isFinite(amount) || amount <= 0 || amount > 1000)) {
        return json({ message: 'Enter a valid payment amount.' }, 400);
      }
      if (entryType === 'food' && !foodItem) return json({ message: 'Enter the stolen food item.' }, 400);
      await env.DB.prepare('INSERT INTO ledger_entries(entry_type, amount, food_item, quantity) VALUES(?, ?, ?, ?)')
        .bind(entryType, amount, foodItem, quantity).run();
      return json({ message: 'Ledger entry saved anonymously.' }, 201);
    }

    if (route === '/ledger' && method === 'GET') {
      requireRole(user, ['student', 'captain']);
      const { results: rows } = await env.DB.prepare(`
        SELECT date(created_at) AS day,
          ROUND(SUM(CASE WHEN entry_type = 'payment' THEN amount ELSE 0 END), 2) AS money,
          SUM(CASE WHEN entry_type = 'food' THEN quantity ELSE 0 END) AS food
        FROM ledger_entries
        GROUP BY date(created_at)
        ORDER BY day ASC
        LIMIT 30
      `).all();
      const { results: recent } = await env.DB.prepare('SELECT id, entry_type, amount, food_item, quantity, created_at FROM ledger_entries ORDER BY id DESC LIMIT 12').all();
      return json({ rows: rows || [], recent: recent || [], summary: await dashboardSummary(env.DB) });
    }

    if (route === '/sos' && method === 'POST') {
      requireRole(user, ['student']);
      const body = await bodyJson(request);
      const location = allowedLocations.includes(body.location) ? body.location : null;
      if (!location) return json({ message: 'Select a valid school location.' }, 400);
      const result = await env.DB.prepare('INSERT INTO sos_alerts(location) VALUES(?)').bind(location).run();
      return json({ id: result.meta?.last_row_id, message: `SOS sent from ${location}. Biltu and Miltu have been alerted.` }, 201);
    }

    if (route === '/sos' && method === 'GET') {
      requireRole(user, ['captain']);
      const { results } = await env.DB.prepare('SELECT id, location, status, created_at, resolved_at FROM sos_alerts ORDER BY status ASC, id DESC LIMIT 40').all();
      return json(results || []);
    }

    const resolveMatch = route.match(/^\/sos\/(\d+)\/resolve$/);
    if (resolveMatch && method === 'PATCH') {
      requireRole(user, ['captain']);
      const result = await env.DB.prepare("UPDATE sos_alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'")
        .bind(Number(resolveMatch[1])).run();
      if (!result.meta?.changes) return json({ message: 'Active alert not found.' }, 404);
      return json({ message: 'Alert marked as resolved.' });
    }

    if (route === '/fact-check' && method === 'POST') {
      requireRole(user, ['student', 'captain']);
      const body = await bodyJson(request);
      const rawClaim = cleanText(body.claim, 400);
      if (rawClaim.length < 3) return json({ message: 'Type a claim or a few keywords.' }, 400);
      const { results: rules } = await env.DB.prepare('SELECT id, title, rule_text, keywords FROM school_rules').all();
      return json({ claim: rawClaim, matches: scoreRules(rawClaim, rules || []) });
    }

    if (route === '/summarize' && method === 'POST') {
      requireRole(user, ['student']);
      const body = await bodyJson(request);
      const syllabus = cleanText(body.syllabus, 6000);
      const language = body.language === 'bn' ? 'bn' : 'en';
      if (syllabus.length < 25) return json({ message: 'Paste a longer syllabus statement first.' }, 400);

      if (env.GEMINI_API_KEY) {
        try {
          const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
          const outputInstruction = language === 'bn'
            ? 'Write the final bullet list in simple, natural Bangla suitable for a Class 7 student.'
            : 'Use simple student-friendly English.';
          const prompt = `You are helping Class 7 students understand an exam syllabus.\n\nRules:\n- Return only a concise bulleted list.\n- Keep examinable chapters, topics, formulas, dates, and instructions.\n- Remove jokes, threats, biographies, indexes, cover-page details, barcodes, and unrelated filler.\n- Do not invent topics.\n- ${outputInstruction}\n\nSyllabus:\n${syllabus}`;
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.2, maxOutputTokens: 700 }
            })
          });
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
          if (response.ok && text) return json({ summary: text, mode: 'gemini' });
        } catch (_) {
          // Fallback below.
        }
      }

      return json({
        summary: localSyllabusFallback(syllabus, language),
        mode: 'demo',
        note: 'Local demo mode is active. Add GEMINI_API_KEY as a Cloudflare secret for live LLM summarization.'
      });
    }

    return json({ message: 'Route not found.' }, 404);
  } catch (error) {
    if (error instanceof HttpError) return json({ message: error.message }, error.status);
    console.error(error);
    return json({ message: 'Something went wrong on the server.' }, 500);
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function requireRole(user, roles) {
  if (!user) throw new HttpError(401, 'Authentication required.');
  if (!roles.includes(user.role)) throw new HttpError(403, 'This account cannot access that feature.');
}

async function authenticate(request, jwtSecret) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  return verifyToken(header.slice(7), jwtSecret);
}

async function dashboardSummary(db) {
  const [complaints, money, food, sos] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS count FROM complaints').first(),
    db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM ledger_entries WHERE entry_type = 'payment'").first(),
    db.prepare("SELECT COALESCE(SUM(quantity), 0) AS total FROM ledger_entries WHERE entry_type = 'food'").first(),
    db.prepare("SELECT COUNT(*) AS count FROM sos_alerts WHERE status = 'active'").first()
  ]);
  const complaintTotal = Number(complaints?.count || 0);
  const warningCount = Math.min(complaintTotal, 3);
  return {
    complaintTotal,
    warningCount,
    strikesLeft: Math.max(3 - warningCount, 0),
    impeached: warningCount >= 3,
    totalMoney: Number(money?.total || 0),
    totalFood: Number(food?.total || 0),
    activeSos: Number(sos?.count || 0)
  };
}

async function initializeDatabase(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      food_item TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );
    CREATE TABLE IF NOT EXISTS school_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL UNIQUE,
      rule_text TEXT NOT NULL,
      keywords TEXT NOT NULL
    );
  `);

  const rules = [
    ['Homework Responsibility', 'Every student, including all class captains, must complete and submit assigned homework on time.', 'homework captain submit assignment'],
    ['Captain Decision Process', 'The first captain must consult the second and third captains before making any major class decision.', 'captain decision consult biltu miltu major'],
    ['Collection of Money', 'No class captain may collect money, fees, tolls, or donations without prior written approval from the class teacher.', 'money fee toll bribe donation collect teacher approval'],
    ['Washroom Access', 'Students may use the washroom during free periods without paying any fee.', 'washroom break free period fee payment'],
    ['Food and Personal Property', 'No student or captain may take, tax, taste, or keep another student’s food without clear permission.', 'food tiffin theft tax sandwich fried rice permission'],
    ['Sports and PT Period', 'PT-period activities must be selected fairly and must not be controlled by one captain for personal preference.', 'sports pt ludu tournament fair captain'],
    ['Test Scheduling', 'Class tests should be scheduled by the subject teacher with reasonable notice and a clearly defined syllabus.', 'class test schedule syllabus notice teacher'],
    ['Seating Arrangement', 'Classroom seats should support learning and visibility; no student may block the teacher’s view intentionally.', 'seat seating height visibility teacher view block'],
    ['Complaint Protection', 'A student may submit a legitimate complaint without retaliation or public disclosure of identity.', 'complaint anonymous identity retaliation protection'],
    ['Three-Strike Rule', 'Three legitimate anonymous complaints against the first captain result in immediate impeachment after two warnings.', 'three strike complaint warning impeachment']
  ];

  await db.batch(rules.map((rule) => db.prepare('INSERT OR IGNORE INTO school_rules(title, rule_text, keywords) VALUES(?, ?, ?)').bind(...rule)));

  const complaintCount = await db.prepare('SELECT COUNT(*) AS count FROM complaints').first();
  if (!Number(complaintCount?.count || 0)) {
    await db.prepare("INSERT INTO complaints(category, description, created_at) VALUES(?, ?, datetime('now', '-1 day'))")
      .bind('Bribes', 'A 2-Taka washroom toll was collected during the free period.').run();
  }

  const ledgerCount = await db.prepare('SELECT COUNT(*) AS count FROM ledger_entries').first();
  if (!Number(ledgerCount?.count || 0)) {
    await db.batch([
      db.prepare("INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES('payment', 4, NULL, 0, datetime('now', '-5 day'))"),
      db.prepare("INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES('food', 0, 'Fried rice', 1, datetime('now', '-5 day'))"),
      db.prepare("INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES('payment', 2, NULL, 0, datetime('now', '-3 day'))"),
      db.prepare("INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES('food', 0, 'Sandwich', 1, datetime('now', '-2 day'))"),
      db.prepare("INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES('payment', 4, NULL, 0, datetime('now', '-1 day'))")
    ]);
  }
}

function scoreRules(rawClaim, rules) {
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
  const stopWords = new Set(['the','a','an','is','are','was','were','to','of','and','or','said','that','this','can','do','does','have','has','must','for','from','with','will','should','students','student']);
  const tokens = [...new Set(normalizedClaim.split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !stopWords.has(word)))];
  return rules.map((rule) => {
    const haystack = `${rule.title} ${rule.rule_text} ${rule.keywords}`.toLowerCase();
    const matched = tokens.filter((token) => haystack.includes(token));
    const phraseBonus = haystack.includes(normalizedClaim.trim()) ? 3 : 0;
    return { ...rule, score: matched.length + phraseBonus, matched };
  }).filter((rule) => rule.score > 0).sort((a, b) => b.score - a.score).slice(0, 4);
}

function localSyllabusFallback(text, language = 'en') {
  const noise = language === 'bn'
    ? /(বারকোড|পেছনের কভার|লেখকের জীবনী|সূচি|ঝালমুড়ি|ঝালমুড়ি|ক্রিকেট ফাইনাল|কভারের রং)/iu
    : /(barcode|back cover|writer.?s biography|index|jhalmuri|cricket final|terrifying|doomsday|cover colour|cover color)/i;
  const parts = text.split(/[\n.;।]+/).map((part) => part.trim()).filter((part) => part.length > 3 && !noise.test(part));
  const bullets = [];
  if (language === 'bn') {
    const match = text.match(/([০-৯\d]+)\s*(?:থেকে|[-–])\s*([০-৯\d]+)\s*(?:অধ্যায়|অধ্যায়)/u);
    if (match) {
      const normalizeDigits = (value) => Number(value.replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit)));
      const start = normalizeDigits(match[1]);
      const end = Math.min(normalizeDigits(match[2]), start + 20);
      for (let chapter = start; chapter <= end; chapter += 1) bullets.push(`অধ্যায় ${chapter}`);
    }
  } else {
    for (const match of text.matchAll(/chapters?\s*(\d+)\s*(?:to|[-–])\s*(\d+)/gi)) {
      const start = Number(match[1]);
      const end = Math.min(Number(match[2]), start + 20);
      for (let chapter = start; chapter <= end; chapter += 1) bullets.push(`Chapter ${chapter}`);
    }
  }
  for (const part of parts) if (!bullets.some((item) => part.toLowerCase().includes(item.toLowerCase()))) bullets.push(part.replace(/^[-•]\s*/, ''));
  const fallback = language === 'bn' ? 'শিক্ষকের নিশ্চিত করা অধ্যায়ের তালিকা দেখুন।' : 'Review the teacher-confirmed chapter list.';
  return [...new Set(bullets)].slice(0, 14).map((item) => `• ${item}`).join('\n') || `• ${fallback}`;
}

function cleanText(value, max = 500) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

async function bodyJson(request) {
  try { return await request.json(); } catch { return {}; }
}

function secret(env) {
  return env.JWT_SECRET || 'change-this-cloudflare-jwt-secret';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }
  });
}

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept-Language', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS' };
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function textToBase64Url(value) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

async function signToken(payload, jwtSecret) {
  const header = textToBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = textToBase64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12 }));
  const unsigned = `${header}.${body}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function verifyToken(token, jwtSecret) {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const signatureBytes = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(signature.length / 4) * 4, '=')), (char) => char.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(`${header}.${body}`));
    if (!valid) return null;
    const payload = JSON.parse(base64UrlToText(body));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function sha256Hex(value) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = ha.length ^ hb.length;
  for (let i = 0; i < Math.max(ha.length, hb.length); i += 1) diff |= (ha.charCodeAt(i) || 0) ^ (hb.charCodeAt(i) || 0);
  return diff === 0;
}
