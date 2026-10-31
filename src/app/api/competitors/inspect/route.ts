import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { inspectCompetitorChannel } from '@/lib/youtube-service';

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { handleOrId } = body;

    if (!handleOrId) {
      return NextResponse.json({ error: 'handleOrId is required' }, { status: 400 });
    }

    const data = await inspectCompetitorChannel(session, handleOrId);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Competitor inspection error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to inspect competitor' },
      { status: 500 }
    );
  }
}
