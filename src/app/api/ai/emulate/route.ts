import { NextRequest, NextResponse } from 'next/server';
import { executeWithFallback } from '@/lib/ai-service';

export interface EmulateRequest {
  videoTitle: string;
  channelTitle: string;
  viewsText: string;
  subscribersText: string;
  ratio: number;
  publishedTime: string;
  snippet?: string;
  provider?: 'huggingface' | 'groq' | 'auto';
}

const SYSTEM_PROMPT_EMULATE = `
You are a master YouTube viral strategist and growth consultant (VidIQ expert level).
You specialize in analyzing "Outlier Breakthrough Videos" — videos where small creators exploded in views relative to their channel size, beating YouTube's algorithm without an existing subscriber base.

Analyze the provided outlier video and return strictly valid JSON matching this schema:
{
  "whyItWorked": [
    "Specific reason 1 (psychological curiosity, high-stakes promise, broad-appeal vs niche)",
    "Specific reason 2 (packaging, search intent, title formatting)",
    "Specific reason 3 (retention hook or unmet community demand)"
  ],
  "curiosityGapAngle": "Concise 1-sentence breakdown of the curiosity gap or emotional trigger.",
  "emulationTitles": [
    {
      "category": "Entertainment",
      "title": "Title with high intrigue under 65 chars"
    },
    {
      "category": "Solution to a problem",
      "title": "Clear tutorial / fix title under 65 chars"
    },
    {
      "category": "Thought provoking",
      "title": "Contrarian or bold question title under 65 chars"
    }
  ],
  "thumbnailConcept": {
    "visualLayout": "Clear visual blueprint: what subject is on left vs right, facial expression, color palette",
    "boldTextOverlay": "2-3 words maximum in all caps (e.g., 'DON\\'T DO THIS')",
    "visualContrastTrick": "Specific visual cue that stops scrolling in the feed"
  },
  "first60SecondsScript": "Word-for-word script hook to eliminate drop-off and retain 70%+ audience past the 30s mark.",
  "strategicTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"]
}
`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EmulateRequest;
    const { videoTitle, channelTitle, viewsText, subscribersText, ratio, publishedTime, snippet, provider } = body;

    if (!videoTitle) {
      return NextResponse.json({ error: 'Video title is required' }, { status: 400 });
    }

    const prompt = `
Analyze this YouTube Outlier Hit:
- Target Video Title: "${videoTitle}"
- Creator Channel: "${channelTitle}"
- Creator Channel Size: ${subscribersText || 'Small Creator'}
- Video View Count: ${viewsText} (${ratio > 0 ? `${ratio}x channel size ratio` : 'Massive outlier'})
- Published: ${publishedTime || 'Recent'}
- Description Snippet: "${snippet || 'None'}"

Explain why this specific video broke out of this small channel's subscriber baseline and provide a concrete blueprint to emulate its success.
`;

    const { text, activeProvider } = await executeWithFallback(
      prompt,
      SYSTEM_PROMPT_EMULATE,
      provider || 'auto'
    );

    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      ...parsed,
      activeProvider,
    });
  } catch (err: any) {
    console.error('Emulation blueprint generation error:', err);

    // Heuristics fallback
    const { videoTitle, ratio, viewsText, subscribersText } = await request.clone().json().catch(() => ({}));
    return NextResponse.json({
      whyItWorked: [
        `High View-to-Sub Ratio (${ratio || 2.5}x): The YouTube recommendation engine favored this video's high CTR over the creator's subscriber size.`,
        'Specific, high-stakes curiosity gap that appealed to both beginners and intermediate viewers.',
        'Timely title structure addressing an immediate need or high-trending workflow.',
      ],
      curiosityGapAngle: `Combines a concrete promise (${videoTitle}) with high perceived payoff in minimal time.`,
      emulationTitles: [
        {
          category: 'Entertainment',
          title: `I Rebuilt ${videoTitle.slice(0, 35)} in 24 Hours`,
        },
        {
          category: 'Solution to a problem',
          title: `How To Master ${videoTitle.slice(0, 35)} (Step by Step)`,
        },
        {
          category: 'Thought provoking',
          title: `Stop Making This Huge Mistake with ${videoTitle.slice(0, 30)}`,
        },
      ],
      thumbnailConcept: {
        visualLayout: 'Split comparison layout: Problem on left (dim/red tint), Solution on right (bright green/blue glow).',
        boldTextOverlay: 'IT FINALLY WORKS',
        visualContrastTrick: 'High saturation red arrow pointing to the most critical detail.',
      },
      first60SecondsScript: `Most creators overcomplicate ${videoTitle.slice(0, 30)}. In the next 8 minutes, I\'m going to show you the exact system that took this from zero to results, with zero filler. Let\'s get right into it.`,
      strategicTags: ['youtube growth', 'tutorial', 'breakthrough', 'viral video strategy', 'content creator'],
      activeProvider: 'Heuristics Fallback',
    });
  }
}
