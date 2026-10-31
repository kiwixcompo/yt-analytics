import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, YOUTUBE_SCOPES } from '@/lib/google-oauth';

export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const oauth2Client = getOAuth2Client(host);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: 'Google OAuth credentials missing in .env.local' },
      { status: 500 }
    );
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial to receive a refresh_token
    prompt: 'consent', // Forces consent screen to always grant refresh_token
    scope: YOUTUBE_SCOPES,
  });

  return NextResponse.redirect(authUrl);
}
