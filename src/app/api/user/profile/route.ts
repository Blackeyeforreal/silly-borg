import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sampleResumeData } from '@/lib/sample-data';
import { DEFAULT_TEMPLATE_SETTINGS, TemplateSettings } from '@/store/resume-store';
import { ResumeData } from '@/lib/schema';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email',
};

const DATA_DIR = path.join(process.cwd(), '.data');
const PROFILES_FILE = path.join(DATA_DIR, 'user-profiles.json');

interface StoredProfile {
  name: string;
  email: string;
  savedProfile: {
    resumeData: ResumeData;
    templateSettings: TemplateSettings;
    updatedAt: string;
  };
}

let inMemoryStore: Record<string, StoredProfile> = {};

function initStorage(): Record<string, StoredProfile> {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PROFILES_FILE)) {
      const data = fs.readFileSync(PROFILES_FILE, 'utf-8');
      inMemoryStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read user-profiles.json, using in-memory store:', err);
  }

  // Pre-seed demo users if not present
  const demoEmail = 'alex.chen@example.com';
  if (!inMemoryStore[demoEmail]) {
    inMemoryStore[demoEmail] = {
      name: 'Alex Chen',
      email: demoEmail,
      savedProfile: {
        resumeData: {
          ...sampleResumeData,
          personal_info: {
            full_name: 'Alex Chen',
            contact: {
              email: demoEmail,
              phone: '+1 (555) 019-2834',
              location: 'San Francisco, CA',
              links: 'https://linkedin.com/in/alexchen | https://github.com/alexchen'
            }
          }
        },
        templateSettings: DEFAULT_TEMPLATE_SETTINGS,
        updatedAt: new Date().toISOString()
      }
    };
    saveToDisk(inMemoryStore);
  }

  return inMemoryStore;
}

function saveToDisk(store: Record<string, StoredProfile>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist user-profiles.json to disk:', err);
  }
}

// OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// GET profile by email
export async function GET(req: NextRequest) {
  try {
    const store = initStorage();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim() || 
                  req.headers.get('x-user-email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter or x-user-email header is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const userProfile = store[email];
    if (!userProfile) {
      return NextResponse.json(
        { error: `User profile not found for ${email}` },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, user: { name: userProfile.name, email: userProfile.email }, savedProfile: userProfile.savedProfile },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST save / update profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || req.headers.get('x-user-email'))?.toLowerCase().trim();
    const name = body.name || 'User';
    const savedProfile = body.savedProfile;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required to save profile' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!savedProfile || !savedProfile.resumeData) {
      return NextResponse.json(
        { error: 'savedProfile.resumeData is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const store = initStorage();
    store[email] = {
      name,
      email,
      savedProfile: {
        resumeData: savedProfile.resumeData,
        templateSettings: savedProfile.templateSettings || DEFAULT_TEMPLATE_SETTINGS,
        updatedAt: savedProfile.updatedAt || new Date().toISOString()
      }
    };

    saveToDisk(store);

    return NextResponse.json(
      { success: true, user: { name, email }, savedProfile: store[email].savedProfile },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error saving user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save user profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}
