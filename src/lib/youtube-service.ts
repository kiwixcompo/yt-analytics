import { google } from 'googleapis';
import { getAuthenticatedClient, ChannelSession } from './session';

/**
 * Fetch channel's recent uploads using the uploads playlist ID.
 * This takes only 1 quota unit instead of 100 quota units for search.list!
 */
export async function getRecentVideos(session: ChannelSession, maxResults = 25) {
  const auth = await getAuthenticatedClient(session);
  const youtube = google.youtube({ version: 'v3', auth });

  const uploadsPlaylistId = session.channel.uploadsPlaylistId;
  if (!uploadsPlaylistId) {
    return [];
  }

  // 1. Fetch video IDs from uploads playlist (1 quota unit)
  const playlistItemsRes = await youtube.playlistItems.list({
    part: ['snippet', 'contentDetails'],
    playlistId: uploadsPlaylistId,
    maxResults,
  });

  const videoIds = playlistItemsRes.data.items
    ?.map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => Boolean(id));

  if (!videoIds || videoIds.length === 0) {
    return [];
  }

  // 2. Fetch full video statistics and tags in ONE single batch call (1 quota unit)
  const videosRes = await youtube.videos.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    id: videoIds,
  });

  return (videosRes.data.items || []).map((video) => {
    const publishedAt = new Date(video.snippet?.publishedAt || Date.now());
    const hoursSincePublished = Math.max(1, (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60));
    const views = parseInt(video.statistics?.viewCount || '0', 10);
    const vph = Math.round((views / hoursSincePublished) * 10) / 10;

    return {
      id: video.id,
      title: video.snippet?.title || 'Untitled',
      description: video.snippet?.description || '',
      publishedAt: video.snippet?.publishedAt,
      thumbnails: video.snippet?.thumbnails,
      tags: video.snippet?.tags || [],
      viewCount: views,
      likeCount: parseInt(video.statistics?.likeCount || '0', 10),
      commentCount: parseInt(video.statistics?.commentCount || '0', 10),
      duration: video.contentDetails?.duration,
      vph,
    };
  });
}

/**
 * Fetch Channel Performance Analytics (Day-by-day views and watch time)
 * Uses YouTube Analytics API (Separate quota, free)
 */
export async function getAnalyticsSummary(session: ChannelSession, days = 28) {
  const auth = await getAuthenticatedClient(session);
  const ytAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - days);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const response = await ytAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
      dimensions: 'day',
      sort: 'day',
    });

    const rows = response.data.rows || [];
    return rows.map((row) => ({
      date: row[0],
      views: Number(row[1] || 0),
      watchTimeMinutes: Math.round(Number(row[2] || 0)),
      avgViewDurationSec: Math.round(Number(row[3] || 0)),
      subscribersGained: Number(row[4] || 0),
      subscribersLost: Number(row[5] || 0),
    }));
  } catch (error) {
    console.warn('Analytics report query returned an issue:', error);
    return [];
  }
}

/**
 * Traffic Sources Breakdown (Search, Suggested, External, Browse, Direct)
 */
export async function getTrafficSources(session: ChannelSession, days = 28) {
  const auth = await getAuthenticatedClient(session);
  const ytAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - days);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const response = await ytAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'insightTrafficSourceType',
      sort: '-views',
    });

    const rows = response.data.rows || [];
    const sourceMap: Record<string, string> = {
      ADVERTISING: 'YouTube Ads',
      ANNOTATION: 'Annotations',
      CAMPAIGN_CARD: 'Cards',
      END_SCREEN: 'End Screens',
      EXT_URL: 'External Websites',
      NOTIFICATION: 'Notifications',
      RELATED_VIDEO: 'Suggested Videos',
      SUBSCRIBER: 'Subscriptions Feed',
      YT_CHANNEL: 'Channel Pages',
      YT_OTHER_PAGE: 'Other YouTube Features',
      YT_SEARCH: 'YouTube Search',
      SHORTS: 'Shorts Feed',
      NO_LINK_OTHER: 'Direct / Unknown',
    };

    return rows.map((r) => ({
      sourceKey: r[0],
      label: sourceMap[String(r[0])] || String(r[0]),
      views: Number(r[1] || 0),
      watchTimeMinutes: Math.round(Number(r[2] || 0)),
    }));
  } catch (err) {
    console.warn('Traffic sources query warning:', err);
    return [];
  }
}

/**
 * Top Geographic Demographics by Views
 */
export async function getTopCountries(session: ChannelSession, days = 28) {
  const auth = await getAuthenticatedClient(session);
  const ytAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  const endDate = new Date().toISOString().split('T')[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - days);
  const startDate = startDateObj.toISOString().split('T')[0];

  try {
    const response = await ytAnalytics.reports.query({
      ids: 'channel==MINE',
      startDate,
      endDate,
      metrics: 'views,estimatedMinutesWatched',
      dimensions: 'country',
      sort: '-views',
      maxResults: 10,
    });

    const rows = response.data.rows || [];
    return rows.map((r) => ({
      countryCode: String(r[0]),
      views: Number(r[1] || 0),
      watchTimeMinutes: Math.round(Number(r[2] || 0)),
    }));
  } catch (err) {
    console.warn('Country demographics query warning:', err);
    return [];
  }
}

/**
 * VidPulse Competitor Channel Inspector:
 * Resolves a channel handle/URL, fetches subscriber size, and extracts recent top outlier videos
 */
export async function inspectCompetitorChannel(session: ChannelSession, handleOrId: string) {
  const auth = await getAuthenticatedClient(session);
  const youtube = google.youtube({ version: 'v3', auth });

  const cleanQuery = handleOrId.replace('@', '').trim();

  // Try fetching by handle first (1 quota unit)
  let channelRes = await youtube.channels.list({
    part: ['snippet', 'statistics', 'contentDetails'],
    forHandle: cleanQuery,
  });

  // If handle lookup returns empty, try by channel ID
  if (!channelRes.data.items || channelRes.data.items.length === 0) {
    channelRes = await youtube.channels.list({
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [cleanQuery],
    });
  }

  const channel = channelRes.data.items?.[0];
  if (!channel) {
    throw new Error('Competitor channel not found');
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let topOutliers: any[] = [];

  if (uploadsPlaylistId) {
    // Fetch last 15 videos (1 quota unit)
    const playlistRes = await youtube.playlistItems.list({
      part: ['snippet', 'contentDetails'],
      playlistId: uploadsPlaylistId,
      maxResults: 15,
    });

    const videoIds = (playlistRes.data.items || [])
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length > 0) {
      // Fetch statistics for all 15 videos in 1 single batch call (1 quota unit)
      const vidsRes = await youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds,
      });

      const videoList = (vidsRes.data.items || []).map((v) => {
        const pubDate = new Date(v.snippet?.publishedAt || Date.now());
        const hoursAgo = Math.max(1, (Date.now() - pubDate.getTime()) / (1000 * 60 * 60));
        const views = parseInt(v.statistics?.viewCount || '0', 10);
        const vph = Math.round((views / hoursAgo) * 10) / 10;
        return {
          id: v.id,
          title: v.snippet?.title,
          thumbnail: v.snippet?.thumbnails?.default?.url,
          views,
          vph,
          publishedAt: v.snippet?.publishedAt,
        };
      });

      // Calculate channel baseline average VPH across recent uploads
      const avgVph =
        videoList.reduce((sum, item) => sum + item.vph, 0) / Math.max(1, videoList.length);

      // Flag videos with VPH > 1.5x average as "Outlier Hit"
      topOutliers = videoList
        .map((v) => ({
          ...v,
          isOutlier: v.vph > avgVph * 1.5 && v.vph > 5,
        }))
        .sort((a, b) => b.vph - a.vph)
        .slice(0, 5);
    }
  }

  return {
    channel: {
      id: channel.id,
      title: channel.snippet?.title,
      customUrl: channel.snippet?.customUrl,
      thumbnail: channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
      viewCount: channel.statistics?.viewCount,
    },
    topOutliers,
  };
}


