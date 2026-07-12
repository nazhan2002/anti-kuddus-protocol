import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'anti-kuddus.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

export function rollHash(roll, secret) {
  return crypto.createHmac('sha256', secret).update(String(roll).trim()).digest('hex');
}

export function initializeDatabase({ rollSecret }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_name TEXT NOT NULL,
      roll_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL CHECK(length(description) BETWEEN 8 AND 500),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('payment', 'food')),
      amount REAL NOT NULL DEFAULT 0 CHECK(amount >= 0),
      food_item TEXT,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sos_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'resolved')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS school_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      rule_text TEXT NOT NULL,
      keywords TEXT NOT NULL
    );
  `);

  seedStudents(rollSecret);
  seedRules();
  seedDemoData();
}

function seedStudents(rollSecret) {
  const fingerprint = crypto.createHash('sha256').update(rollSecret).digest('hex').slice(0, 16);
  const saved = db.prepare("SELECT value FROM app_meta WHERE key = 'roll_secret_fingerprint'").get();

  if (!saved || saved.value !== fingerprint) {
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM students').run();
      db.prepare(`INSERT INTO app_meta(key, value) VALUES('roll_secret_fingerprint', ?)
                  ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(fingerprint);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  const students = [
    ['Araf', '701'], ['Nabila', '702'], ['Rafi', '703'], ['Mim', '704'],
    ['Siam', '705'], ['Tania', '706'], ['Hasib', '707'], ['Jannat', '708'],
    ['Nayeem', '709'], ['Sadia', '710'], ['Bashir', '711'], ['Orpa', '712']
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO students(display_name, roll_hash) VALUES(?, ?)');
  db.exec('BEGIN');
  try {
    for (const [name, roll] of students) insert.run(name, rollHash(roll, rollSecret));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedRules() {
  const count = db.prepare('SELECT COUNT(*) AS count FROM school_rules').get().count;
  if (count > 0) return;

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

  const insert = db.prepare('INSERT INTO school_rules(title, rule_text, keywords) VALUES(?, ?, ?)');
  db.exec('BEGIN');
  try {
    rules.forEach((rule) => insert.run(...rule));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function seedDemoData() {
  const complaintCount = db.prepare('SELECT COUNT(*) AS count FROM complaints').get().count;
  if (complaintCount === 0) {
    db.prepare('INSERT INTO complaints(category, description, created_at) VALUES(?, ?, datetime(\'now\', \'-1 day\'))')
      .run('Bribes', 'A 2-Taka washroom toll was collected during the free period.');
  }

  const ledgerCount = db.prepare('SELECT COUNT(*) AS count FROM ledger_entries').get().count;
  if (ledgerCount === 0) {
    const add = db.prepare('INSERT INTO ledger_entries(entry_type, amount, food_item, quantity, created_at) VALUES(?, ?, ?, ?, ?)');
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const iso = date.toISOString();
      add.run('payment', i % 2 === 0 ? 4 : 2, null, 0, iso);
      if (i % 2 === 1) add.run('food', 0, i === 1 ? 'Sandwich' : 'Fried rice', 1, iso);
    }
  }
}

export default db;
