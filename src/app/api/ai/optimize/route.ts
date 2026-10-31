import { NextRequest, NextResponse } from 'next/server';
import { generateAIOptimizations } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, topic, niche, existingTags, provider } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const result = await generateAIOptimizations({
      title,
      topic,
      niche,
      existingTags,
      provider,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('AI Generation Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

