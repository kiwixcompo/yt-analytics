import { Metadata } from 'next';
import CompetitorsPageClient from './competitors-client';

export const metadata: Metadata = {
  title: 'Competitor Radar | Outlier Breakouts & Competitor Channel Spy',
  description:
    'Track rival YouTube channels in your niche, monitor median benchmark views, and uncover high-performing outlier videos.',
};

export default function CompetitorsPage() {
  return <CompetitorsPageClient />;
}
