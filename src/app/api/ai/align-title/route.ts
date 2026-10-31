import { NextRequest, NextResponse } from 'next/server';
import { executeWithFallback, AIProvider } from '@/lib/ai-service';

export interface ChapterAlignmentInput {
  title: string;
  topic?: string;
  videoStyle?: string;
  provider?: AIProvider;
}

const SYSTEM_PROMPT_ALIGN = `
You are VidPulse Studio's elite YouTube retention and narrative strategist.
When a creator selects a specific provocative or question-hook video title, you engineer the exact chapters, timestamps, spoken script outline, and talking points that match the EXACT energy, psychological tension, and promise of that chosen title.

CRITICAL RULES:
1. The Chapters & Timestamps must NOT be generic ("Intro", "Body", "Outro"). They must reflect the exact tone and claim of the chosen title (e.g., if title is "You're Broke Because You're Too Smart", Chapter 1 is "0:00 - The High-IQ Trap", Chapter 2 is "1:45 - Why Overthinking Kills Wealth", Chapter 3 is "4:20 - The 1% Execution Rule").
2. The Above-the-Fold Hook must explicitly match the selected title's punchline.
3. The Script Hook, Main Breakthrough, and Talking Points must deliver directly on what the title promised so there is zero clickbait disappointment.

Return strictly valid JSON with this exact schema (no markdown formatting, no backticks outside JSON):
{
  "alignedChapters": [
    {
      "timestamp": "0:00",
      "chapterName": "Pungent chapter name matching title energy"
    },
    {
      "timestamp": "1:15",
      "chapterName": "Agitating the specific problem raised in the title"
    },
    {
      "timestamp": "3:40",
      "chapterName": "The counter-intuitive truth behind the title"
    },
    {
      "timestamp": "6:10",
      "chapterName": "The step-by-step breakthrough"
    },
    {
      "timestamp": "8:30",
      "chapterName": "The permanent fix & call to action"
    }
  ],
  "timestampsString": "0:00 - Chapter Name\\n1:15 - Chapter Name...",
  "alignedHook": "First 2 lines above-the-fold description hook that mirrors the title's exact energy...",
  "scriptOutline": {
    "totalEstimatedDuration": "8-10 Minutes",
    "recommendedPacing": "Pacing calibrated to the title tone",
    "sections": [
      {
        "id": "hook",
        "sectionName": "1. The Direct Title Hook",
        "estimatedDuration": "0:00 - 1:15",
        "tone": "Matching Title Energy",
        "fullScript": "Spoken teleprompter lines directly delivering on the title...",
        "talkingPoints": [
          "Direct point addressing the title thesis",
          "Pain point that makes the viewer feel seen",
          "Curiosity loop setting up the solution"
        ],
        "visualCues": "Direct lens gaze, punchy cut on keyword, bold title text overlay.",
        "retentionStrategy": "Validates the click immediately so viewer retention stays above 70%."
      },
      {
        "id": "problem",
        "sectionName": "2. Why Everyone Else Gets This Wrong",
        "estimatedDuration": "1:15 - 3:40",
        "tone": "Analytical & Urgent",
        "fullScript": "Deep dive into the trap mentioned in the title...",
        "talkingPoints": [
          "The conventional trap",
          "Why smart people fall for it",
          "The invisible cost"
        ],
        "visualCues": "B-roll cut, contrast graphics illustrating the flaw.",
        "retentionStrategy": "Agitates the pain point before revealing the solution."
      },
      {
        "id": "solution",
        "sectionName": "3. The Counter-Intuitive Breakthrough",
        "estimatedDuration": "3:40 - 6:10",
        "tone": "Authoritative & Illuminating",
        "fullScript": "The core revelation that fulfills the title promise...",
        "talkingPoints": [
          "The underlying principle",
          "How to reverse the mistake immediately",
          "Real-world application example"
        ],
        "visualCues": "Clean diagram or on-screen list popping up.",
        "retentionStrategy": "Delivers the big 'Aha!' moment."
      },
      {
        "id": "blueprint",
        "sectionName": "4. Step-by-Step Action Plan",
        "estimatedDuration": "6:10 - 8:30",
        "tone": "Practical & Actionable",
        "fullScript": "Concrete action items the viewer can execute right now...",
        "talkingPoints": [
          "Step 1: Immediate audit",
          "Step 2: The execution rule",
          "Step 3: Compounding feedback"
        ],
        "visualCues": "Numbered lower thirds (1, 2, 3).",
        "retentionStrategy": "Leaves viewer with tangible value."
      },
      {
        "id": "payoff",
        "sectionName": "5. The Mindset Shift & Algorithm CTA",
        "estimatedDuration": "8:30 - End",
        "tone": "Empowering & Direct",
        "fullScript": "Closing transformation and comment-driving prompt...",
        "talkingPoints": [
          "Summary of the transformation",
          "Comment trigger question directly relating to the title topic"
        ],
        "visualCues": "Return to intense close-up, warm smile, end-card prompt.",
        "retentionStrategy": "Spikes comment count and end-screen click-through."
      }
    ]
  }
}
`;

export async function POST(req: NextRequest) {
  try {
    const body: ChapterAlignmentInput = await req.json();
    const { title, topic = '', videoStyle = 'talking_head', provider = 'auto' } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required for alignment' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanTopic = (topic || cleanTitle).trim();

    const userPrompt = `
Selected Title: "${cleanTitle}"
Topic / Context: "${cleanTopic}"
Video Style: ${videoStyle}

Please engineer:
1. 5 custom chapter timestamps that mirror the EXACT tone, stakes, and claim of "${cleanTitle}".
2. An above-the-fold 2-line description hook matched to "${cleanTitle}".
3. A synchronized 5-stage spoken script and talking points outline fulfilling "${cleanTitle}".
`;

    try {
      const { text, activeProvider } = await executeWithFallback(
        userPrompt,
        SYSTEM_PROMPT_ALIGN,
        provider
      );

      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        ...parsed,
        activeProvider,
      });
    } catch (err: any) {
      console.warn('AI chapter align fallback to dynamic engine:', err.message);

      // Heuristic dynamic generation that closely models the title energy
      const shortTitle = cleanTitle.replace(/^(why|how|the|stop|you're|are you)\s+/i, '').replace(/[?!.:]+$/, '');
      const isQuestion = cleanTitle.includes('?');

      const alignedChapters = [
        {
          timestamp: '0:00',
          chapterName: isQuestion ? `The Burning Question: ${cleanTitle}` : `The Uncomfortable Reality: ${cleanTitle}`,
        },
        {
          timestamp: '1:15',
          chapterName: `Why Most Advice About "${shortTitle}" Is Wrong`,
        },
        {
          timestamp: '3:30',
          chapterName: `The Hidden Mechanism Nobody Tells You`,
        },
        {
          timestamp: '6:00',
          chapterName: `The 3-Step Fix You Can Do Today`,
        },
        {
          timestamp: '8:15',
          chapterName: `What Changes When You Flip This Switch`,
        },
      ];

      const timestampsString = alignedChapters.map((c) => `${c.timestamp} - ${c.chapterName}`).join('\n');

      return NextResponse.json({
        alignedChapters,
        timestampsString,
        alignedHook: `In this video, we're breaking down "${cleanTitle}" and exposing the exact reason conventional wisdom is quietly sabotaging your results. Watch until the end for the 3-step execution fix.`,
        scriptOutline: {
          totalEstimatedDuration: '8-10 Minutes',
          recommendedPacing: 'Fast, confrontational hook leading into structured actionable clarity.',
          sections: alignedChapters.map((ch, idx) => ({
            id: `sec_${idx}`,
            sectionName: `${idx + 1}. ${ch.chapterName}`,
            estimatedDuration: ch.timestamp,
            tone: idx === 0 ? 'Confrontational & High Energy' : idx === 2 ? 'Illuminating & Authoritative' : 'Actionable & Direct',
            fullScript: `Regarding "${cleanTitle}": If you have been struggling with this, the truth is simpler than you think. Let's break down ${ch.chapterName} step by step.`,
            talkingPoints: [
              `Directly address: ${ch.chapterName}`,
              `Explain the counter-intuitive reason behind it`,
              `Give a concrete example that proves the thesis of "${cleanTitle}"`,
            ],
            visualCues: 'Direct lens connection, minimal distracting B-roll, on-screen text highlights.',
            retentionStrategy: 'Matches the exact curiosity gap promised in the title without hesitation.',
          })),
        },
        activeProvider: 'VidPulse Dynamic Energy Engine (Heuristic)',
      });
    }
  } catch (err: any) {
    console.error('Chapter alignment error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to align chapters to title' },
      { status: 500 }
    );
  }
}
