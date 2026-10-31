import { google } from 'googleapis';

export function getOAuth2Client(requestHost?: string | null) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Determine redirect URI:
  // 1. If explicit GOOGLE_REDIRECT_URI is set and not pointing to localhost on production, use it.
  // 2. Otherwise auto-derive from request host (e.g. yt-keywords.netlify.app)
  // 3. Fallback to NEXT_PUBLIC_APP_URL or localhost
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (requestHost) {
    const protocol = requestHost.includes('localhost') ? 'http' : 'https';
    redirectUri = `${protocol}://${requestHost}/api/auth/callback/google`;
  } else if (!redirectUri || (process.env.NODE_ENV === 'production' && redirectUri.includes('localhost'))) {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://yt-keywords.netlify.app';
    redirectUri = `${base.replace(/\/$/, '')}/api/auth/callback/google`;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];
