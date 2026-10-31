export type AIProvider = 'huggingface' | 'groq' | 'auto';

export interface AIOptimizationInput {
  title: string;
  topic?: string;
  niche?: string;
  existingTags?: string[];
  provider?: AIProvider;
}

export interface ChannelNicheContext {
  channelTitle: string;
  topVideoTitles: string[];
  provider?: AIProvider;
}

const SYSTEM_PROMPT_TITLES = `
You are VidPulse's elite YouTube growth strategist and SEO specialist engine.
Analyze the video concept and return strictly valid JSON (no markdown formatting, no code blocks):

MANDATORY TITLE RULE:
Every proposed title in "highCtrTitles" must clearly fit into one of these 3 specific categories:
1. Entertainment (curiosity gap, humor, drama, or high stakes challenge)
2. Solution to a problem (practical fix, tutorial step, or clear workflow solution)
3. Thought provoking (challenging conventional wisdom, contrarian question, or debate)

{
  "highCtrTitles": [
    {
      "category": "Entertainment",
      "title": "High curiosity, entertaining title under 65 chars"
    },
    {
      "category": "Solution to a problem",
      "title": "Direct problem-solving actionable title under 65 chars"
    },
    {
      "category": "Thought provoking",
      "title": "Challenging question or contrarian perspective title under 65 chars"
    }
  ],
  "recommendedTags": [
    "tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"
  ],
  "optimizedDescription": "A compelling 2-3 paragraph SEO-optimized description with hashtags and placeholder timestamps.",
  "thumbnailConcept": "Visual description of a high-converting thumbnail layout, subject position, facial expression, and 3-word bold text overlay."
}
`;

const SYSTEM_PROMPT_IDEAS = `
You are VidPulse's "Daily Ideas" AI engine.
Generate 4 high-potential upcoming video ideas tailored for the channel.
Rate the prediction potential (Very High, High, Medium) and explain the hook.

Return strictly a JSON array without markdown wrapping or code blocks:
[
  {
    "title": "Compelling video title",
    "potential": "Very High",
    "vphPrediction": "Top 10% expected velocity",
    "hookReason": "Why viewers will click and what curiosity gap this triggers"
  }
]
`;

/**
 * Call Hugging Face Serverless Inference API (Free Open-Source Models)
 * Uses Qwen/Qwen2.5-72B-Instruct or meta-llama/Llama-3.1-8B-Instruct
 */
async function callHuggingFace(
  prompt: string,
  systemPrompt: string,
  modelName = 'Qwen/Qwen2.5-72B-Instruct'
) {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) {
    throw new Error('HUGGINGFACE_API_KEY (or HF_TOKEN) is not configured in .env.local');
  }

  // Hugging Face chat completion endpoint (OpenAI compatible)
  const res = await fetch(`https://api-inference.huggingface.co/models/${modelName}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hfToken}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Hugging Face API failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call Groq Cloud API (Free Tier: 14,400 requests/day, 500+ tokens/sec)
 */
async function callGroq(prompt: string, systemPrompt: string, modelName = 'openai/gpt-oss-120b') {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured in .env.local');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Groq request failed: ${res.status} ${errorBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Universal AI Dispatcher: Groq Cloud + Hugging Face Serverless with Auto-Fallback
 */
export async function executeWithFallback(
  prompt: string,
  systemPrompt: string,
  preferredProvider: AIProvider = 'auto'
): Promise<{ text: string; activeProvider: string }> {
  // If user explicitly chose Groq
  if (preferredProvider === 'groq') {
    try {
      const text = await callGroq(prompt, systemPrompt);
      return { text, activeProvider: 'Groq Cloud (GPT-OSS 120B)' };
    } catch (err: any) {
      console.warn('Groq failed, trying Hugging Face Serverless fallback:', err.message);
      const text = await callHuggingFace(prompt, systemPrompt);
      return { text, activeProvider: 'Hugging Face Serverless (Fallback)' };
    }
  }

  // If user explicitly chose Hugging Face
  if (preferredProvider === 'huggingface') {
    try {
      const text = await callHuggingFace(prompt, systemPrompt);
      return { text, activeProvider: 'Hugging Face Serverless (Qwen 2.5 72B)' };
    } catch (err: any) {
      console.warn('Hugging Face failed, trying Groq fallback:', err.message);
      const text = await callGroq(prompt, systemPrompt);
      return { text, activeProvider: 'Groq Cloud (Fallback)' };
    }
  }

  // Auto Mode: Try Groq first for blazing speed. If exhausted or down, fallback to Hugging Face
  try {
    const text = await callGroq(prompt, systemPrompt);
    return { text, activeProvider: 'Groq Cloud (GPT-OSS 120B Auto)' };
  } catch (groqErr: any) {
    try {
      console.warn('Auto mode switching to Hugging Face Serverless:', groqErr.message);
      const text = await callHuggingFace(prompt, systemPrompt);
      return { text, activeProvider: 'Hugging Face Serverless (Auto)' };
    } catch (hfErr: any) {
      throw new Error(`Both Groq and Hugging Face failed. Groq: ${groqErr.message} | HF: ${hfErr.message}`);
    }
  }
}

/**
 * High-CTR Title, Tag & Thumbnail Optimization Engine
 */
export async function generateAIOptimizations(input: AIOptimizationInput) {
  const prompt = `
Analyze the following YouTube video concept:
- Original Title: "${input.title}"
- Topic/Niche: "${input.topic || input.niche || 'General YouTube'}"
- Current Tags: "${(input.existingTags || []).join(', ')}"
`;

  try {
    const { text, activeProvider } = await executeWithFallback(
      prompt,
      SYSTEM_PROMPT_TITLES,
      input.provider || 'auto'
    );
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { ...parsed, activeProvider };
  } catch (error: any) {
    console.warn('AI Generation warning, returning heuristics:', error.message);
    return {
      highCtrTitles: [
        {
          category: 'Entertainment',
          title: `I Tested ${input.title} For 7 Days (Chaos)`,
        },
        {
          category: 'Solution to a problem',
          title: `How To Fix the Most Common ${input.title} Issues (Fast)`,
        },
        {
          category: 'Thought provoking',
          title: `Why Everything You Know About ${input.title} Is Wrong`,
        },
      ],
      recommendedTags: ['youtube growth', 'tutorial', 'seo', 'vidpulse', 'content creator'],
      optimizedDescription: `In this video, we dive deep into ${input.title}. Watch till the end to discover proven strategies.\n\nTimestamps:\n0:00 - Introduction\n1:15 - Core Strategy\n3:45 - Pro Tips\n\n#YouTubeGrowth #${input.title.replace(/\s+/g, '')}`,
      thumbnailConcept: 'Split screen with high contrast, vibrant foreground subject with emotional expression, and big bold text: "DON\'T DO THIS".',
      activeProvider: 'Heuristics Fallback (Check Groq or Hugging Face key)',
    };
  }
}

/**
 * VidPulse Daily Ideas Generator
 */
export async function generateDailyIdeas(context: ChannelNicheContext) {
  const prompt = `
Given the channel "${context.channelTitle}" and its recent video concepts:
${context.topVideoTitles.map((t, idx) => `${idx + 1}. "${t}"`).join('\n')}

Generate 4 high-potential upcoming video ideas tailored for this audience.
`;

  try {
    const { text, activeProvider } = await executeWithFallback(
      prompt,
      SYSTEM_PROMPT_IDEAS,
      context.provider || 'auto'
    );
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let ideas = JSON.parse(cleaned);
    // If response was wrapped in an object like { ideas: [...] }
    if (!Array.isArray(ideas) && ideas.ideas) {
      ideas = ideas.ideas;
    }
    return { ideas, activeProvider };
  } catch (error: any) {
    console.warn('Daily Ideas warning, returning heuristics:', error.message);
    return {
      ideas: [
        {
          title: `The Complete 2026 Guide to ${context.channelTitle}`,
          potential: 'Very High',
          vphPrediction: 'Top 5% expected velocity',
          hookReason: 'Forward-looking roadmap videos exploit FOMO and curiosity.',
        },
        {
          title: `5 Costly Mistakes Everyone Makes in ${context.channelTitle}`,
          potential: 'High',
          vphPrediction: 'Consistent long-tail search',
          hookReason: 'Loss aversion headlines outperform positive headlines.',
        },
        {
          title: `Why I Changed My Mind About ${context.topVideoTitles[0] || 'My Workflow'}`,
          potential: 'High',
          vphPrediction: 'High subscriber CTR',
          hookReason: 'Contrarian updates create immediate debate in comments.',
        },
        {
          title: `Beginner to Advanced in 30 Minutes: Zero Fluff`,
          potential: 'Medium',
          vphPrediction: 'Evergreen search traffic',
          hookReason: 'High retention potential for viewers seeking comprehensive zero-fluff guides.',
        },
      ],
      activeProvider: 'Heuristics Fallback (Check Ollama or Groq key)',
    };
  }
}
