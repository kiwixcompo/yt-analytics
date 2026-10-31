import { getSession } from '@/lib/session';
import {
  getRecentVideos,
  getAnalyticsSummary,
  getTrafficSources,
  getTopCountries,
} from '@/lib/youtube-service';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  try {
    // Fetch recent videos (1 unit cost), analytics report, traffic sources, and countries
    const [videos, analytics, trafficSources, topCountries] = await Promise.all([
      getRecentVideos(session, 20),
      getAnalyticsSummary(session, 28),
      getTrafficSources(session, 28),
      getTopCountries(session, 28),
    ]);

    return (
      <DashboardClient
        session={session}
        initialVideos={videos}
        initialAnalytics={analytics}
        initialTrafficSources={trafficSources}
        initialTopCountries={topCountries}
      />
    );
  } catch (err: any) {
    if (err.message === 'SESSION_EXPIRED' || err.message?.includes('invalid_grant')) {
      redirect('/api/auth/google');
    }
    throw err;
  }
}
