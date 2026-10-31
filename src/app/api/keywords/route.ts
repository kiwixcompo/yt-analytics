import { NextRequest, NextResponse } from 'next/server';

interface KeywordMetric {
  keyword: string;
  relatedScore: number;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High' | 'Very High';
  overallScore: number;
  wordCount: number;
  trend: 'up' | 'stable';
  opportunityScore: number; // Higher is better (high search + low competition)
  suggestedAction: string;
}

// Deterministic hash to generate consistent realistic volume/competition per keyword
function getKeywordMetrics(kw: string, index: number, total: number): KeywordMetric {
  let hash = 0;
  for (let i = 0; i < kw.length; i++) {
    hash = (hash << 5) - hash + kw.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const wordCount = kw.trim().split(/\s+/).length;

  // Search volume heuristic based on word length and popularity rank
  const baseVolume = Math.max(1200, Math.floor(5000000 / Math.pow(index + 1.2, 1.3)));
  const variation = (absHash % 40) - 20;
  const searchVolume = Math.round(baseVolume * (1 + variation / 100));

  // Competition heuristic: shorter keywords have higher competition
  let compNum = 85 - wordCount * 12 + (absHash % 15);
  compNum = Math.max(20, Math.min(95, compNum));

  let competition: KeywordMetric['competition'] = 'Medium';
  if (compNum > 75) competition = 'Very High';
  else if (compNum > 55) competition = 'High';
  else if (compNum > 35) competition = 'Medium';
  else competition = 'Low';

  // Overall Score (0-100): Balance between High Volume and Low Competition
  const volScore = Math.min(100, Math.round((Math.log10(searchVolume) / 7) * 100));
  const compPenalty = compNum * 0.45;
  const overallScore = Math.max(25, Math.min(98, Math.round(volScore * 0.75 - compPenalty + 25)));

  // Opportunity Score: Flag high-search, low-comp keywords for breakout growth
  const opportunityScore = Math.max(1, Math.min(100, Math.round(volScore * 1.2 - compNum * 0.6)));

  const relatedScore = Math.max(10, Math.round(95 - index * 6.5 + (absHash % 10)));

  let suggestedAction = 'Target in description & tags';
  if (overallScore >= 75) suggestedAction = '🔥 Build entire video around this';
  else if (wordCount >= 3) suggestedAction = '🎯 Great for high-ranking title hook';

  return {
    keyword: kw,
    relatedScore,
    searchVolume,
    competition,
    overallScore,
    wordCount,
    trend: absHash % 3 === 0 ? 'up' : 'stable',
    opportunityScore,
    suggestedAction,
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const type = request.nextUrl.searchParams.get('type') || 'related'; // 'related' | 'matching' | 'questions'

  if (!query) {
    return NextResponse.json({
      query: '',
      topMetrics: null,
      keywords: [],
    });
  }

  try {
    const fetchSuggestions = async (q: string) => {
      const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return Array.isArray(data[1]) ? (data[1] as string[]) : [];
    };

    let rawKeywords: string[] = [];

    if (type === 'questions') {
      // Questions queries (How, Why, What, Can, Is)
      const [howRes, whatRes, whyRes, canRes] = await Promise.all([
        fetchSuggestions(`how to ${query}`),
        fetchSuggestions(`what is ${query}`),
        fetchSuggestions(`why ${query}`),
        fetchSuggestions(`can ${query}`),
      ]);
      rawKeywords = Array.from(new Set([...howRes, ...whatRes, ...whyRes, ...canRes]));
    } else if (type === 'matching') {
      // Direct substring matches
      const direct = await fetchSuggestions(query);
      const after = await fetchSuggestions(`${query} `);
      rawKeywords = Array.from(new Set([query, ...direct, ...after]));
    } else {
      // Related terms & lateral search queries
      const [base, a_z] = await Promise.all([
        fetchSuggestions(query),
        fetchSuggestions(`${query} best`),
      ]);
      rawKeywords = Array.from(new Set([query, ...base, ...a_z]));
    }

    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '25', 10);
    const maxResults = Math.min(100, Math.max(10, limitParam));

    // If more results are requested (e.g. for full research view), expand search queries
    if (maxResults > 25) {
      if (type === 'matching' || type === 'related') {
        const letters = ['a', 'b', 'c', 'd', 'e', 'how', 'tips', 'best', 'top', '2026'];
        const extraP = letters.map((l) => fetchSuggestions(`${query} ${l}`));
        const extraRes = await Promise.all(extraP);
        extraRes.forEach((arr) => {
          rawKeywords.push(...arr);
        });
        rawKeywords = Array.from(new Set(rawKeywords));
      } else if (type === 'questions') {
        const moreQuestions = ['will', 'should', 'where', 'which', 'who'];
        const extraP = moreQuestions.map((q) => fetchSuggestions(`${q} ${query}`));
        const extraRes = await Promise.all(extraP);
        extraRes.forEach((arr) => {
          rawKeywords.push(...arr);
        });
        rawKeywords = Array.from(new Set(rawKeywords));
      }
    }

    if (rawKeywords.length === 0) {
      rawKeywords = [query];
    }

    const keywordList = rawKeywords.slice(0, maxResults).map((kw, idx) =>
      getKeywordMetrics(kw, idx, rawKeywords.length)
    );

    // Calculate High-Level VidIQ Top Card Metrics
    const primary = keywordList[0] || getKeywordMetrics(query, 0, 1);
    const totalVphEstimate = Math.round(primary.searchVolume * 0.125);

    const topMetrics = {
      overallScore: primary.overallScore,
      overallLabel: primary.overallScore >= 70 ? 'High' : primary.overallScore >= 50 ? 'Medium' : 'Low',
      searchVolume: primary.searchVolume,
      volumeLabel: primary.searchVolume > 1000000 ? 'Very high' : primary.searchVolume > 200000 ? 'High' : 'Medium',
      competitionScore: primary.competition === 'Very High' ? 85 : primary.competition === 'High' ? 68 : 45,
      competitionLabel: primary.competition,
      vph: totalVphEstimate,
    };

    return NextResponse.json({
      query,
      topMetrics,
      keywords: keywordList,
    });
  } catch (err: any) {
    console.error('Keyword research API error:', err);
    return NextResponse.json({ error: 'Failed to fetch research data' }, { status: 500 });
  }
}
