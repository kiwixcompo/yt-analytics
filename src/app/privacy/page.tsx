import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | VidPulse Studio',
  description: 'Privacy Policy for VidPulse Studio YouTube Analytics and Optimization Platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="border-b border-slate-800 pb-6">
          <Link href="/" className="text-xs font-bold text-rose-400 hover:text-rose-300 transition">
            &larr; Back to VidPulse Studio
          </Link>
          <h1 className="text-3xl font-black text-white mt-3">Privacy Policy</h1>
          <p className="text-xs text-slate-400 mt-1">Last Updated: October 31, 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p>
              VidPulse Studio (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), hosted at{' '}
              <a href="https://yt-keywords.netlify.app" className="text-rose-400 hover:underline">
                https://yt-keywords.netlify.app
              </a>
              , respects your privacy and is committed to protecting your personal data. This Privacy
              Policy explains how we collect, use, and protect your information when you connect your YouTube
              account and use our analytics, keyword research, and video optimization tools.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">2. YouTube API Services &amp; Google User Data</h2>
            <p>
              VidPulse Studio utilizes YouTube API Services to retrieve public channel data, video statistics,
              and channel analytics. By using our application, you agree to be bound by the{' '}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:underline"
              >
                YouTube Terms of Service
              </a>{' '}
              and the{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:underline"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">3. Information We Collect</h2>
            <p>When you authenticate via Google OAuth, we access the following read-only data:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>
                <strong>Profile &amp; Account Info:</strong> Channel title, custom URL, avatar thumbnail, and
                associated email address.
              </li>
              <li>
                <strong>Channel Analytics:</strong> Public subscriber counts, lifetime views, and recent upload
                performance (read-only scopes: <code className="text-rose-300">youtube.readonly</code> and{' '}
                <code className="text-rose-300">yt-analytics.readonly</code>).
              </li>
              <li>
                <strong>User Preferences:</strong> Saved keywords, custom tags, and production checklists
                stored locally on your device via browser local storage.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">4. How We Use Your Information</h2>
            <p>Your information is strictly used for the following operational features:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li>Displaying channel performance dashboards and views-per-hour (VPH) velocity.</li>
              <li>Calculating SEO grades, title recommendations, and keyword competitiveness.</li>
              <li>Allowing you to save topics and scripts into your personal Recording Queue.</li>
            </ul>
            <p className="mt-2 font-medium text-slate-200">
              We NEVER sell, rent, or distribute your Google/YouTube account data to any third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">5. Data Retention &amp; Revocation</h2>
            <p>
              We do not persist your YouTube channel analytics in external third-party databases. OAuth tokens
              are securely handled in encrypted session cookies to keep your account connected.
            </p>
            <p>
              You can revoke VidPulse Studio&apos;s access to your Google account at any time by visiting{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-400 hover:underline"
              >
                Google Security - Third-party apps with account access
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white">6. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or your data, you can reach out
              to us directly via our GitHub repository at{' '}
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
