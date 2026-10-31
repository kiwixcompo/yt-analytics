import { NextRequest, NextResponse } from 'next/server';

export interface AutocompleteItem {
  keyword: string;
  rank: number; // 1-based exact position as returned by YouTube
  branch?: string; // e.g. 'exact', 'a', 'b', etc.
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const deepScout = request.nextUrl.searchParams.get('deep') === 'true';

  if (!query || !query.trim()) {
    return NextResponse.json({
      query: '',
      results: [],
      total: 0,
    });
  }

  const cleanQuery = query.trim();

  // Helper to fetch live suggestions from YouTube's auto-suggest cluster
  const fetchYtSuggestions = async (searchTerm: string): Promise<string[]> => {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&hl=en&gl=US&q=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 1800 }, // 30-min edge cache
      });

      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data[1]) ? (data[1] as string[]) : [];
    } catch (e) {
      console.error(`Error fetching suggestions for "${searchTerm}":`, e);
      return [];
    }
  };

  try {
    // 1. Fetch exact root ranking suggestions (Rank 1 through 10-15)
    // We query both the query as-is and with a trailing space if not already present
    const primaryQueries = [cleanQuery];
    if (!cleanQuery.endsWith(' ')) {
      primaryQueries.push(`${cleanQuery} `);
    }

    const primaryResults = await Promise.all(primaryQueries.map((q) => fetchYtSuggestions(q)));
    
    // Combine preserving natural top-to-bottom ranking order
    const seen = new Set<string>();
    const rankedResults: AutocompleteItem[] = [];

    let rankCounter = 1;
    primaryResults.forEach((list) => {
      list.forEach((kw) => {
        const lower = kw.toLowerCase().trim();
        if (!seen.has(lower)) {
          seen.add(lower);
          rankedResults.push({
            keyword: kw,
            rank: rankCounter++,
            branch: 'top_rank',
          });
        }
      });
    });

    // 2. If Deep Scout is requested, expand with alphabetical wildcards (a-z) + question modifiers
    if (deepScout) {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const modifiers = ['for', 'without', 'vs', 'tutorial', '2026'];
      const expansionSeeds = [...alphabet.map((letter) => `${cleanQuery} ${letter}`), ...modifiers.map((m) => `${cleanQuery} ${m}`)];

      const branchResults = await Promise.all(expansionSeeds.map((term) => fetchYtSuggestions(term)));

      branchResults.forEach((list, idx) => {
        const seedTerm = expansionSeeds[idx];
        const branchLabel = seedTerm.replace(cleanQuery, '').trim();

        list.forEach((kw) => {
          const lower = kw.toLowerCase().trim();
          if (!seen.has(lower)) {
            seen.add(lower);
            rankedResults.push({
              keyword: kw,
              rank: rankCounter++,
              branch: branchLabel,
            });
          }
        });
      });
    }

    return NextResponse.json({
      query: cleanQuery,
      isDeepScout: deepScout,
      total: rankedResults.length,
      results: rankedResults,
    });
  } catch (err: any) {
    console.error('YouTube autocomplete API error:', err);
    return NextResponse.json({ error: 'Failed to fetch YouTube autocomplete data' }, { status: 500 });
  }
}
