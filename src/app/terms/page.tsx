import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | VidPulse Studio',
  description: 'Terms of Service for VidPulse Studio YouTube Analytics and Optimization Platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="border-b border-slate-800 pb-6">
          <Link href="/" className="text-xs font-bold text-rose-400 hover:text-rose-300 transition">
            &larr; Back to VidPulse Studio
          </Link>
          <h1 className="text-3xl font-black text-white mt-3">Terms of Service</h1>
          <p className="text-xs text-slate-400 mt-1">Last Updated: October 31, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using VidPulse Studio at{' '}
              <a href="https://yt-keywords.netlify.app" className="text-rose-400 hover:underline">
                https://yt-keywords.netlify.app
              </a>
              , you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms,
              please discontinue using the application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. YouTube API Terms of Service</h2>
            <p>
              VidPulse Studio integrates with YouTube API Services. By authenticating your account or using our
              features, you acknowledge and agree that your usage is also subject to the{' '}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:underline"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Permitted Use</h2>
            <p>You agree to use VidPulse Studio solely for lawful purposes, specifically:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>Analyzing and tracking video performance metrics for channels you own or manage.</li>
              <li>Performing keyword research, autocomplete discovery, and SEO optimization.</li>
              <li>Generating script outlines, title variations, and thumbnail concepts for content production.</li>
            </ul>
            <p className="mt-2 text-slate-400">
              You agree not to attempt to reverse engineer, disrupt API endpoints, or exceed rate limits.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. Intellectual Property &amp; Content Disclaimer</h2>
            <p>
              AI-generated suggestions (titles, descriptions, scripts, and thumbnail ideas) provided by VidPulse
              Studio are recommendations intended to inspire creator workflows. VidPulse Studio does not guarantee
              specific view counts, subscriber growth, or viral outcomes. You retain full ownership and responsibility
              for all content you publish on your YouTube channel.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Service Availability &amp; Termination</h2>
            <p>
              We reserve the right to modify, suspend, or terminate access to VidPulse Studio at any time without
              prior notice if these terms are violated. You may disconnect your channel at any time by revoking access
              in your Google Account settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Contact</h2>
            <p>
              For questions regarding these Terms of Service, visit our repository at{' '}
              <a
                href="https://github.com/kiwixcompo/yt-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:underline"
              >
                https://github.com/kiwixcompo/yt-analytics
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
