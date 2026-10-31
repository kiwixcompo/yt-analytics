import VaultClient from './vault-client';

export const metadata = {
  title: 'Keyword Vault | VidPulse Studio',
  description: 'Organize saved video keywords, track production status, and mark filmed topics.',
};

export default function VaultPage() {
  return <VaultClient />;
}
