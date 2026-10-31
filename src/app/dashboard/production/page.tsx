import RecordingQueueClient from './production-client';

export const metadata = {
  title: 'Recording Queue & Production Sheet | VidPulse Studio',
  description: 'Organize topics, full scripts, and metadata ready to film as videos',
};

export default function ProductionPage() {
  return <RecordingQueueClient />;
}
