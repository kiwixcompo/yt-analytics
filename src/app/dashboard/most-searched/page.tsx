import { Metadata } from 'next';
import MostSearchedClient from './most-searched-client';

export const metadata: Metadata = {
  title: 'Most Searched Keywords | YouTube Supply Gap & Trend Intelligence',
  description:
    'Discover the most searched keywords on YouTube by general and deep sub-niches, with instant detection of high-demand topics that have minimal existing video competition.',
};

export default function MostSearchedPage() {
  return <MostSearchedClient />;
}
