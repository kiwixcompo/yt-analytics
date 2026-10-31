import { NextRequest, NextResponse } from 'next/server';
import { executeWithFallback, AIProvider } from '@/lib/ai-service';

export interface MetadataGeneratorInput {
  topic: string;
  videoStyle?: 'talking_head' | 'screencast' | 'vlog_story' | 'podcast';
  titleTone?: 'assertive_provocative' | 'question_hook' | 'bold_statement' | 'educational_curiosity';
  targetAudience?: string;
  provider?: AIProvider;
}

const SYSTEM_PROMPT_METADATA = `
You are VidPulse Studio's elite YouTube viral strategist, SEO copywriter, and title engineer.
Your specialty is engineering high-CTR titles, curiosity-inducing hooks, and algorithm-ranking metadata specifically designed for talking-head videos, tutorials, and thought-provoking creators.

When generating titles:
- Specialize in provocative, assertive, and question-based psychological hooks (e.g., "You're Broke Because You're Too Smart", "Why High-IQ People Stay Poor", "Stop Doing This Before It Ruins Your Channel").
- NEVER write boring, generic, textbook corporate titles.
- Maximize curiosity gaps and loss aversion.

Return strictly valid JSON with this exact schema (no markdown ticks, no backticks outside JSON):
{
  "titles": [
    {
      "title": "Title text here",
      "hookType": "Assertive Provocative | Question Hook | Bold Statement | Contrarian",
      "predictedCTR": "9.2% (High)",
      "explanation": "Why this title raises curiosity and makes the viewer click"
    }
  ],
  "recommendedTitle": "The single best title from the list above",
  "seoDescription": {
    "hookParagraph": "The first 2 lines visible before YouTube's 'Show more' fold. Must hook the viewer instantly and restate the curiosity core.",
    "body": "Comprehensive 2-3 paragraph SEO keyword rich overview covering what the viewer will learn, including strategic natural keyword placements.",
    "timestampsPlaceholder": "0:00 - The Uncomfortable Truth\\n1:15 - Why Most People Get This Wrong\\n3:30 - The 3 Principles\\n6:45 - What To Do Next",
    "callToAction": "Call to action with comment trigger question that forces viewer comments (algorithm signal)."
  },
  "tags": [
    "tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10",
    "tag11", "tag12", "tag13", "tag14", "tag15", "tag16", "tag17", "tag18", "tag19", "tag20"
  ],
  "thumbnailHookConcept": {
    "visualLayout": "Visual description of the frame (e.g. Extreme close-up talking head, slight skeptical expression, dark high-contrast background)",
    "textOverlay": "2-4 words bold text overlay (e.g. 'THE BIG LIE' or 'TOO SMART?')",
    "colorScheme": "High-contrast colors to stand out in the YouTube recommendation feed"
  }
}
`;

export async function POST(request: NextRequest) {
  try {
    const body: MetadataGeneratorInput = await request.json();
    const { topic, videoStyle = 'talking_head', titleTone = 'assertive_provocative', targetAudience = 'General YouTube Audience', provider = 'auto' } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic or keyword is required' }, { status: 400 });
    }

    const styleInstructions: Record<string, string> = {
      talking_head: 'Format: Talking Head / Direct to Camera. Prioritize confrontational, deeply personal, and thought-provoking psychological hooks like "You are broke because you are too smart".',
      screencast: 'Format: Screencast / Step-by-Step Practical. Balance high CTR with clear demonstration value.',
      vlog_story: 'Format: Personal Narrative / Storytelling. Focus on stakes, journey, and transformation.',
      podcast: 'Format: Long-form Deep Dive. Focus on intellectual debate and insider revelations.',
    };

    const toneInstructions: Record<string, string> = {
      assertive_provocative: 'Tone: Highly Assertive & Provocative. Bold claims that challenge assumptions (e.g., "You\'re broke because you\'re too smart", "Everything you were taught about success is a lie").',
      question_hook: 'Tone: Question Hook. Compelling questions that raise intense curiosity and make scrolling past impossible (e.g., "Why Are Smart People Always Broke?", "Are You Secretly Sabotaging Your Channel?").',
      bold_statement: 'Tone: Bold Statement. Authoritative, direct, uncompromising truth declarations.',
      educational_curiosity: 'Tone: Contrarian Education. Breaking down a surprising scientific or psychological truth that goes against popular advice.',
    };

    const userPrompt = `
Topic / Core Keyword: "${topic}"
Video Style: ${videoStyle} (${styleInstructions[videoStyle] || ''})
Desired Title Tone: ${titleTone} (${toneInstructions[titleTone] || ''})
Target Audience: ${targetAudience}

Generate 5 exceptional high-CTR titles (minimum 2 must be assertive/provocative and at least 2 must be question hooks), an SEO-optimized description with first 2 lines hook, 20 ranking tags, and a thumbnail text concept.
`;

    try {
      const { text, activeProvider } = await executeWithFallback(
        userPrompt,
        SYSTEM_PROMPT_METADATA,
        provider
      );

      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        ...parsed,
        activeProvider,
      });
    } catch (err: any) {
      console.warn('AI generator fallback to heuristic engine:', err.message);

      // Robust Heuristic Fallback
      const baseClean = topic.trim();
      return NextResponse.json({
        titles: [
          {
            title: `You're Broke Because You're Too Smart (${baseClean} Trap)`,
            hookType: 'Assertive Provocative',
            predictedCTR: '11.4% (Very High)',
            explanation: 'Directly validates intelligence while pointing out a painful flaw, triggering immediate cognitive dissonance.',
          },
          {
            title: `Why Are Smart People Always Poor At ${baseClean}?`,
            hookType: 'Question Hook',
            predictedCTR: '10.2% (High)',
            explanation: 'Open loop question that viewers cannot self-answer without clicking the video.',
          },
          {
            title: `Stop Doing ${baseClean} The "Right" Way (It's Ruining You)`,
            hookType: 'Bold Statement',
            predictedCTR: '9.8% (High)',
            explanation: 'Loss aversion headline that implies common wisdom is actively harmful.',
          },
          {
            title: `The 1 Uncomfortable Truth About ${baseClean} Nobody Tells You`,
            hookType: 'Contrarian',
            predictedCTR: '9.5% (High)',
            explanation: 'Taps into conspiracy / insider revelation instinct.',
          },
          {
            title: `What Happens When You Finally Stop Caring About ${baseClean}?`,
            hookType: 'Question Hook',
            predictedCTR: '9.1% (High)',
            explanation: 'Psychological release hook that appeals to overwhelmed creators or practitioners.',
          },
        ],
        recommendedTitle: `You're Broke Because You're Too Smart (${baseClean} Trap)`,
        seoDescription: {
          hookParagraph: `Most people fail at ${baseClean} not because they lack effort, but because they overcomplicate what actually works.\nIn this video, I break down the brutal psychology behind why this happens and how to flip it today.`,
          body: `If you've been working tirelessly on ${baseClean} and wondering why the results aren't matching your expectations, you're not alone. In this deep dive, we unpack the common traps, why conventional advice sets you up to fail, and the exact shift you must make.\n\nMake sure to watch until the 4th section where we outline the step-by-step counterintuitive strategy.`,
          timestampsPlaceholder: `0:00 - The "Too Smart" Trap in ${baseClean}\n1:45 - The Cost of Overthinking\n4:10 - The 3 Things You Must Unlearn\n7:30 - The Uncomfortable Fix\n10:15 - What to do next`,
          callToAction: `Which of these traps have you caught yourself falling into? Drop a comment below—I read and reply to all of them!`,
        },
        tags: [
          baseClean.toLowerCase(),
          `${baseClean.toLowerCase()} tutorial`,
          `${baseClean.toLowerCase()} 2026`,
          `why ${baseClean.toLowerCase()}`,
          'talking head',
          'psychology',
          'mindset',
          'productivity',
          'youtube growth',
          'self improvement',
          'success mindset',
          'strategy',
          'actionable advice',
          'how to succeed',
          'unpopular opinion',
          'the truth about',
          'life advice',
          'creator economy',
          'online business',
          'high performance',
        ],
        thumbnailHookConcept: {
          visualLayout: 'Split screen with dark slate background: on the left, an exhausted face resting on hands; on the right, bold red high-contrast text.',
          textOverlay: 'TOO SMART?',
          colorScheme: 'Electric rose red (#f43f5e) on pure black with high contrast white highlights.',
        },
        activeProvider: 'VidPulse Heuristic Engine (Offline Fallback)',
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
