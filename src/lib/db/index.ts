import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { sampleResumeData } from '@/lib/sample-data';
import { DEFAULT_TEMPLATE_SETTINGS, TemplateSettings } from '@/store/resume-store';
import { ResumeData } from '@/lib/schema';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'resume_studio.db');
const LEGACY_PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

let dbInstance: Database.Database | null = null;

export interface DbUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  user_id: string;
  profile_name: string;
  resume_data: string; // JSON
  template_settings: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  savedProfile: {
    resumeData: ResumeData;
    templateSettings: TemplateSettings;
    updatedAt: string;
  };
}

export function getDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      profile_name TEXT NOT NULL DEFAULT 'default',
      resume_data TEXT NOT NULL,
      template_settings TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, profile_name)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
  `);

  // Migrate legacy JSON profiles if present
  migrateLegacyJsonIfPresent(db);

  // Ensure default demo user exists
  ensureDemoUser(db);

  dbInstance = db;
  return db;
}

function migrateLegacyJsonIfPresent(db: Database.Database) {
  try {
    if (fs.existsSync(LEGACY_PROFILES_FILE)) {
      const content = fs.readFileSync(LEGACY_PROFILES_FILE, 'utf-8');
      const legacyData = JSON.parse(content);
      const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertProfile = db.prepare(`
        INSERT OR REPLACE INTO profiles (id, user_id, profile_name, resume_data, template_settings, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const tx = db.transaction(() => {
        for (const [rawEmail, entry] of Object.entries<any>(legacyData)) {
          const email = rawEmail.toLowerCase().trim();
          const name = entry.name || 'User';
          const userId = 'usr_' + Buffer.from(email).toString('hex').slice(0, 12);
          const now = new Date().toISOString();

          insertUser.run(userId, email, name, now, now);

          if (entry.savedProfile?.resumeData) {
            const profileId = 'prof_' + Buffer.from(email + '_default').toString('hex').slice(0, 12);
            insertProfile.run(
              profileId,
              userId,
              'default',
              JSON.stringify(entry.savedProfile.resumeData),
              JSON.stringify(entry.savedProfile.templateSettings || DEFAULT_TEMPLATE_SETTINGS),
              now,
              entry.savedProfile.updatedAt || now
            );
          }
        }
      });
      tx();
    }
  } catch (err) {
    console.warn('Notice: Legacy JSON migration skipped or failed:', err);
  }
}

function ensureDemoUser(db: Database.Database) {
  const demoUsers = [
    {
      email: 'alex.chen@example.com',
      name: 'Alex Chen',
      userId: 'usr_alex_chen',
      profileId: 'prof_alex_chen_default',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      links: 'https://linkedin.com/in/alexchen | https://github.com/alexchen'
    },
    {
      email: 'devang@example.com',
      name: 'Devang Srivastava',
      userId: 'usr_devang_srivastava',
      profileId: 'prof_devang_default',
      phone: '+1 (555) 849-1029',
      location: 'San Francisco, CA',
      links: 'https://linkedin.com/in/devang-srivastava | https://github.com/devang'
    }
  ];

  const tx = db.transaction(() => {
    for (const u of demoUsers) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(u.email);
      if (!existing) {
        const now = new Date().toISOString();
        const demoResume: ResumeData = {
          ...sampleResumeData,
          personal_info: {
            full_name: u.name,
            contact: {
              email: u.email,
              phone: u.phone,
              location: u.location,
              links: u.links
            }
          }
        };

        db.prepare(`
          INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(u.userId, u.email, u.name, now, now);

        db.prepare(`
          INSERT OR REPLACE INTO profiles (id, user_id, profile_name, resume_data, template_settings, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          u.profileId,
          u.userId,
          'default',
          JSON.stringify(demoResume),
          JSON.stringify(DEFAULT_TEMPLATE_SETTINGS),
          now,
          now
        );
      }
    }
  });

  tx();
}

export function getUserProfileByEmail(email: string, profileName = 'default'): UserProfileResponse | null {
  const db = getDatabase();
  const cleanEmail = email.toLowerCase().trim();

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(cleanEmail) as { id: string; name: string; email: string } | undefined;
  if (!user) {
    return null;
  }

  const profile = db.prepare('SELECT resume_data, template_settings, updated_at FROM profiles WHERE user_id = ? AND profile_name = ?')
    .get(user.id, profileName) as { resume_data: string; template_settings: string; updated_at: string } | undefined;

  if (!profile) {
    return null;
  }

  try {
    const resumeData: ResumeData = JSON.parse(profile.resume_data);
    const templateSettings: TemplateSettings = JSON.parse(profile.template_settings);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      savedProfile: {
        resumeData,
        templateSettings,
        updatedAt: profile.updated_at
      }
    };
  } catch (err) {
    console.error('Error parsing profile JSON from db:', err);
    return null;
  }
}

export function saveUserProfileByEmail(
  email: string,
  name: string,
  resumeData: ResumeData,
  templateSettings: TemplateSettings = DEFAULT_TEMPLATE_SETTINGS,
  profileName = 'default'
): UserProfileResponse {
  const db = getDatabase();
  const cleanEmail = email.toLowerCase().trim();
  const cleanName = name.trim() || 'User';
  const now = new Date().toISOString();

  let user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(cleanEmail) as { id: string; name: string; email: string } | undefined;

  const tx = db.transaction(() => {
    let userId: string;
    if (!user) {
      userId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      db.prepare(`
        INSERT INTO users (id, email, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, cleanEmail, cleanName, now, now);
      user = { id: userId, name: cleanName, email: cleanEmail };
    } else {
      userId = user.id;
      db.prepare(`
        UPDATE users SET name = ?, updated_at = ? WHERE id = ?
      `).run(cleanName, now, userId);
      user.name = cleanName;
    }

    const existingProfile = db.prepare('SELECT id FROM profiles WHERE user_id = ? AND profile_name = ?').get(userId, profileName) as { id: string } | undefined;
    const profileId = existingProfile?.id || ('prof_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));

    db.prepare(`
      INSERT OR REPLACE INTO profiles (id, user_id, profile_name, resume_data, template_settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      profileId,
      userId,
      profileName,
      JSON.stringify(resumeData),
      JSON.stringify(templateSettings),
      now,
      now
    );
  });

  tx();

  return {
    user: {
      id: user!.id,
      name: user!.name,
      email: user!.email
    },
    savedProfile: {
      resumeData,
      templateSettings,
      updatedAt: now
    }
  };
}
