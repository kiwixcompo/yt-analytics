import { getSession } from '@/lib/session';
import Link from 'next/link';
import { ArrowRight, BarChart3, ShieldCheck, Sparkles, Zap, KeyRound, PlaySquare } from 'lucide-react';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <PlaySquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-300 to-indigo-400">
              VidPulse
            </span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Proprietary YouTube Intelligence Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-medium text-sm text-white shadow-md shadow-indigo-600/30"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/api/auth/google"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 transition font-medium text-sm text-white shadow-lg shadow-rose-600/30"
            >
              <PlaySquare className="w-4 h-4" />
              Connect YouTube Channel
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Powered by YouTube Data API v3 & Gemini 2.0 AI</span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-[1.1]">
          Grow your YouTube channel with <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-300 to-indigo-400">zero paid subscriptions</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          VidPulse delivers enterprise-grade SEO scorecards, live SERP keyword intelligence, small-creator outlier breakthrough detection, views-per-hour velocity, and AI title optimization—built directly on your own free Google quotas.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/api/auth/google"
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 transition font-semibold text-white text-base shadow-xl shadow-rose-600/25 active:scale-95"
          >
            <PlaySquare className="w-5 h-5" />
            Connect Your Channel with Google
          </Link>
          <a
            href="#features"
            className="px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition font-medium text-slate-300 text-base"
          >
            Explore Free Capabilities
          </a>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Video SEO Scorecard</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              10-point audit assessing title length, tag coverage, chaptering, description keyword depth, and thumbnail quality.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Views Per Hour (VPH) Radar</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Real-time velocity tracking to see exactly which recent uploads are gaining momentum and ranking in suggested feeds.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-lg text-white mb-2">Gemini AI Growth Copilot</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant generation of 5 high-CTR curiosity titles, targeted tags, and thumbnail concepts tailored to your niche.
            </p>
          </div>
        </div>

        {/* Security & Quota Assurance */}
        <div className="mt-16 w-full p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Direct Google OAuth Security</h4>
              <p className="text-xs text-slate-400">Tokens never touch 3rd-party servers; authenticated solely via official Google APIs.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Low-Quota Uploads Algorithm</h4>
              <p className="text-xs text-slate-400">Engineered to consume 99% less quota than naive YouTube API implementations.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        VidPulse • Open Architecture YouTube Growth Engine • Built with Next.js & Google Cloud
      </footer>
    </div>
  );
}
