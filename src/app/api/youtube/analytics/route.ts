import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import {
  getAnalyticsSummary,
  getTrafficSources,
  getTopCountries,
  getRecentVideos,
} from '@/lib/youtube-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '28', 10);

    const [analytics, trafficSources, topCountries, videos] = await Promise.all([
      getAnalyticsSummary(session, days),
      getTrafficSources(session, days),
      getTopCountries(session, days),
      getRecentVideos(session, 25),
    ]);

    return NextResponse.json({
      channel: {
        title: session.channel.title,
        id: session.channel.id,
        subscriberCount: session.channel.subscriberCount,
        viewCount: session.channel.viewCount,
        videoCount: session.channel.videoCount,
        thumbnail: session.channel.thumbnail,
      },
      days,
      analytics,
      trafficSources,
      topCountries,
      videos,
    });
  } catch (err: any) {
    console.error('Analytics API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
