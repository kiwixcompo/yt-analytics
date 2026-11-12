import { Metadata } from 'next';
import TrendsPageClient from './trends-client';

export const metadata: Metadata = {
  title: 'Trend Scout | YouTube Trends Engine & Realtime Explorer',
  description:
    'Discover real-time breakout search queries, YouTube trending velocity, and high-demand outlier opportunities.',
};

export default function TrendsPage() {
  return <TrendsPageClient />;
}
