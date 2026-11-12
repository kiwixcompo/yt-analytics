import { NextRequest, NextResponse } from 'next/server';

export interface DugKeywordItem {
  keyword: string;
  matchType: 'exact' | 'similar';
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High' | 'Very High';
  overallScore: number;
  opportunityScore: number;
  trend: 'up' | 'stable';
}

function computeMetrics(kw: string, index: number, isExact: boolean): DugKeywordItem {
  let hash = 0;
  for (let i = 0; i < kw.length; i++) {
    hash = (hash << 5) - hash + kw.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const wordCount = kw.trim().split(/\s+/).length;

  const baseVolume = Math.max(1500, Math.floor(4500000 / Math.pow(index + 1.2, 1.3)));
  const variation = (absHash % 40) - 20;
  const searchVolume = Math.round(baseVolume * (1 + variation / 100));

  let compNum = 85 - wordCount * 11 + (absHash % 15);
  compNum = Math.max(20, Math.min(95, compNum));

  let competition: DugKeywordItem['competition'] = 'Medium';
  if (compNum > 75) competition = 'Very High';
  else if (compNum > 55) competition = 'High';
  else if (compNum > 35) competition = 'Medium';
  else competition = 'Low';

  const volScore = Math.min(100, Math.round((Math.log10(searchVolume) / 7) * 100));
  const compPenalty = compNum * 0.45;
  const overallScore = Math.max(25, Math.min(98, Math.round(volScore * 0.75 - compPenalty + 25)));
  const opportunityScore = Math.max(1, Math.min(100, Math.round(volScore * 1.2 - compNum * 0.6)));

  return {
    keyword: kw,
    matchType: isExact ? 'exact' : 'similar',
    searchVolume,
    competition,
    overallScore,
    opportunityScore,
    trend: absHash % 3 === 0 ? 'up' : 'stable',
  };
}

async function fetchSuggestions(q: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&hl=en&gl=US&q=${encodeURIComponent(
      q
    )}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
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
  const query = request.nextUrl.searchParams.get('q');
  const mode = request.nextUrl.searchParams.get('mode') || 'all'; // 'exact' | 'similar' | 'all'

  if (!query || !query.trim()) {
    return NextResponse.json({ query: '', results: [] });
  }

  const cleanQuery = query.trim().toLowerCase();

  try {
    // 1. Gather deep search suggestions using wildcard, suffixes, and questions
    const prefixes = ['', 'how to ', 'best ', 'top ', 'why '];
    const letters = ['a', 'b', 'c', 'd', 'e', 'vs', 'tips', 'guide', 'tutorial'];

    const promises = [
      ...prefixes.map((p) => fetchSuggestions(`${p}${cleanQuery}`)),
      ...letters.map((l) => fetchSuggestions(`${cleanQuery} ${l}`)),
    ];

    const results = await Promise.all(promises);
    const flattened = Array.from(new Set(results.flat().map((s) => s.trim()))).filter(Boolean);

    // 2. Classify keywords into:
    // - Exact match: contains the exact search phrase within it (e.g. "python tutorial for beginners" contains "python tutorial")
    // - Similar/Semantic match: covers related topic/words but does not contain the literal exact sequence
    const exactMatches: string[] = [];
    const similarMatches: string[] = [];

    flattened.forEach((kw) => {
      const lower = kw.toLowerCase();
      if (lower.includes(cleanQuery)) {
        exactMatches.push(kw);
      } else {
        // Must share at least one meaningful root token (>3 letters)
        const queryWords = cleanQuery.split(/\s+/).filter((w) => w.length > 3);
        const matchesWord = queryWords.some((w) => lower.includes(w));
        if (matchesWord || queryWords.length === 0) {
          similarMatches.push(kw);
        }
      }
    });

    let finalExact = exactMatches.map((kw, i) => computeMetrics(kw, i, true));
    let finalSimilar = similarMatches.map((kw, i) => computeMetrics(kw, i, false));

    let combined: DugKeywordItem[] = [];
    if (mode === 'exact') {
      combined = finalExact;
    } else if (mode === 'similar') {
      combined = finalSimilar;
    } else {
      combined = [...finalExact, ...finalSimilar];
    }

    return NextResponse.json({
      query: cleanQuery,
      totalExact: finalExact.length,
      totalSimilar: finalSimilar.length,
      results: combined,
    });
  } catch (err: any) {
    console.error('Dig API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dig into keyword' },
      { status: 500 }
    );
  }
}
