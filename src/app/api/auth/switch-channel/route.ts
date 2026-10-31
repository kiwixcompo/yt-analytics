import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { channelId } = await request.json();
  if (!channelId) {
    return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
  }

  let targetChannel = (session.availableChannels || []).find((c) => c.id === channelId);

  // If not found in cached list, fetch it directly via YouTube Data API
  if (!targetChannel) {
    try {
      const { google } = await import('googleapis');
      const { getAuthenticatedClient } = await import('@/lib/session');
      const auth = await getAuthenticatedClient(session);
      const youtube = google.youtube({ version: 'v3', auth });

      let res = await youtube.channels.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: [channelId],
      });

      if (!res.data.items || res.data.items.length === 0) {
        res = await youtube.channels.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          forHandle: channelId.replace('@', ''),
        });
      }

      const ch = res.data.items?.[0];
      if (ch && ch.id) {
        targetChannel = {
          id: ch.id,
          title: ch.snippet?.title || 'Untitled',
          customUrl: ch.snippet?.customUrl || undefined,
          thumbnail: ch.snippet?.thumbnails?.default?.url || undefined,
          uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads || undefined,
          subscriberCount: ch.statistics?.subscriberCount || undefined,
          viewCount: ch.statistics?.viewCount || undefined,
          videoCount: ch.statistics?.videoCount || undefined,
        };

        if (!session.availableChannels) session.availableChannels = [];
        session.availableChannels.push(targetChannel);
      }
    } catch (e: any) {
      console.warn('Direct channel resolution error:', e.message);
    }
  }

  if (!targetChannel) {
    return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
  }

  // Update current active channel in session cookie
  session.channel = targetChannel;

  const cookieStore = await cookies();
  cookieStore.set('yt_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  });

  return NextResponse.json({ success: true, channel: targetChannel });
}
