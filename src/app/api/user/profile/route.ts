import { NextRequest, NextResponse } from 'next/server';
import { getUserProfileByEmail, saveUserProfileByEmail } from '@/lib/db';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email',
};

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
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.toLowerCase().trim() || 
                  req.headers.get('x-user-email')?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter or x-user-email header is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = getUserProfileByEmail(email);
    if (!result) {
      return NextResponse.json(
        { error: `User profile not found for ${email}` },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, user: result.user, savedProfile: result.savedProfile },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error fetching user profile from db:', error);
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
    const name = (body.name || 'User').trim();
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

    const result = saveUserProfileByEmail(
      email,
      name,
      savedProfile.resumeData,
      savedProfile.templateSettings
    );

    return NextResponse.json(
      { success: true, user: result.user, savedProfile: result.savedProfile },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error saving user profile to db:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save user profile' },
      { status: 500, headers: corsHeaders }
    );
  }
}
