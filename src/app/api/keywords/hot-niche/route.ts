import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRecentVideos } from '@/lib/youtube-service';

// Common stop words to strip out of channel topics
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'have', 'more',
  'what', 'when', 'where', 'which', 'who', 'how', 'video', 'youtube', 'channel',
  'watch', 'full', 'episode', 'official', 'review', 'part', 'best', '2025', '2026',
]);

// Standard high-velocity discovery buckets by broad niche category
const NICHE_FALLBACK_HOT_KEYWORDS: Record<string, string[]> = {
  tech: [
    'artificial intelligence',
    'cursor ai',
    'deepseek',
    'nextjs 15',
    'claude 3.7',
    'python automation',
    'apple intelligence',
    'web development',
  ],
  gaming: [
    'gta 6 gameplay',
    'ps5 pro review',
    'unreal engine 5',
    'elden ring dlc',
    'minecraft update',
    'fortnite season',
  ],
  finance: [
    'passive income 2026',
    'dividend investing',
    'crypto bull run',
    'side hustles',
    'high yield savings',
    'stock market crash',
  ],
  general: [
    'ai tools 2026',
    'breakthrough technology',
    'passive income',
    'productivity setup',
    'algorithm update',
    'viral case study',
  ],
};

async function fetchYouTubeAutocomplete(term: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&hl=en&gl=US&q=${encodeURIComponent(
      term
    )}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]) : [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const explicitNiche = request.nextUrl.searchParams.get('niche') || '';

    let candidateRoots: string[] = [];
    let detectedNicheLabel = 'Channel Niche';

    // 1. If user is signed in to a channel session, extract channel niche from recent video titles
    if (session) {
      try {
        const recentVideos = await getRecentVideos(session, 15);
        if (recentVideos && recentVideos.length > 0) {
          const wordFreq: Record<string, number> = {};

          recentVideos.forEach((v: any) => {
            const words = (v.title || '')
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));

            words.forEach((w: string) => {
              wordFreq[w] = (wordFreq[w] || 0) + 1;
            });

            // Also check tags
            if (Array.isArray(v.tags)) {
              v.tags.forEach((tag: string) => {
                const clean = tag.toLowerCase().trim();
                if (clean.length > 2 && !STOP_WORDS.has(clean)) {
                  wordFreq[clean] = (wordFreq[clean] || 0) + 2;
                }
              });
            }
          });

          // Sort by frequency
          const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word]) => word);

          if (topWords.length > 0) {
            candidateRoots = topWords;
            detectedNicheLabel = `${session.channel.title || 'Channel'} • Hot Trends`;
          }
        }
      } catch (err) {
        console.warn('Failed to parse channel recent videos for niche:', err);
      }
    }

    // 2. Fallbacks if no channel session or not enough recent videos
    if (candidateRoots.length === 0) {
      if (explicitNiche && NICHE_FALLBACK_HOT_KEYWORDS[explicitNiche.toLowerCase()]) {
        candidateRoots = NICHE_FALLBACK_HOT_KEYWORDS[explicitNiche.toLowerCase()];
        detectedNicheLabel = `${explicitNiche.toUpperCase()} Trending`;
      } else {
        candidateRoots = ['ai tools', 'coding tutorial', 'passive income', 'productivity', 'gta 6'];
        detectedNicheLabel = 'Trending Across YouTube';
      }
    }

    // 3. For each candidate root, query live autocomplete clusters to get currently hot search phrases
    const hotListP = candidateRoots.slice(0, 4).map(async (root) => {
      const suggestions = await fetchYouTubeAutocomplete(root);
      return {
        root,
        hotPhrases: suggestions.slice(0, 4),
      };
    });

    const gathered = await Promise.all(hotListP);

    // Flatten and deduplicate
    const finalKeywords: Array<{
      keyword: string;
      root: string;
      tag: string;
      isBreakout: boolean;
    }> = [];

    const seen = new Set<string>();

    // First add the high-level seed roots
    candidateRoots.slice(0, 3).forEach((r) => {
      if (!seen.has(r)) {
        seen.add(r);
        finalKeywords.push({
          keyword: r,
          root: r,
          tag: 'Broad Anchor',
          isBreakout: true,
        });
      }
    });

    // Then add the hot live autocomplete phrases
    gathered.forEach((item) => {
      item.hotPhrases.forEach((phrase, idx) => {
        if (!seen.has(phrase)) {
          seen.add(phrase);
          finalKeywords.push({
            keyword: phrase,
            root: item.root,
            tag: idx === 0 ? '🔥 Hot Now' : idx === 1 ? '⚡ Rising' : 'Trending',
            isBreakout: idx < 2,
          });
        }
      });
    });

    return NextResponse.json({
      niche: detectedNicheLabel,
      channelTitle: session?.channel?.title || null,
      keywords: finalKeywords.slice(0, 16),
    });
  } catch (error: any) {
    console.error('Hot niche keywords error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect hot niche keywords' },
      { status: 500 }
    );
  }
}
