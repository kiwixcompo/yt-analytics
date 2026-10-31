import { cookies } from 'next/headers';
import { getOAuth2Client } from './google-oauth';
import { google } from 'googleapis';

export interface ChannelSession {
  tokens: {
    access_token?: string | null;
    refresh_token?: string | null;
    expiry_date?: number | null;
  };
  channel: {
    id: string;
    title: string;
    customUrl?: string;
    thumbnail?: string;
    uploadsPlaylistId?: string;
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
  availableChannels?: Array<{
    id: string;
    title: string;
    customUrl?: string;
    thumbnail?: string;
    uploadsPlaylistId?: string;
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  }>;
}

export async function getSession(): Promise<ChannelSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('yt_session');

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as ChannelSession;
  } catch {
    return null;
  }
}

export async function getAuthenticatedClient(session: ChannelSession) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(session.tokens);

  // Auto-refresh token if expired or about to expire in 5 minutes
  const isExpired = session.tokens.expiry_date && Date.now() >= (session.tokens.expiry_date - 300000);

  if (isExpired && session.tokens.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      session.tokens.access_token = credentials.access_token;
      session.tokens.expiry_date = credentials.expiry_date;
      
      const cookieStore = await cookies();
      cookieStore.set('yt_session', JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
        sameSite: 'lax',
      });
    } catch (refreshErr: any) {
      console.warn('OAuth refresh token expired or invalid_grant:', refreshErr.message);
      // Clear corrupted or revoked session cookie
      try {
        const cookieStore = await cookies();
        cookieStore.delete('yt_session');
      } catch {}
      throw new Error('SESSION_EXPIRED');
    }
  }

  return oauth2Client;
}
