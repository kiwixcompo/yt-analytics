import { NextRequest, NextResponse } from 'next/server';

export interface TrendSuggestRequest {
  category?: string;
  geo?: string;
  timeframe?: string;
  property?: string;
}

// Category-specific seed anchors to query YouTube live search index
const CATEGORY_SEARCH_SEEDS: Record<string, string[]> = {
  'Computers & Electronics': [
    'laptop',
    'nvidia rtx',
    'apple macbook',
    'smartphones',
    'pc build',
    'gadgets 2026',
    'ai hardware',
  ],
  'Internet & Telecom': [
    'starlink',
    '5g internet',
    'wifi 7',
    'vpn review',
    'cybersecurity tools',
    'esim setup',
  ],
  'Games': [
    'gta 6',
    'ps5 pro',
    'game trailer 2026',
    'minecraft update',
    'unreal engine 5',
    'pc gaming',
  ],
  'Science': [
    'spacex starship',
    'artificial intelligence',
    'quantum computing',
    'deepseek ai',
    'james webb telescope',
    'fusion energy',
  ],
  'Business & Industrial': [
    'passive income',
    'ai automation agency',
    'investing for beginners',
    'stocks to buy 2026',
    'side hustles',
    'real estate investing',
  ],
  'All Categories': [
    'trending now',
    'ai tools 2026',
    'viral review',
    'breakthrough technology',
    'top gadget',
    'productivity hacks',
  ],
};

const CATEGORY_DEFAULT_TOPICS: Record<string, string[]> = {
  'Computers & Electronics': [
    'Nvidia RTX 5090 review',
    'M4 MacBook Pro setup',
    'iPhone 17 leaks',
    'AI chips benchmark',
    'Samsung Galaxy S25 Ultra',
    'OLED gaming monitor 2026',
    'Best budget laptop 2026',
  ],
  'Internet & Telecom': [
    'Starlink Mini real world speed test',
    'Wi-Fi 7 router setup guide',
    '5G home internet vs fiber',
    'Best VPNs for privacy 2026',
    'Cybersecurity tools for creators',
    'Travel eSIM comparison',
  ],
  'Games': [
    'GTA 6 trailer breakdown & details',
    'PlayStation 5 Pro gameplay review',
    'Unreal Engine 5 games 2026',
    'Minecraft update secrets',
    'Elden Ring DLC build guide',
    'Best gaming PC build 2026',
    'Upcoming indie games 2026',
  ],
  'Science': [
    'SpaceX Starship orbital test flight',
    'DeepSeek AI architecture explained',
    'Quantum computing breakthrough',
    'James Webb telescope new discoveries',
    'Nuclear fusion energy test results',
    'Humane AI pin vs Rabbit R1 update',
  ],
  'Business & Industrial': [
    'AI automation agency step-by-step',
    'Passive income ideas 2026',
    'S&P 500 index fund investing',
    'High income skills for 2026',
    'Real estate investing for beginners',
    'Best online businesses to start',
  ],
  'All Categories': [
    'Top viral videos this week',
    'Artificial Intelligence tools 2026',
    'Best productivity workflow hacks',
    'New tech innovations 2026',
    'Creator economy monetization',
    'Tech gadgets that are actually worth it',
  ],
};

async function fetchYouTubeAutocomplete(query: string, gl = 'US'): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&gl=${encodeURIComponent(
      gl
    )}&hl=en&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data[1]) ? (data[1] as string[]) : [];
  } catch (err) {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TrendSuggestRequest;
    const {
      category = 'Computers & Electronics',
      geo = 'US',
      timeframe = 'today 3-m',
      property = 'youtube',
    } = body;

    const gl = geo === 'GLOBAL' ? 'US' : geo;
    const seeds = CATEGORY_SEARCH_SEEDS[category] || CATEGORY_SEARCH_SEEDS['All Categories'];
    const fallbackTopics = CATEGORY_DEFAULT_TOPICS[category] || CATEGORY_DEFAULT_TOPICS['All Categories'];

    // 1. Query YouTube autocomplete across category seeds in parallel
    const autocompletePromises = seeds.slice(0, 4).map((s) => fetchYouTubeAutocomplete(s, gl));
    const results = await Promise.all(autocompletePromises);
    const flattened = results.flat();

    // 2. Try Groq AI synthesis if available to curate high-velocity keywords
    let aiSuggestions: string[] = [];
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'user',
                content: `You are a YouTube SEO keyword analyst. For the category "${category}" in region "${geo}" (timeframe: ${timeframe}), generate 8 high-velocity, specific search queries that are actively trending right now on YouTube search. Return strictly a JSON array of strings: ["term 1", "term 2", ...]`,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              aiSuggestions = parsed;
            } else if (Array.isArray(parsed.queries || parsed.terms || parsed.suggestions)) {
              aiSuggestions = parsed.queries || parsed.terms || parsed.suggestions;
            }
          }
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    // Combine AI terms, live YouTube autocomplete terms, and curated fallback topics
    const combined = Array.from(
      new Set([
        ...aiSuggestions.map((t) => t.trim()),
        ...flattened.map((t) => t.trim()),
        ...fallbackTopics,
      ])
    ).filter((t) => t.length > 2 && t.length < 60);

    const suggestions = combined.slice(0, 8);

    return NextResponse.json({
      category,
      geo,
      timeframe,
      property,
      suggestions,
    });
  } catch (err: any) {
    console.error('Suggest trends error:', err);
    return NextResponse.json(
      {
        category: 'All Categories',
        suggestions: [
          'Artificial Intelligence tools 2026',
          'Nvidia RTX 5090 review',
          'GTA 6 gameplay trailer',
          'Starlink Mini setup',
          'Passive income ideas 2026',
          'SpaceX Starship orbital flight',
        ],
      },
      { status: 200 }
    );
  }
}
