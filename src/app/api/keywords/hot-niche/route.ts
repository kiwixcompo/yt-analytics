import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRecentVideos } from '@/lib/youtube-service';

// Stop words that carry little search topic relevance
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'have', 'more',
  'what', 'when', 'where', 'which', 'who', 'how', 'video', 'youtube', 'channel',
  'watch', 'full', 'episode', 'official', 'review', 'part', 'best', '2025', '2026',
  'used', 'ings', 'leon', 'will', 'make', 'just', 'some', 'about', 'like', 'into',
  'after', 'before', 'first', 'last', 'only', 'very', 'than', 'them',
]);

export interface NicheHotKeyword {
  keyword: string;
  root: string;
  tag: string;
  volumeTier: 'huge' | 'large' | 'medium' | 'normal';
  searchScore: number; // 10 - 100 for visual tag cloud scaling
  isBreakout: boolean;
}

// Built-in categories (matching Google Trends taxonomy)
export const GOOGLE_TRENDS_NICHES: Record<string, { label: string; seeds: string[] }> = {
  channel: {
    label: 'My Channel Niche',
    seeds: [],
  },
  tech: {
    label: 'Tech & AI',
    seeds: [
      'artificial intelligence',
      'cursor ai',
      'deepseek',
      'nextjs 15',
      'claude 3.7',
      'python automation',
      'apple intelligence',
      'chatgpt',
    ],
  },
  gaming: {
    label: 'Gaming & Esports',
    seeds: [
      'gta 6 gameplay',
      'ps5 pro review',
      'unreal engine 5',
      'elden ring',
      'minecraft update',
      'fortnite',
      'roblox',
    ],
  },
  finance: {
    label: 'Finance & Business',
    seeds: [
      'passive income',
      'dividend investing',
      'crypto bull run',
      'side hustles 2026',
      'stock market',
      'high yield savings',
    ],
  },
  entertainment: {
    label: 'Entertainment & Pop',
    seeds: [
      'movie trailers 2026',
      'netflix series',
      'celebrity news',
      'box office review',
      'anime season',
    ],
  },
  productivity: {
    label: 'Productivity & Education',
    seeds: [
      'study with me',
      'notion setup',
      'time management',
      'morning routine',
      'learning to code',
    ],
  },
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
    const selectedNiche = request.nextUrl.searchParams.get('niche') || 'channel';

    let candidateRoots: string[] = [];
    let detectedNicheLabel = 'Channel Niche';

    // 1. If 'channel' selected (or default) and user has a channel session
    if (selectedNiche === 'channel' && session) {
      try {
        const recentVideos = await getRecentVideos(session, 20);
        if (recentVideos && recentVideos.length > 0) {
          const wordFreq: Record<string, number> = {};

          recentVideos.forEach((v: any) => {
            const rawWords = (v.title || '')
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, ' ')
              .split(/\s+/)
              .filter((w: string) => w.length > 3 && !STOP_WORDS.has(w));

            rawWords.forEach((w: string) => {
              wordFreq[w] = (wordFreq[w] || 0) + 1;
            });

            // Also check tags
            if (Array.isArray(v.tags)) {
              v.tags.forEach((tag: string) => {
                const clean = tag.toLowerCase().trim();
                if (clean.length > 3 && !STOP_WORDS.has(clean)) {
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
            detectedNicheLabel = `${session.channel.title || 'Channel'}`;
          }
        }
      } catch (err) {
        console.warn('Failed to parse channel recent videos for niche:', err);
      }
    }

    // 2. If explicit niche selected or channel extraction had insufficient tokens
    if (candidateRoots.length === 0 || selectedNiche !== 'channel') {
      const nicheConfig = GOOGLE_TRENDS_NICHES[selectedNiche] || GOOGLE_TRENDS_NICHES.tech;
      candidateRoots = nicheConfig.seeds;
      detectedNicheLabel = nicheConfig.label;
    }

    // 3. For each candidate root, query live autocomplete clusters to get currently hot search phrases
    const hotListP = candidateRoots.slice(0, 5).map(async (root) => {
      const suggestions = await fetchYouTubeAutocomplete(root);
      return {
        root,
        hotPhrases: suggestions.slice(0, 4),
      };
    });

    const gathered = await Promise.all(hotListP);

    // Flatten and compute visual tag-cloud metrics
    const finalKeywords: NicheHotKeyword[] = [];
    const seen = new Set<string>();

    // Add broad anchors first
    candidateRoots.slice(0, 3).forEach((r, idx) => {
      const clean = r.trim().toLowerCase();
      if (!seen.has(clean) && clean.length > 3) {
        seen.add(clean);
        finalKeywords.push({
          keyword: r,
          root: r,
          tag: '🔥 #1 Trending Anchor',
          volumeTier: 'huge',
          searchScore: 98 - idx * 5,
          isBreakout: true,
        });
      }
    });

    // Add live breakout autocomplete phrases
    gathered.forEach((item, catIdx) => {
      item.hotPhrases.forEach((phrase, idx) => {
        const clean = phrase.trim().toLowerCase();
        if (!seen.has(clean) && clean.length > 3) {
          seen.add(clean);

          let volumeTier: NicheHotKeyword['volumeTier'] = 'normal';
          let searchScore = Math.max(30, 85 - catIdx * 8 - idx * 10);
          let tag = 'Trending';

          if (idx === 0) {
            volumeTier = 'large';
            searchScore = 90 - catIdx * 4;
            tag = '⚡ Breakout';
          } else if (idx === 1) {
            volumeTier = 'medium';
            searchScore = 78 - catIdx * 4;
            tag = '🔥 Hot Now';
          }

          finalKeywords.push({
            keyword: phrase,
            root: item.root,
            tag,
            volumeTier,
            searchScore,
            isBreakout: idx < 2,
          });
        }
      });
    });

    // Sort by search score descending
    finalKeywords.sort((a, b) => b.searchScore - a.searchScore);

    return NextResponse.json({
      niche: detectedNicheLabel,
      selectedNicheKey: selectedNiche,
      availableNiches: Object.entries(GOOGLE_TRENDS_NICHES).map(([key, val]) => ({
        key,
        label: val.label,
      })),
      channelTitle: session?.channel?.title || null,
      keywords: finalKeywords.slice(0, 20),
    });
  } catch (error: any) {
    console.error('Hot niche keywords error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to detect hot niche keywords' },
      { status: 500 }
    );
  }
}
