import { NextRequest, NextResponse } from 'next/server';
import { generateDailyIdeas } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelTitle, topVideoTitles, provider } = body;

    if (!channelTitle) {
      return NextResponse.json({ error: 'channelTitle is required' }, { status: 400 });
    }

    const result = await generateDailyIdeas({
      channelTitle,
      topVideoTitles: topVideoTitles || [],
      provider,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Daily Ideas API Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
