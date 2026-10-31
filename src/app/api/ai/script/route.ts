import { NextRequest, NextResponse } from 'next/server';
import { executeWithFallback, AIProvider } from '@/lib/ai-service';

export interface ScriptBuilderInput {
  topic: string;
  title: string;
  videoStyle?: 'talking_head' | 'screencast' | 'vlog_story' | 'podcast';
  scriptTone?: 'high_energy' | 'thoughtful_deep' | 'conversational_funny' | 'educational_authoritative' | 'controversial_provocative';
  videoLengthMinutes?: number; // e.g. 5, 8, 12, 15
  customInstructions?: string;
  provider?: AIProvider;
}

const SYSTEM_PROMPT_SCRIPT = `
You are VidPulse Studio's master YouTube retention director, screenplay engineer, and script doctor.
You specialize in engineering high-engagement talking head and educational video scripts that prevent viewer drop-off.

CRITICAL RETENTION RULES:
1. HOOK (0:00 - 0:45): Never start with "Hey guys, welcome back to my channel". Start directly in media res with the burning question, painful reality, or provocative statement.
2. STAKES / PROBLEM (0:45 - 2:00): Establish why ignoring this advice is dangerous or costly.
3. MAIN VALUE BLOCKS: 3 to 5 structured points that solve the tension logically. Each point must have:
   - Full verbatim script text (natural, conversational, easy to speak aloud)
   - 3-5 bulleted talking points (for creators who don't read word-for-word)
   - Visual/B-Roll/On-Screen Cue notes
   - Retention spike technique (curiosity loop, pattern interrupt, or contrarian drop)
4. PAYOFF & CALL TO ACTION: Deliver the core transformation, then seamlessly weave in a high-conversion comment trigger and subscribe reason.

Return strictly valid JSON with this exact schema (no markdown ticks, no backticks outside JSON):
{
  "totalEstimatedDuration": "8-10 Minutes",
  "recommendedPacing": "Conversational, punchy with deliberate pauses after contrarian claims",
  "sections": [
    {
      "id": "hook",
      "sectionName": "1. The Pattern-Interrupt Hook",
      "estimatedDuration": "0:00 - 0:45",
      "tone": "Provocative & Urgent",
      "fullScript": "Word-for-word spoken text designed for direct delivery to camera...",
      "talkingPoints": [
        "Call out the viewer's current struggle immediately",
        "State why conventional advice is making it worse",
        "Open a curiosity loop that resolves in section 4"
      ],
      "visualCues": "Look directly down the lens. Fast cut after the first sentence. On-screen text: 'THE BIG LIE'.",
      "retentionStrategy": "Creates an immediate cognitive gap that prevents clicking away in the first 30 seconds."
    }
  ]
}
`;

export async function POST(request: NextRequest) {
  try {
    const body: ScriptBuilderInput = await request.json();
    const {
      topic,
      title,
      videoStyle = 'talking_head',
      scriptTone = 'controversial_provocative',
      videoLengthMinutes = 8,
      customInstructions = '',
      provider = 'auto',
    } = body;

    if (!topic || !title) {
      return NextResponse.json({ error: 'Topic and title are required' }, { status: 400 });
    }

    const toneDescriptions: Record<string, string> = {
      high_energy: 'High Energy & Motivational: Urgent, inspiring, punchy, dynamic phrasing.',
      thoughtful_deep: 'Thoughtful & Philosophical: Measured cadence, psychological insight, intellectual depth.',
      conversational_funny: 'Conversational & Witty: Relatable, informal, humorous analogies, self-deprecating honesty.',
      educational_authoritative: 'Authoritative & Clear: Teacher-first, framework-driven, highly practical, zero fluff.',
      controversial_provocative: 'Provocative & Assertive: Uncomfortable truths, calling out industry BS, contrarian viewpoints.',
    };

    const userPrompt = `
Topic: "${topic}"
Selected Title: "${title}"
Video Format: ${videoStyle}
Chosen Tone: ${scriptTone} (${toneDescriptions[scriptTone] || ''})
Target Duration: approximately ${videoLengthMinutes} minutes
Creator Notes / Custom Instructions: ${customInstructions || 'None'}

Please build a complete 5-stage retention script outline:
1. Hook (First 45 seconds - critical)
2. The Problem & Agitation (Setting the stakes)
3. Core Principle / Discovery (The unexpected breakthrough)
4. Step-by-Step Blueprint (Actionable application)
5. The Big Shift & Organic Retention CTA
`;

    try {
      const { text, activeProvider } = await executeWithFallback(
        userPrompt,
        SYSTEM_PROMPT_SCRIPT,
        provider
      );

      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        ...parsed,
        activeProvider,
      });
    } catch (err: any) {
      console.warn('AI Script Builder fallback to heuristic outline:', err.message);

      // Heuristic Fallback
      return NextResponse.json({
        totalEstimatedDuration: `${videoLengthMinutes} Minutes`,
        recommendedPacing: 'Fast hook, conversational body, deliberate emphasis on core counter-intuitive points.',
        activeProvider: 'VidPulse Script Engine (Heuristic Blueprint)',
        sections: [
          {
            id: 'hook',
            sectionName: '1. The Pattern-Interrupt Hook',
            estimatedDuration: '0:00 - 0:45',
            tone: 'Provocative & Direct',
            fullScript: `If you feel like you are doing everything right with "${topic}" and still seeing zero traction—listen to me closely: you are not lazy, and you are not stupid. In fact, the real problem is that you are probably thinking too much like an amateur who trusts conventional wisdom.\n\nIn this video, I am going to show you the exact mechanism behind "${title}", and why the moment you flip this one switch, everything gets 10 times easier.`,
            talkingPoints: [
              'Do NOT say welcome to my channel; start directly with the problem',
              'Validate the viewer: they are not failing due to lack of effort',
              'Tease the counter-intuitive shift that explains their stagnation',
            ],
            visualCues: 'Close up talking head, no background music until sentence 2, subtle push-in zoom.',
            retentionStrategy: 'Loss aversion + validation hook preventing drop-off in the first 30 seconds.',
          },
          {
            id: 'stakes',
            sectionName: '2. The Hidden Trap & Stakes',
            estimatedDuration: '0:45 - 2:30',
            tone: 'Analytical & Urgent',
            fullScript: `Here is the trap 95% of people fall into. When you start researching "${topic}", every guru tells you to follow the same 3 textbook steps. But notice what happens when everyone does the exact same thing: the market saturates, attention evaporates, and you burn out wondering why it worked for them but not for you.\n\nI made this mistake for over two years until I realized that standard advice is designed to keep you safe—not to make you stand out.`,
            talkingPoints: [
              'Expose the mainstream advice that causes failure',
              'Explain the hidden cost of staying on the standard path',
              'Share a relatable personal story or client example',
            ],
            visualCues: 'Cut to medium shot, bring in soft low-fi background beat, display graphic showing standard vs outlier path.',
            retentionStrategy: 'Agitates the pain point so the viewer is invested in hearing the resolution.',
          },
          {
            id: 'breakthrough',
            sectionName: '3. The Counter-Intuitive Principle',
            estimatedDuration: '2:30 - 5:00',
            tone: 'Authoritative & Enlightening',
            fullScript: `Here is the shift. Instead of trying to do more, you have to eliminate the friction. The top 1% who master "${topic}" understand one fundamental law: it is never about brute force; it is about asymmetric leverage.\n\nWhen you stop obsessing over perfection and start executing on high-signal actions, your trajectory changes overnight. Let me break down the 3 rules that govern this.`,
            talkingPoints: [
              'Introduce the core breakthrough concept',
              'Contrast brute force vs high-signal leverage',
              'Set up the 3 actionable pillars',
            ],
            visualCues: 'B-roll overlay of focused work, high contrast on-screen text for each of the 3 rules.',
            retentionStrategy: 'Delivers the "Aha!" moment which boosts viewer trust and video sharing.',
          },
          {
            id: 'action_plan',
            sectionName: '4. The Step-by-Step Blueprint',
            estimatedDuration: '5:00 - 7:30',
            tone: 'Actionable & Practical',
            fullScript: `Step number one: Audit your daily inputs and cut out low-return distractions. Step number two: Build a repeatable checklist so you never rely on motivation. And step number three: Test your assumptions against real feedback, not your own ego.\n\nIf you execute only these three things over the next 14 days, you will be further ahead than 90% of people who read about "${topic}" all year long.`,
            talkingPoints: [
              'Action Item 1: Eliminate low-leverage tasks',
              'Action Item 2: Build a friction-free workflow',
              'Action Item 3: Fast feedback loops over theoretical planning',
            ],
            visualCues: 'Numbered bullet points appearing on screen with subtle sound effect pops.',
            retentionStrategy: 'Clear practical value gives the viewer tangible takeaways and reasons to bookmark/save.',
          },
          {
            id: 'resolution_cta',
            sectionName: '5. Resolution & Organic Comment Trigger',
            estimatedDuration: '7:30 - 8:30',
            tone: 'Warm, Inspiring & Clear',
            fullScript: `The bottom line is simple: you already have what it takes, but you need to stop playing by rules that were written for a different era.\n\nI want to know your honest opinion: which of these mistakes have you been secretly guilty of? Leave a comment down below—I read and reply to all of them. And if this gave you clarity, hit subscribe so you don't miss next week's breakdown.`,
            talkingPoints: [
              'Summarize the core philosophical takeaway in 1 sentence',
              'Ask a specific conversational question that makes commenting easy',
              'Provide a clear value-oriented reason to subscribe',
            ],
            visualCues: 'Warm smile, return to primary camera angle, display comment prompt overlay and end screen video cards.',
            retentionStrategy: 'Algorithm engagement booster: comments signal community debate to YouTube.',
          },
        ],
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
