import { NextRequest, NextResponse } from 'next/server';
import { SerpVideo } from '../search/route';

interface SimilarOutliersRequest {
  videoId?: string;
  title: string;
  channelId?: string;
  topic?: string;
  mode?: 'outlier_exact' | 'topic_semantic';
  subRange?: string; // "0-1k", "1k-5k", "5k-10k", "10k-20k", "20k-50k", "under-100k", "all"
}

// Clean title to extract primary subject keywords
function extractSearchKeywords(title: string): string[] {
  const clean = title
    .replace(/[|•–—\-_:()\[\]!?#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Common stop words to exclude
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'how', 'why', 'what', 'who', 'when', 'where', 'is', 'are', 'was', 'were', 'be', 'been',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'their', 'our',
    'this', 'that', 'these', 'those', 'video', 'watch', 'new', 'latest', 'vs', 'here'
  ]);

  const words = clean
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  const queries: string[] = [];
  if (words.length >= 2) {
    queries.push(words.slice(0, 3).join(' '));
  }
  if (words.length >= 4) {
    queries.push(words.slice(1, 4).join(' '));
  }
  queries.push(words.slice(0, 2).join(' '));

  return Array.from(new Set(queries.filter(Boolean)));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || '';
    const videoId = searchParams.get('videoId') || '';
    const mode = (searchParams.get('mode') as 'outlier_exact' | 'topic_semantic') || 'outlier_exact';
    const subRange = searchParams.get('subRange') || '';
    const topic = searchParams.get('topic') || '';

    if (!title && !topic) {
      return NextResponse.json(
        { error: 'title or topic is required to find similar videos' },
        { status: 400 }
      );
    }

    const seedTitle = title || topic;
    const searchQueries = extractSearchKeywords(seedTitle);
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';

    // Search query permutations to find matching competitors & outliers
    const primarySearchTerm = searchQueries[0] || seedTitle;
    const searchUrl = new URL(`${protocol}://${host}/api/youtube/search`);
    searchUrl.searchParams.set('q', primarySearchTerm);
    
    if (mode === 'outlier_exact') {
      searchUrl.searchParams.set('outliers', 'true');
    }
    if (subRange && subRange !== 'all') {
      searchUrl.searchParams.set('subRange', subRange);
    }

    const searchRes = await fetch(searchUrl.toString());
    const searchData = await searchRes.json();

    let videos: SerpVideo[] = searchData.videos || [];

    // Filter out the origin video itself
    if (videoId) {
      videos = videos.filter((v) => v.id !== videoId);
    }

    // If outlier_exact mode, sort by highest view-to-sub ratio
    if (mode === 'outlier_exact') {
      videos.sort((a, b) => (b.viewToSubRatio || 0) - (a.viewToSubRatio || 0));
    }

    return NextResponse.json({
      origin: {
        videoId,
        title: seedTitle,
        mode,
        subRange: subRange || 'any',
      },
      matchedQuery: primarySearchTerm,
      totalSimilarFound: videos.length,
      similarVideos: videos.slice(0, 15),
    });
  } catch (err: any) {
    console.error('Similar videos search failed:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to search similar videos' },
      { status: 500 }
    );
  }
}
