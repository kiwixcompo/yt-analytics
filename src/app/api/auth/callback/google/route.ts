import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client } from '@/lib/google-oauth';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=missing_code', request.url));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch Channel Information to identify the connected account
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelRes = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      mine: true,
    });

    const channel = channelRes.data.items?.[0];
    if (!channel) {
      return NextResponse.redirect(new URL('/?error=no_channel_found', request.url));
    }

    // Map all channels accessible by this token
    const availableChannels = (channelRes.data.items || []).map((ch) => ({
      id: ch.id as string,
      title: ch.snippet?.title || 'Untitled',
      customUrl: ch.snippet?.customUrl,
      thumbnail: ch.snippet?.thumbnails?.default?.url,
      uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads,
      subscriberCount: ch.statistics?.subscriberCount,
      viewCount: ch.statistics?.viewCount,
      videoCount: ch.statistics?.videoCount,
    }));

    // Prepare session payload
    const sessionData = {
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
      channel: availableChannels[0],
      availableChannels,
    };

    // Store session in secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('yt_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (err: any) {
    console.error('OAuth Callback Error:', err);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(err.message || 'auth_failed')}`, request.url)
    );
  }
}
