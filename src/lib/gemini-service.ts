import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIOptimizationInput {
  title: string;
  topic?: string;
  niche?: string;
  existingTags?: string[];
}

export async function generateAIOptimizations(input: AIOptimizationInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash which is permanently free tier
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are VidPulse's elite YouTube growth strategist and SEO specialist AI engine.
Analyze the following YouTube video concept:
- Original Title: "${input.title}"
- Topic/Niche: "${input.topic || input.niche || 'General YouTube'}"
- Current Tags: "${(input.existingTags || []).join(', ')}"

Provide a JSON response strictly matching this structure (no markdown formatting, just pure JSON):
{
  "highCtrTitles": [
    "Catchy, curiosity-driven title 1",
    "High-CTR title with numbers 2",
    "SEO-focused searchable title 3",
    "Emotional hook title 4",
    "Short viral title 5"
  ],
  "recommendedTags": [
    "tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"
  ],
  "optimizedDescription": "A compelling 2-3 paragraph SEO-optimized description with hashtags and placeholder timestamps.",
  "thumbnailConcept": "Visual description of a high-converting thumbnail layout, subject position, facial expression, and 3-word bold text overlay."
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    // Clean any accidental markdown code blocks
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      highCtrTitles: [
        `How To Master ${input.title} (Step-by-Step)`,
        `The Secret Truth About ${input.title}`,
        `Why Everyone Is Wrong About ${input.title}`,
        `Stop Doing This With ${input.title}`,
        `${input.title}: Don't Make This Mistake!`,
      ],
      recommendedTags: ['youtube growth', 'tutorial', 'seo', 'vidpulse', 'content creator'],
      optimizedDescription: `In this video, we dive deep into ${input.title}. Watch till the end to discover proven strategies.\n\nTimestamps:\n0:00 - Introduction\n1:15 - Core Strategy\n3:45 - Pro Tips\n\n#YouTubeGrowth #${input.title.replace(/\s+/g, '')}`,
      thumbnailConcept: 'Split screen with high contrast, vibrant foreground subject with emotional expression, and big bold text: "DON\'T DO THIS".',
    };
  }
}

export interface ChannelNicheContext {
  channelTitle: string;
  topVideoTitles: string[];
}

export async function generateDailyIdeas(context: ChannelNicheContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are VidPulse's "Daily Ideas" AI engine.
Given the channel "${context.channelTitle}" and its recent video concepts:
${context.topVideoTitles.map((t, idx) => `${idx + 1}. "${t}"`).join('\n')}

Generate 4 high-potential upcoming video ideas tailored for this audience.
Rate the prediction potential (Very High, High, Medium) and explain the hook.

Return strictly a JSON array without markdown wrapping:
[
  {
    "title": "Compelling video title",
    "potential": "Very High",
    "vphPrediction": "Top 10% expected velocity",
    "hookReason": "Why viewers will click and what curiosity gap this triggers"
  }
]
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      {
        title: `The 2026 Roadmap for ${context.channelTitle}`,
        potential: 'Very High',
        vphPrediction: 'Top 5% expected velocity',
        hookReason: 'Forward-looking roadmap videos exploit fear-of-missing-out (FOMO).',
      },
      {
        title: `5 Costly Mistakes Everyone Makes in ${context.channelTitle}`,
        potential: 'High',
        vphPrediction: 'Consistent long-tail search',
        hookReason: 'Loss aversion headlines outperform positive headlines by up to 34%.',
      },
      {
        title: `Why I Changed My Mind About ${context.topVideoTitles[0] || 'My Workflow'}`,
        potential: 'High',
        vphPrediction: 'High subscriber CTR',
        hookReason: 'Contrarian updates create immediate debate in comments.',
      },
      {
        title: `Beginner to Advanced in 30 Minutes: Complete Guide`,
        potential: 'Medium',
        vphPrediction: 'Evergreen search traffic',
        hookReason: 'High retention potential for viewers seeking comprehensive zero-fluff guides.',
      },
    ];
  }
}

