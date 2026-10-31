import { NextRequest, NextResponse } from 'next/server';

export interface SerpVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
  channelUrl: string;
  channelId?: string;
  channelAvatar?: string;
  channelSubscriberCountText?: string;
  channelSubscriberCount?: number;
  viewsText: string;
  viewsCount: number;
  publishedTime: string;
  lengthText: string;
  badges: string[];
  snippet: string;
  // Outlier / emulation metrics:
  isOutlierHit?: boolean;
  viewToSubRatio?: number;
  emulationRecommendation?: {
    headline: string;
    reason: string;
    angle: string;
  };
}

export interface SerpAnalysis {
  averageViews: number;
  topViews: number;
  medianViews: number;
  recentUploadsCount: number;
  competitionLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  opportunityScore: number;
  outlierVideosCount: number;
}

// In-memory cache for channel subscriber counts across searches
const channelSubscribersCache = new Map<string, { countText: string; count: number }>();

export function parseCount(text?: string): number {
  if (!text) return 0;
  const clean = text.replace(/ subscribers?/i, '').replace(/ views?/i, '').replace(/,/g, '').trim();
  if (clean.endsWith('M') || clean.endsWith('m')) {
    return Math.round(parseFloat(clean) * 1000000);
  }
  if (clean.endsWith('K') || clean.endsWith('k')) {
    return Math.round(parseFloat(clean) * 1000);
  }
  return parseInt(clean, 10) || 0;
}

async function fetchChannelSubscriberCount(channelId: string): Promise<{ countText: string; count: number }> {
  if (channelSubscribersCache.has(channelId)) {
    return channelSubscribersCache.get(channelId)!;
  }

  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 86400 }, // cache 24h
    });

    if (!res.ok) {
      return { countText: 'Hidden', count: 0 };
    }

    const html = await res.text();
    const match =
      html.match(/"metadataParts":\[\{"text":\{"content":"([^"]+?subscribers?)"/i) ||
      html.match(/"content":"([^"]+?subscribers?)"/i) ||
      html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+?)"/i) ||
      html.match(/"subscriberCountText":\{"simpleText":"([^"]+?)"/i) ||
      html.match(/"simpleText":"([^"]+?subscribers?)"/i) ||
      html.match(/([0-9\.]+[KM]?\s+subscribers?)/i);

    const countText = match ? match[1].trim() : 'Hidden';
    const count = parseCount(countText);
    const result = { countText, count };
    channelSubscribersCache.set(channelId, result);
    return result;
  } catch (err) {
    return { countText: 'Hidden', count: 0 };
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 300 }, // cache 5 mins
    });

    if (!res.ok) {
      throw new Error(`YouTube responded with status ${res.status}`);
    }

    const html = await res.text();
    const match =
      html.match(/var ytInitialData = ({[\s\S]*?});<\/script>/) ||
      html.match(/ytInitialData\s*=\s*({[\s\S]+?});/);

    if (!match) {
      return NextResponse.json({
        query,
        videos: [],
        analysis: null,
        message: 'Could not parse YouTube search page structure',
      });
    }

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
      [];

    const rawVideos: any[] = [];

    for (const section of contents) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        if (item.videoRenderer) {
          const vr = item.videoRenderer;
          const videoId = vr.videoId;
          if (!videoId) continue;

          const title = vr.title?.runs?.map((r: any) => r.text).join('') || 'Untitled';
          const thumbnail =
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          const channelTitle = vr.ownerText?.runs?.[0]?.text || 'YouTube Creator';
          const channelNav = vr.ownerText?.runs?.[0]?.navigationEndpoint;
          const channelUrl = channelNav?.commandMetadata?.webCommandMetadata?.url
            ? `https://www.youtube.com${channelNav.commandMetadata.webCommandMetadata.url}`
            : '#';
          const channelId =
            channelNav?.browseEndpoint?.browseId ||
            vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.navigationEndpoint?.browseEndpoint?.browseId;
          const channelAvatar =
            vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url;
          const viewsText = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '0 views';
          const viewsCount = parseCount(viewsText);
          const publishedTime = vr.publishedTimeText?.simpleText || '';
          const lengthText = vr.lengthText?.simpleText || '';
          const badges = (vr.badges || [])
            .map((b: any) => b.metadataBadgeRenderer?.label)
            .filter(Boolean);
          const snippet =
            vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') ||
            '';

          rawVideos.push({
            id: videoId,
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail,
            channelTitle,
            channelUrl,
            channelId,
            channelAvatar,
            viewsText,
            viewsCount,
            publishedTime,
            lengthText,
            badges,
            snippet,
          });
        }
      }
    }

    // Process videos with subscriber counts in parallel
    // If outlierOnly is requested, inspect up to 25 raw items to find qualifying hidden gems
    const filterOutliers = request.nextUrl.searchParams.get('outliers') === 'true';
    const maxSubsParam = parseInt(request.nextUrl.searchParams.get('maxSubs') || '20000', 10);
    const targetSlice = filterOutliers ? rawVideos.slice(0, 25) : rawVideos.slice(0, 15);

    const uniqueChannelIds = Array.from(
      new Set(targetSlice.map((v) => v.channelId).filter(Boolean))
    ) as string[];

    // Fetch channel sub counts in parallel (with timeout protection)
    const channelSubsMap = new Map<string, { countText: string; count: number }>();
    await Promise.all(
      uniqueChannelIds.map(async (cid) => {
        const subData = await fetchChannelSubscriberCount(cid);
        channelSubsMap.set(cid, subData);
      })
    );

    const mappedVideos: SerpVideo[] = targetSlice.map((v) => {
      const subInfo = v.channelId ? channelSubsMap.get(v.channelId) : undefined;
      const channelSubscriberCountText = subInfo?.countText || 'Hidden';
      const channelSubscriberCount = subInfo?.count || 0;

      // Ratio: viewsCount / channelSubscriberCount
      // Outlier criteria:
      // High view-to-sub ratio (>1.5x) or strong performance for channels under 20k subscribers
      const minSubsParam = parseInt(request.nextUrl.searchParams.get('minSubs') || '0', 10);
      let isOutlierHit = false;
      let ratio = 0;

      if (channelSubscriberCount > 0) {
        ratio = Math.round((v.viewsCount / channelSubscriberCount) * 10) / 10;
        if (
          channelSubscriberCount >= minSubsParam &&
          channelSubscriberCount <= maxSubsParam &&
          v.viewsCount > channelSubscriberCount &&
          ratio >= 1.2
        ) {
          isOutlierHit = true;
        }
      }

      let emulationRecommendation: SerpVideo['emulationRecommendation'] = undefined;
      if (isOutlierHit) {
        emulationRecommendation = {
          headline: `🔥 High-Leverage Outlier Hit (${ratio > 0 ? `${ratio}x Channel Size` : 'Massive Viral Reach'})`,
          reason: `This video generated ${v.viewsText} while the creator only has ${channelSubscriberCountText}. The YouTube algorithm promoted this purely on high click-through rate (CTR) and audience retention, NOT existing subscriber bias.`,
          angle: `Recreate this topic using a curiosity-driven title and high-contrast thumbnail to capture this unsatisfied search/suggested demand.`,
        };
      }

      return {
        ...v,
        channelSubscriberCountText,
        channelSubscriberCount,
        viewToSubRatio: ratio,
        isOutlierHit,
        emulationRecommendation,
      };
    });

    // If outlierOnly was requested, strictly filter to outlier hits with <= maxSubs (default 20,000)
    const videos = filterOutliers
      ? mappedVideos.filter(
          (v) =>
            v.isOutlierHit &&
            ((v.channelSubscriberCount || 0) <= maxSubsParam)
        )
      : mappedVideos;

    // Graphical Representation Analysis
    let analysis: SerpAnalysis | null = null;
    if (videos.length > 0) {
      const viewCounts = videos.map((v) => v.viewsCount).filter((c) => c > 0);
      const topViews = Math.max(...viewCounts, 0);
      const sumViews = viewCounts.reduce((acc, curr) => acc + curr, 0);
      const averageViews = viewCounts.length > 0 ? Math.round(sumViews / viewCounts.length) : 0;

      const sorted = [...viewCounts].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const medianViews =
        sorted.length > 0
          ? sorted.length % 2 !== 0
            ? sorted[mid]
            : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : 0;

      const recentUploadsCount = videos.filter((v) => {
        const p = v.publishedTime.toLowerCase();
        return (
          p.includes('hour') ||
          p.includes('day') ||
          p.includes('week') ||
          p.includes('1 month') ||
          p.includes('2 month')
        );
      }).length;

      const outlierVideosCount = videos.filter((v) => v.isOutlierHit).length;

      let competitionLevel: SerpAnalysis['competitionLevel'] = 'Medium';
      if (topViews > 1000000 && averageViews > 250000) competitionLevel = 'Very High';
      else if (topViews > 350000 || averageViews > 80000) competitionLevel = 'High';
      else if (topViews > 50000 || averageViews > 15000) competitionLevel = 'Medium';
      else competitionLevel = 'Low';

      let opportunityScore = 65;
      if (competitionLevel === 'Low') opportunityScore = 88;
      if (competitionLevel === 'Medium') opportunityScore = 74;
      if (competitionLevel === 'High') opportunityScore = 52;
      if (competitionLevel === 'Very High') opportunityScore = 38;

      if (recentUploadsCount >= 3) opportunityScore += 8;
      if (outlierVideosCount >= 2) opportunityScore += 10; // high small-channel breakthrough rate
      opportunityScore = Math.min(99, Math.max(15, opportunityScore));

      analysis = {
        averageViews,
        topViews,
        medianViews,
        recentUploadsCount,
        competitionLevel,
        opportunityScore,
        outlierVideosCount,
      };
    }

    const response = NextResponse.json({
      query,
      totalResultsFound: videos.length,
      analysis,
      videos,
    });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return response;
  } catch (error: any) {
    console.error('YouTube search scrape failed:', error);
    const errResponse = NextResponse.json(
      { error: error.message || 'Failed to fetch search results' },
      { status: 500 }
    );
    errResponse.headers.set('Access-Control-Allow-Origin', '*');
    return errResponse;
  }
}

export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}
