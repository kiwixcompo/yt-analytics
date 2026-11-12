'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Compass,
  TrendingUp,
  Flame,
  Search,
  Sparkles,
  Download,
  Info,
  ChevronDown,
  RefreshCw,
  Rocket,
  Play,
  ArrowUpRight,
  Filter,
  Check,
  Tag,
  Mic,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import OutlierExplorerModal, { SUBSCRIBER_RANGES } from '../components/outlier-explorer-modal';

interface TrendsQueryItem {
  query: string;
  interest: number;
  changeText: string;
  changePercent: number;
  isPositive: boolean;
  rank: number;
}

interface CategorizedTitle {
  category: 'Entertainment' | 'Solution to a problem' | 'Thought provoking';
  title: string;
  rationale: string;
}

interface TrendsData {
  seed: string;
  format: 'talking_head' | 'screencast';
  geo: string;
  timeframe: string;
  category: string;
  property: string;
  trendVelocity: string;
  topQueries: TrendsQueryItem[];
  risingQueries: TrendsQueryItem[];
  categorizedTitles: CategorizedTitle[];
  primaryHookTitle: string;
  whyItSpikes: string;
  thumbnailLayout: string;
  productionStrategy: {
    idealVideoLength: string;
    callToAction: string;
    talkingPoints: string[];
  };
}

const CATEGORY_DEFAULT_SEEDS: Record<string, string> = {
  'Computers & Electronics': 'Apple',
  'Internet & Telecom': 'Starlink',
  Games: 'GTA 6',
  Science: 'Artificial Intelligence',
  'Business & Industrial': 'Passive Income',
  'All Categories': 'Trending',
};

const EXPLORE_PRESETS = [
  { label: '🔥 All Trending', seed: 'Trending', cat: 'All Categories' },
  { label: '🤖 AI & Tech', seed: 'Artificial Intelligence', cat: 'Science' },
  { label: '🎮 Gaming & Esports', seed: 'GTA 6', cat: 'Games' },
  { label: '💰 Personal Finance', seed: 'Passive Income', cat: 'Business & Industrial' },
  { label: '📱 Consumer Electronics', seed: 'iPhone', cat: 'Computers & Electronics' },
  { label: '🌐 Internet & Web Tools', seed: 'Starlink', cat: 'Internet & Telecom' },
];

function TrendsClientContent() {
  // Filter States
  const [trendsSeed, setTrendsSeed] = useState('Trending');
  const [trendsFormat, setTrendsFormat] = useState<'talking_head' | 'screencast'>('talking_head');
  const [trendsGeo, setTrendsGeo] = useState('US');
  const [trendsTimeframe, setTrendsTimeframe] = useState('today 3-m');
  const [trendsCategory, setTrendsCategory] = useState('All Categories');
  const [trendsProperty, setTrendsProperty] = useState('youtube');

  // Async States
  const [isScouting, setIsScouting] = useState(false);
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  // Suggestions state
  const [suggestedTerms, setSuggestedTerms] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // SERP Preview states
  const [expandedTrendQuery, setExpandedTrendQuery] = useState<string | null>(null);
  const [serpResults, setSerpResults] = useState<any[]>([]);
  const [serpLoading, setSerpLoading] = useState(false);
  const [serpOutliersOnly, setSerpOutliersOnly] = useState(false);
  const [serpSubRange, setSerpSubRange] = useState<string>('all');

  // Outlier Explorer Modal State
  const [selectedExplorerVideo, setSelectedExplorerVideo] = useState<any | null>(null);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    fetchTrends(trendsSeed, trendsFormat, trendsGeo, trendsTimeframe, trendsCategory, trendsProperty);
    fetchSuggestedTerms(trendsCategory, trendsGeo);
  }, []);

  const fetchTrends = async (
    seedVal = trendsSeed,
    formatVal = trendsFormat,
    geoVal = trendsGeo,
    timeframeVal = trendsTimeframe,
    catVal = trendsCategory,
    propVal = trendsProperty
  ) => {
    setIsScouting(true);
    setTrendsError(null);

    try {
      const res = await fetch('/api/trends/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: seedVal,
          format: formatVal,
          geo: geoVal,
          timeframe: timeframeVal,
          category: catVal,
          property: propVal,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch trends');
      }

      const data = await res.json();
      setTrendsData(data);
    } catch (err: any) {
      console.error(err);
      setTrendsError(err.message || 'Error scouting trends');
    } finally {
      setIsScouting(false);
    }
  };

  const fetchSuggestedTerms = async (cat = trendsCategory, geo = trendsGeo) => {
    setIsLoadingSuggestions(true);
    try {
      const res = await fetch('/api/trends/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, geo }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuggestedTerms(data.terms || []);
      }
    } catch (err) {
      console.error('Suggest error:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleFetchSerp = async (queryToSearch: string, outliersOnly = serpOutliersOnly, subRangeVal = serpSubRange) => {
    setSerpLoading(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToSearch,
          outliersOnly,
          subRange: subRangeVal,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSerpResults(data.videos || []);
      }
    } catch (err) {
      console.error('SERP preview error:', err);
    } finally {
      setSerpLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Trend Scout</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold uppercase tracking-wider">
                  Live Index
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authentic Google Trends search interest & breakout velocity across geographical markets and categories.
              </p>
            </div>
          </div>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setTrendsFormat('talking_head');
              fetchTrends(trendsSeed, 'talking_head');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              trendsFormat === 'talking_head'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Talking Head</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTrendsFormat('screencast');
              fetchTrends(trendsSeed, 'screencast');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              trendsFormat === 'screencast'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Screencast</span>
          </button>
        </div>
      </div>

      {/* Realtime Explore Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Explore Realtime Categories</span>
          </span>
          <button
            type="button"
            onClick={() => fetchSuggestedTerms()}
            disabled={isLoadingSuggestions}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingSuggestions ? 'animate-spin' : ''}`} />
            <span>Refresh Suggestions</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {EXPLORE_PRESETS.map((p) => {
            const isMatch = trendsCategory === p.cat && trendsSeed === p.seed;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setTrendsCategory(p.cat);
                  setTrendsSeed(p.seed);
                  fetchTrends(p.seed, trendsFormat, trendsGeo, trendsTimeframe, p.cat, trendsProperty);
                  fetchSuggestedTerms(p.cat, trendsGeo);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isMatch
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Suggested Query Chips */}
        {suggestedTerms.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0 font-bold">Spikes:</span>
            {suggestedTerms.slice(0, 8).map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setTrendsSeed(term);
                  fetchTrends(term, trendsFormat, trendsGeo, trendsTimeframe, trendsCategory, trendsProperty);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1 cursor-pointer"
              >
                <TrendingUp className="w-3 h-3 text-rose-400" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Geo Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-400">Target Region</label>
            <select
              value={trendsGeo}
              onChange={(e) => {
                const nextGeo = e.target.value;
                setTrendsGeo(nextGeo);
                fetchTrends(trendsSeed, trendsFormat, nextGeo, trendsTimeframe, trendsCategory, trendsProperty);
                fetchSuggestedTerms(trendsCategory, nextGeo);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="US">🇺🇸 United States</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="AU">🇦🇺 Australia</option>
              <option value="IN">🇮🇳 India</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="FR">🇫🇷 France</option>
              <option value="BR">🇧🇷 Brazil</option>
              <option value="">🌍 Worldwide</option>
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-400">Timeframe</label>
            <select
              value={trendsTimeframe}
              onChange={(e) => {
                const nextTf = e.target.value;
                setTrendsTimeframe(nextTf);
                fetchTrends(trendsSeed, trendsFormat, trendsGeo, nextTf, trendsCategory, trendsProperty);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="now 1-H">Past hour</option>
              <option value="now 4-H">Past 4 hours</option>
              <option value="now 1-d">Past day</option>
              <option value="now 7-d">Past 7 days</option>
              <option value="today 1-m">Past 30 days</option>
              <option value="today 3-m">Past 90 days</option>
              <option value="today 12-m">Past 12 months</option>
              <option value="today 5-y">Past 5 years</option>
            </select>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-400">Category</label>
            <select
              value={trendsCategory}
              onChange={(e) => {
                const nextCat = e.target.value;
                setTrendsCategory(nextCat);
                const nextSeed = CATEGORY_DEFAULT_SEEDS[nextCat] || trendsSeed;
                setTrendsSeed(nextSeed);
                fetchTrends(nextSeed, trendsFormat, trendsGeo, trendsTimeframe, nextCat, trendsProperty);
                fetchSuggestedTerms(nextCat, trendsGeo);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="Computers & Electronics">Computers & Electronics</option>
              <option value="Internet & Telecom">Internet & Telecom</option>
              <option value="Games">Games & Gaming</option>
              <option value="Science">Science & High-Tech</option>
              <option value="Business & Industrial">Business & Industrial</option>
            </select>
          </div>

          {/* Search Property */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-400">Search Property</label>
            <select
              value={trendsProperty}
              onChange={(e) => {
                const nextProp = e.target.value;
                setTrendsProperty(nextProp);
                fetchTrends(trendsSeed, trendsFormat, trendsGeo, trendsTimeframe, trendsCategory, nextProp);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="youtube">YouTube Search</option>
              <option value="web">Google Web Search</option>
              <option value="news">Google News</option>
            </select>
          </div>
        </div>

        {/* Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchTrends();
          }}
          className="flex flex-col sm:flex-row gap-2 pt-1"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trendsSeed}
              onChange={(e) => setTrendsSeed(e.target.value)}
              placeholder="Enter search term or keyword topic (e.g. Next.js, Apple, GTA 6, AI Tools)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isScouting}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isScouting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mining Google Trends...</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Trends</span>
              </>
            )}
          </button>
        </form>
      </div>

      {trendsError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {trendsError}
        </div>
      )}

      {/* Results View */}
      {trendsData && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Dual Query Tables: Top Queries & Rising Queries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Queries Table */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm">Top Queries</h3>
                    <span title="Most popular search queries on YouTube" className="cursor-pointer">
                      <Info className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    {trendsData.geo === 'US' ? 'United States' : trendsData.geo || 'Worldwide'} • {trendsData.timeframe}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const header = 'Rank,Query,Search Interest,Change\n';
                    const rows = (trendsData.topQueries || [])
                      .map((q) => `${q.rank},"${q.query}",${q.interest},${q.changeText}`)
                      .join('\n');
                    const blob = new Blob([header + rows], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `top_queries_${trendsData.seed}.csv`;
                    a.click();
                  }}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                <span className="w-1/2">Query</span>
                <span className="w-1/4 text-center">Interest</span>
                <span className="w-1/4 text-right">Change</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {(trendsData.topQueries || []).map((tq) => {
                  const isExpanded = expandedTrendQuery === tq.query;
                  return (
                    <div key={tq.rank} className="py-2.5 transition">
                      <div className="flex items-center justify-between px-2 text-xs">
                        <div className="w-1/2 flex items-center gap-2 min-w-0 pr-2">
                          <span className="text-[11px] text-slate-500 w-4 shrink-0">{tq.rank}.</span>
                          <span className="font-semibold text-slate-200 truncate">{tq.query}</span>
                        </div>
                        <div className="w-1/4 flex items-center justify-center">
                          <div className="w-20 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                            <div
                              className="bg-gradient-to-r from-rose-500 to-indigo-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(10, tq.interest))}%` }}
                            />
                          </div>
                        </div>
                        <div className="w-1/4 flex items-center justify-end gap-2">
                          <span className="font-bold text-emerald-400 text-[11px]">{tq.changeText}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedTrendQuery(null);
                              } else {
                                setExpandedTrendQuery(tq.query);
                                handleFetchSerp(tq.query);
                              }
                            }}
                            className={`p-1 rounded-md text-xs transition cursor-pointer ${
                              isExpanded ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                            }`}
                            title="Inspect SERP and Outlier Videos"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expandable SERP Drawer */}
                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">SERP Preview: &quot;{tq.query}&quot;</span>
                              <Link
                                href={`/dashboard/research?q=${encodeURIComponent(tq.query)}`}
                                className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5"
                              >
                                <span>Deep Research</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </div>

                            {/* SERP Sub-Filter Dropdown */}
                            <div className="flex items-center gap-2">
                              <select
                                value={serpSubRange}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSerpSubRange(val);
                                  handleFetchSerp(tq.query, serpOutliersOnly, val);
                                }}
                                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-indigo-300 cursor-pointer"
                              >
                                {SUBSCRIBER_RANGES.map((r) => (
                                  <option key={r.value} value={r.value} className="bg-slate-950 text-slate-200">
                                    {r.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextOutliers = !serpOutliersOnly;
                                  setSerpOutliersOnly(nextOutliers);
                                  handleFetchSerp(tq.query, nextOutliers, serpSubRange);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                  serpOutliersOnly
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                🔥 Outliers Only
                              </button>
                            </div>
                          </div>

                          {serpLoading ? (
                            <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                              <span>Scanning live YouTube search results...</span>
                            </div>
                          ) : serpResults.length === 0 ? (
                            <div className="py-4 text-center text-xs text-slate-500">
                              No videos found matching these filters.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {serpResults.slice(0, 5).map((vid) => (
                                <div
                                  key={vid.videoId || vid.url}
                                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-3 text-xs"
                                >
                                  <div className="min-w-0 space-y-1">
                                    <h5 className="font-semibold text-slate-200 line-clamp-1">{vid.title}</h5>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                      <span>{vid.channelTitle}</span>
                                      <span>&bull;</span>
                                      <span className="text-indigo-300">👥 {vid.channelSubscriberCountText}</span>
                                      <span>&bull;</span>
                                      <span className="text-slate-200 font-medium">{vid.viewsText}</span>
                                    </div>
                                  </div>
                                  {vid.isOutlierHit && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedExplorerVideo(vid);
                                        setIsExplorerModalOpen(true);
                                      }}
                                      className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Explore Outlier</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rising Queries Table */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-sm">Rising Queries</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Breakouts
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Highest search volume acceleration in recent period
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const header = 'Rank,Query,Change\n';
                    const rows = (trendsData.risingQueries || [])
                      .map((q) => `${q.rank},"${q.query}",${q.changeText}`)
                      .join('\n');
                    const blob = new Blob([header + rows], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rising_queries_${trendsData.seed}.csv`;
                    a.click();
                  }}
                  className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                <span className="w-2/3">Query</span>
                <span className="w-1/3 text-right">Growth</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {(trendsData.risingQueries || []).map((rq) => (
                  <div key={rq.rank} className="py-2.5 px-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-[11px] text-slate-500 w-4 shrink-0">{rq.rank}.</span>
                      <span className="font-semibold text-slate-200 truncate">{rq.query}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {rq.changeText}
                      </span>
                      <Link
                        href={`/dashboard/research?q=${encodeURIComponent(rq.query)}`}
                        className="p-1 rounded text-slate-400 hover:text-white transition"
                        title="Search query in Research"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Production Strategy & Angle Recommendations */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/30 border border-indigo-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Strategic Production Blueprint</h3>
                  <p className="text-xs text-slate-400">
                    Hook title & talking points generated specifically for {trendsData.format === 'talking_head' ? 'Talking Head' : 'Screencast'}
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/studio?topic=${encodeURIComponent(trendsData.primaryHookTitle || trendsData.seed)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
              >
                <span>Write Full Script in Studio &rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Primary Hook Title</span>
                <p className="font-bold text-slate-100 text-sm leading-snug">{trendsData.primaryHookTitle}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Why It Spikes</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">{trendsData.whyItSpikes}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Recommended Format</span>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Length: <strong className="text-white">{trendsData.productionStrategy?.idealVideoLength || '8-12 minutes'}</strong>
                  <br />
                  CTA: <span className="text-slate-400">{trendsData.productionStrategy?.callToAction || 'Subscribe for deeper tutorials'}</span>
                </p>
              </div>
            </div>

            {/* Categorized Angles */}
            {trendsData.categorizedTitles && trendsData.categorizedTitles.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300">Angles to Capitalize on This Trend:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {trendsData.categorizedTitles.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1"
                    >
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-bold uppercase">
                        {item.category}
                      </span>
                      <p className="font-semibold text-slate-200 text-xs pt-1">{item.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outlier Video Explorer Modal */}
      <OutlierExplorerModal
        video={selectedExplorerVideo}
        isOpen={isExplorerModalOpen}
        onClose={() => setIsExplorerModalOpen(false)}
        onOpenEmulation={(v) => {
          setIsExplorerModalOpen(false);
          window.location.href = `/dashboard/studio?topic=${encodeURIComponent(v.title)}`;
        }}
      />
    </div>
  );
}

export default function TrendsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Trend Scout...
        </div>
      }
    >
      <TrendsClientContent />
    </Suspense>
  );
}
