'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChannelSession } from '@/lib/session';
import { calculateVideoSEOScore, SEOResult } from '@/lib/seo-scorecard';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Video,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Lightbulb,
  Globe2,
  Share2,
  Copy,
  Check,
  Tag,
  Flame,
  Radar,
  Cpu,
  Server,
  Download,
  HelpCircle,
  Target,
  ArrowUpDown,
  Mic,
  Monitor,
  LineChart,
  Compass,
  ExternalLink,
  Play,
  Rocket,
  X,
  BookOpen,
  Calendar,
  MapPin,
  Layers,
  Wand2,
  Info,
  ArrowDown,
  ArrowUp,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface DashboardClientProps {
  session: ChannelSession;
  initialVideos: any[];
  initialAnalytics: any[];
  initialTrafficSources: any[];
  initialTopCountries: any[];
}

export default function DashboardClient({
  session,
  initialVideos,
  initialAnalytics,
  initialTrafficSources,
  initialTopCountries,
}: DashboardClientProps) {
  const [selectedVideo, setSelectedVideo] = useState<any>(initialVideos[0] || null);
  const [analyticsTab, setAnalyticsTab] = useState<'views' | 'sources' | 'geography'>('views');
  const [keywordQuery, setKeywordQuery] = useState('');
  const [keywordType, setKeywordType] = useState<'related' | 'matching' | 'questions' | 'serp'>('related');
  const [keywordTopMetrics, setKeywordTopMetrics] = useState<any>(null);
  const [keywordResults, setKeywordResults] = useState<any[]>([]);
  const [isSearchingKeywords, setIsSearchingKeywords] = useState(false);
  const [keywordSortField, setKeywordSortField] = useState<string>('overallScore');
  const [keywordSortDir, setKeywordSortDir] = useState<'asc' | 'desc'>('desc');

  // Live YouTube SERP Verification States
  const [serpVideos, setSerpVideos] = useState<any[]>([]);
  const [serpAnalysis, setSerpAnalysis] = useState<any>(null);
  const [isLoadingSerp, setIsLoadingSerp] = useState(false);
  const [serpError, setSerpError] = useState('');
  const [serpOutliersOnly, setSerpOutliersOnly] = useState(false);

  // In-line Trends Query Expansion & Outlier States
  const [expandedTrendQuery, setExpandedTrendQuery] = useState<string | null>(null);
  const [expandedTrendSerp, setExpandedTrendSerp] = useState<{
    [cacheKey: string]: { loading: boolean; videos: any[]; analysis?: any; error?: string };
  }>({});
  const [trendOutliersOnly, setTrendOutliersOnly] = useState(false);

  // Google Trends YouTube Scout States & Screenshot Filters
  const [trendsSeed, setTrendsSeed] = useState('Apple');
  const [trendsFormat, setTrendsFormat] = useState<'talking_head' | 'screencast'>('talking_head');
  const [trendsGeo, setTrendsGeo] = useState('US');
  const [trendsTimeframe, setTrendsTimeframe] = useState('today 3-m');
  const [trendsCategory, setTrendsCategory] = useState('Computers & Electronics');
  const [trendsProperty, setTrendsProperty] = useState('youtube');
  const [isScoutingTrends, setIsScoutingTrends] = useState(false);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [trendsError, setTrendsError] = useState('');
  const [suggestedTrendsKeywords, setSuggestedTrendsKeywords] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Emulation Blueprint Modal States
  const [activeEmulationVideo, setActiveEmulationVideo] = useState<any>(null);
  const [emulationBlueprint, setEmulationBlueprint] = useState<any>(null);
  const [isLoadingEmulation, setIsLoadingEmulation] = useState(false);
  const [emulationError, setEmulationError] = useState('');

  const handleOpenEmulation = async (video: any) => {
    setActiveEmulationVideo(video);
    setEmulationBlueprint(null);
    setIsLoadingEmulation(true);
    setEmulationError('');

    try {
      const res = await fetch('/api/ai/emulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: video.title,
          channelTitle: video.channelTitle,
          viewsText: video.viewsText,
          subscribersText: video.channelSubscriberCountText,
          ratio: video.viewToSubRatio,
          publishedTime: video.publishedTime,
          snippet: video.snippet,
          provider: selectedAiProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate emulation blueprint');
      setEmulationBlueprint(data);
    } catch (err: any) {
      setEmulationError(err.message || 'Error generating blueprint');
    } finally {
      setIsLoadingEmulation(false);
    }
  };

  const handleScoutTrends = async (
    e?: React.FormEvent,
    overrideFormat?: 'talking_head' | 'screencast',
    customSeed?: string,
    overrideGeo?: string,
    overrideTimeframe?: string,
    overrideCategory?: string,
    overrideProperty?: string
  ) => {
    if (e) e.preventDefault();
    const activeCategory = overrideCategory || trendsCategory;
    const rawSeed = (customSeed !== undefined ? customSeed : trendsSeed).trim();
    const seed = rawSeed || CATEGORY_DEFAULT_SEEDS[activeCategory] || 'Trending';
    if (!trendsSeed.trim() && seed) {
      setTrendsSeed(seed);
    }

    const activeFormat = overrideFormat || trendsFormat;
    const activeGeo = overrideGeo || trendsGeo;
    const activeTimeframe = overrideTimeframe || trendsTimeframe;
    const activeProperty = overrideProperty || trendsProperty;

    setIsScoutingTrends(true);
    setTrendsError('');
    try {
      const res = await fetch('/api/trends/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: seed,
          format: activeFormat,
          geo: activeGeo,
          timeframe: activeTimeframe,
          category: activeCategory,
          property: activeProperty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scout trends');
      setTrendsData(data);
      // Automatically pull live YouTube SERP for the scouted trend query!
      handleFetchLiveSerp(seed);
    } catch (err: any) {
      setTrendsError(err.message || 'Error scouting trends');
    } finally {
      setIsScoutingTrends(false);
    }
  };

  const handleSuggestSearchTerms = async () => {
    setIsLoadingSuggestions(true);
    setTrendsError('');
    try {
      const res = await fetch('/api/trends/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: trendsCategory,
          geo: trendsGeo,
          timeframe: trendsTimeframe,
          property: trendsProperty,
        }),
      });
      const data = await res.json();
      const suggestions: string[] = data.suggestions || [];
      setSuggestedTrendsKeywords(suggestions);

      // If the field is empty, automatically use the top trending keyword for this category & filters and scout it!
      if (!trendsSeed.trim() && suggestions.length > 0) {
        const topTerm = suggestions[0];
        setTrendsSeed(topTerm);
        handleScoutTrends(
          undefined,
          undefined,
          topTerm,
          trendsGeo,
          trendsTimeframe,
          trendsCategory,
          trendsProperty
        );
      }
    } catch (err: any) {
      console.error('Error suggesting search terms:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // AI Generator & Engine Provider States (Groq Cloud & Hugging Face Serverless)
  const [selectedAiProvider, setSelectedAiProvider] = useState<'auto' | 'huggingface' | 'groq'>('auto');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [copiedTags, setCopiedTags] = useState(false);
  const [dailyIdeas, setDailyIdeas] = useState<any[]>([]);
  const [isLoadingDailyIdeas, setIsLoadingDailyIdeas] = useState(false);

  // Competitor Radar States
  const [competitorQuery, setCompetitorQuery] = useState('');
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [isInspectingCompetitor, setIsInspectingCompetitor] = useState(false);
  const [competitorError, setCompetitorError] = useState('');
  const [isSwitchingChannel, setIsSwitchingChannel] = useState(false);

  const handleSwitchChannel = async (targetChannelId: string) => {
    if (targetChannelId === session.channel.id) return;
    setIsSwitchingChannel(true);
    try {
      const res = await fetch('/api/auth/switch-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: targetChannelId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitchingChannel(false);
    }
  };

  const handleInspectCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorQuery.trim()) return;

    setIsInspectingCompetitor(true);
    setCompetitorError('');
    try {
      const res = await fetch('/api/competitors/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleOrId: competitorQuery }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect channel');
      }
      setCompetitorData(data);
    } catch (err: any) {
      setCompetitorError(err.message || 'Competitor channel not found');
    } finally {
      setIsInspectingCompetitor(false);
    }
  };

  const handleCopyTags = (tagsText: string) => {
    if (!tagsText) return;
    navigator.clipboard.writeText(tagsText);
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2500);
  };

  const handleFetchDailyIdeas = async () => {
    setIsLoadingDailyIdeas(true);
    try {
      const topTitles = initialVideos.slice(0, 5).map((v) => v.title);
      const res = await fetch('/api/ai/daily-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelTitle: session.channel.title,
          topVideoTitles: topTitles,
          provider: selectedAiProvider,
        }),
      });
      const data = await res.json();
      setDailyIdeas(data.ideas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDailyIdeas(false);
    }
  };

  // Active SEO result for selected video
  const seoResult: SEOResult | null = selectedVideo
    ? calculateVideoSEOScore({
        title: selectedVideo.title,
        description: selectedVideo.description,
        tags: selectedVideo.tags,
        thumbnailUrl: selectedVideo.thumbnails?.high?.url || selectedVideo.thumbnails?.default?.url,
      })
    : null;

  const CATEGORY_DEFAULT_SEEDS: Record<string, string> = {
    'Computers & Electronics': 'Apple',
    'Internet & Telecom': 'Starlink',
    'Games': 'GTA 6',
    'Science': 'Artificial Intelligence',
    'Business & Industrial': 'Passive Income',
    'All Categories': 'Trending',
  };

  // Fetch live YouTube search page 1 (actual arrangement & video results)
  const handleFetchLiveSerp = async (customQuery?: string, outliersOnly?: boolean) => {
    const q = (customQuery || keywordQuery).trim();
    if (!q) return;
    setIsLoadingSerp(true);
    setSerpError('');
    const useOutliers = outliersOnly !== undefined ? outliersOnly : serpOutliersOnly;
    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(q)}${useOutliers ? '&outliers=true&maxSubs=20000' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch YouTube search page');
      setSerpVideos(data.videos || []);
      setSerpAnalysis(data.analysis || null);
    } catch (err: any) {
      setSerpError(err.message || 'Error fetching search results');
    } finally {
      setIsLoadingSerp(false);
    }
  };

  // In-line Expand Trends Query Handler
  const handleToggleExpandTrendQuery = async (query: string, forceOutliers?: boolean) => {
    if (expandedTrendQuery === query && forceOutliers === undefined) {
      setExpandedTrendQuery(null);
      return;
    }
    setExpandedTrendQuery(query);

    const outliers = forceOutliers !== undefined ? forceOutliers : trendOutliersOnly;
    const cacheKey = `${query}_${outliers ? 'outlier' : 'all'}`;

    if (expandedTrendSerp[cacheKey]?.videos?.length) {
      return;
    }

    setExpandedTrendSerp((prev) => ({
      ...prev,
      [cacheKey]: { loading: true, videos: [], error: '' },
    }));

    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(query)}${outliers ? '&outliers=true&maxSubs=20000' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch YouTube search results');
      setExpandedTrendSerp((prev) => ({
        ...prev,
        [cacheKey]: {
          loading: false,
          videos: data.videos || [],
          analysis: data.analysis || null,
          error: '',
        },
      }));
    } catch (err: any) {
      setExpandedTrendSerp((prev) => ({
        ...prev,
        [cacheKey]: {
          loading: false,
          videos: [],
          error: err.message || 'Error fetching search results',
        },
      }));
    }
  };

  // VidPulse Proprietary Keyword Research Engine
  const handleKeywordSearch = async (
    e?: React.FormEvent,
    overrideType?: 'related' | 'matching' | 'questions' | 'serp',
    customQuery?: string
  ) => {
    if (e) e.preventDefault();
    const targetQ = (customQuery || keywordQuery).trim();
    if (!targetQ) return;

    const activeType = overrideType || keywordType;
    if (overrideType) setKeywordType(overrideType);

    // If searching live SERP
    if (activeType === 'serp') {
      handleFetchLiveSerp(targetQ);
      return;
    }

    setIsSearchingKeywords(true);
    try {
      const res = await fetch(
        `/api/keywords?q=${encodeURIComponent(targetQ)}&type=${activeType}`
      );
      const data = await res.json();
      setKeywordTopMetrics(data.topMetrics || null);
      setKeywordResults(data.keywords || []);
      // Also silently fetch live SERP in background so user has instant data when clicking the tab
      handleFetchLiveSerp(targetQ);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingKeywords(false);
    }
  };

  const handleSortKeywords = (field: string) => {
    if (keywordSortField === field) {
      setKeywordSortDir(keywordSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setKeywordSortField(field);
      setKeywordSortDir(field === 'keyword' ? 'asc' : 'desc');
    }
  };

  const competitionRank: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    'Very High': 4,
  };

  const sortedKeywordResults = useMemo(() => {
    const list = [...keywordResults];
    list.sort((a, b) => {
      let comp = 0;
      if (keywordSortField === 'keyword') {
        comp = a.keyword.localeCompare(b.keyword);
      } else if (keywordSortField === 'competition') {
        const rankA = competitionRank[a.competition] || 2;
        const rankB = competitionRank[b.competition] || 2;
        comp = rankA - rankB;
      } else {
        comp = ((a as any)[keywordSortField] || 0) - ((b as any)[keywordSortField] || 0);
      }
      return keywordSortDir === 'asc' ? comp : -comp;
    });
    return list;
  }, [keywordResults, keywordSortField, keywordSortDir]);

  const handleExportKeywords = () => {
    if (sortedKeywordResults.length === 0) return;
    const header = 'Keyword,Related Score,Search Volume,Competition,Overall Score,Word Count,Opportunity Score\n';
    const rows = sortedKeywordResults
      .map(
        (k: any) =>
          `"${k.keyword}",${k.relatedScore},${k.searchVolume},${k.competition},${k.overallScore},${k.wordCount},${k.opportunityScore}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VidPulse_Keywords_${keywordQuery}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate AI Optimizations
  const handleRunAI = async () => {
    if (!selectedVideo) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedVideo.title,
          topic: session.channel.title,
          existingTags: selectedVideo.tags,
          provider: selectedAiProvider,
        }),
      });
      const data = await res.json();
      setAiSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderInlineExpandedQuery = (
    itemQuery: string,
    interest: number,
    changeText: string,
    isPositive: boolean
  ) => {
    const cacheKey = `${itemQuery}_${trendOutliersOnly ? 'outlier' : 'all'}`;
    const queryState = expandedTrendSerp[cacheKey];

    return (
      <div className="my-2.5 p-4 rounded-xl bg-slate-900 border border-indigo-500/40 shadow-2xl space-y-3 cursor-default">
        {/* Drawer Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white text-xs">Live Search Intel:</span>
            <span className="font-bold text-rose-300 text-xs">&quot;{itemQuery}&quot;</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
              Interest {interest}/100
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {changeText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Outliers Focus Toggle for Trends */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrendOutliersOnly(false);
                  handleToggleExpandTrendQuery(itemQuery, false);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  !trendOutliersOnly
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Page 1 Videos
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrendOutliersOnly(true);
                  handleToggleExpandTrendQuery(itemQuery, true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  trendOutliersOnly
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <Flame className="w-3 h-3 fill-current" />
                Outliers (&lt; 20k Subs)
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedTrendQuery(null);
              }}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
              title="Collapse"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        {!queryState || queryState.loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
            <span className="text-xs">Analyzing live YouTube rankings and creator subscriber sizes...</span>
          </div>
        ) : queryState.error ? (
          <div className="py-4 text-center text-xs text-rose-400 font-medium">
            {queryState.error}
          </div>
        ) : queryState.videos?.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <Flame className="w-7 h-7 text-rose-500/80 mx-auto" />
            <h5 className="text-xs font-bold text-white">
              {trendOutliersOnly
                ? 'No Breakthrough Outliers (< 20k Subs) for this Trend'
                : 'No live YouTube videos found for this query'}
            </h5>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {trendOutliersOnly
                ? 'All top results for this query are from large channels or lack high view-to-subscriber ratios.'
                : 'Try checking your connection or selecting another trending query.'}
            </p>
            {trendOutliersOnly && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTrendOutliersOnly(false);
                  handleToggleExpandTrendQuery(itemQuery, false);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Show All Page 1 Videos
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {queryState.analysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Avg Views</span>
                  <span className="font-bold text-slate-200">{queryState.analysis.averageViews?.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Top Views</span>
                  <span className="font-bold text-rose-400">{queryState.analysis.topViews?.toLocaleString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Opportunity</span>
                  <span className="font-bold text-indigo-400">{queryState.analysis.opportunityScore}/100</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Outlier Hits</span>
                  <span className="font-bold text-amber-400">{queryState.analysis.outlierVideosCount || 0}</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {queryState.videos.map((vid: any, vIdx: number) => (
                <div
                  key={`${vid.id}-${vIdx}`}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row gap-3"
                >
                  <div className="relative shrink-0 w-full sm:w-40 aspect-video rounded-md overflow-hidden bg-slate-900 border border-slate-800">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      referrerPolicy="no-referrer"
                      onError={(e: any) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white">
                      #{vIdx + 1}
                    </div>
                    {vid.lengthText && (
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-medium text-white">
                        {vid.lengthText}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-white hover:text-rose-400 transition line-clamp-2 leading-snug"
                        >
                          {vid.title}
                        </a>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-slate-500 hover:text-white"
                          title="Open on YouTube"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-slate-400">
                        {vid.channelAvatar && (
                          <img
                            src={vid.channelAvatar}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-3.5 h-3.5 rounded-full"
                          />
                        )}
                        <span className="font-semibold text-slate-300 truncate max-w-[130px]">{vid.channelTitle}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-semibold text-indigo-300">
                          👥 {vid.channelSubscriberCountText || 'Hidden'}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-200">{vid.viewsText}</span>
                        <span>•</span>
                        <span>{vid.publishedTime}</span>
                      </div>
                    </div>

                    {/* Outlier Emulation Callout */}
                    {vid.isOutlierHit && (
                      <div className="mt-2.5 p-2 rounded-lg bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                          <span>{vid.viewToSubRatio ? `${vid.viewToSubRatio}x Outlier Breakthrough` : 'Outlier Hit'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEmulation(vid);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-[10px] shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                        >
                          <Rocket className="w-3 h-3" />
                          Emulate Blueprint
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-8 text-slate-100">
      {/* Active Channel & Quick Switcher Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {session.channel.thumbnail ? (
            <img
              src={session.channel.thumbnail}
              alt={session.channel.title}
              className="w-10 h-10 rounded-full border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center font-bold text-white text-sm">
              {session.channel.title.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{session.channel.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {Number(session.channel.subscriberCount || 0).toLocaleString()} subscribers &bull; {Number(session.channel.videoCount || 0).toLocaleString()} videos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {session.channel.title !== 'Talking Tech With Williams' && (
            <button
              onClick={() => handleSwitchChannel('UCS1ajqslZXQ3Gqc65wQa6rA')}
              disabled={isSwitchingChannel}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white transition shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSwitchingChannel ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Switching Channel...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Switch to Talking Tech With Williams</span>
                </>
              )}
            </button>
          )}

          <a
            href="/api/auth/google"
            title="Switch Google Account or Brand Channel"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Switch Account
          </a>
        </div>
      </div>

        {/* Metric Overview Cards */}
        <div id="section-overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Subscribers</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {Number(session.channel.subscriberCount || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Lifetime Views</span>
              <Eye className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {Number(session.channel.viewCount || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Total Videos</span>
              <Video className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {Number(session.channel.videoCount || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Selected Video VPH</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {selectedVideo ? `${selectedVideo.vph} / hr` : '—'}
            </div>
          </div>
        </div>

        {/* Analytics Hub: Trajectory, Traffic Sources, and Audience Geography */}
        <div id="section-channel-analytics" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-white">Channel Intelligence Suite</h3>
              <p className="text-xs text-slate-400">Official YouTube Analytics API (28-day historical data)</p>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setAnalyticsTab('views')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  analyticsTab === 'views'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Views Trajectory
              </button>
              <button
                onClick={() => setAnalyticsTab('sources')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  analyticsTab === 'sources'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Traffic Sources
              </button>
              <button
                onClick={() => setAnalyticsTab('geography')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  analyticsTab === 'geography'
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                Top Countries
              </button>
            </div>
          </div>

          {/* Tab 1: Views Trajectory */}
          {analyticsTab === 'views' && (
            <div className="h-64 w-full">
              {initialAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={initialAnalytics}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No 28-day analytics report data returned by YouTube for this channel yet.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Traffic Sources */}
          {analyticsTab === 'sources' && (
            <div className="h-64 w-full">
              {initialTrafficSources.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={initialTrafficSources} layout="vertical" margin={{ left: 40, right: 20 }}>
                    <XAxis type="number" stroke="#64748b" fontSize={11} />
                    <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="views" fill="#6366f1" radius={[0, 4, 4, 0]}>
                      {initialTrafficSources.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#f43f5e' : index === 1 ? '#8b5cf6' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No traffic source breakdown available yet for this channel.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Geography */}
          {analyticsTab === 'geography' && (
            <div className="h-64 w-full">
              {initialTopCountries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={initialTopCountries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <XAxis dataKey="countryCode" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No country demographic data available yet for this channel.
                </div>
              )}
            </div>
          )}
        </div>

        {/* VidPulse Daily Ideas Hub (Powered by Gemini AI) */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-indigo-950/20 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-white">VidPulse Daily Video Ideas Predictor</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase tracking-wider">
                  {selectedAiProvider === 'huggingface' ? 'Hugging Face (Serverless)' : selectedAiProvider === 'groq' ? 'Groq Llama 3.3' : 'Groq + Hugging Face Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Predictive topic recommendations generated from your channel&apos;s recent upload velocity and niche hook patterns.
              </p>
            </div>

            <button
              onClick={handleFetchDailyIdeas}
              disabled={isLoadingDailyIdeas}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-bold transition shadow-md shadow-amber-500/10 disabled:opacity-50"
            >
              {isLoadingDailyIdeas ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate 4 Daily Ideas
                </>
              )}
            </button>
          </div>

          {dailyIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {dailyIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          idea.potential === 'Very High'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {idea.potential} Potential
                      </span>
                      <span className="text-[11px] text-slate-400">{idea.vphPrediction}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white leading-snug">
                      {idea.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-900 leading-relaxed">
                    💡 <strong className="text-slate-300">Why it works:</strong> {idea.hookReason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              Click &quot;Generate 4 Daily Ideas&quot; to calculate high-velocity video concepts tailored to your audience.
            </div>
          )}
        </div>

        {/* Main VidPulse Analysis Section: Video Selector + Scorecard + AI */}
        <div id="section-video-audit" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Video List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center justify-between">
              <span>Recent Uploads ({initialVideos.length})</span>
              <span className="text-xs text-slate-500">Low-quota cache</span>
            </h3>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {initialVideos.map((vid) => {
                const isSelected = selectedVideo?.id === vid.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => {
                      setSelectedVideo(vid);
                      setAiSuggestions(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/50'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    {vid.thumbnails?.default?.url && (
                      <img
                        src={vid.thumbnails.default.url}
                        alt=""
                        className="w-20 h-12 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {vid.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{vid.viewCount.toLocaleString()} views</span>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">{vid.vph} VPH</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: VidPulse Video Scorecard & AI Copilot (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedVideo && seoResult && (
              <>
                {/* Scorecard Header */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                      <span>Target Video Analysis</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-lg font-bold text-white leading-snug line-clamp-2">
                      {selectedVideo.title}
                    </h2>
                  </div>

                  {/* VidPulse Style Circular Grade / Score */}
                  <div className="flex items-center gap-4 shrink-0 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <div className="text-center">
                      <div className="text-3xl font-black text-rose-400">
                        {seoResult.totalScore}/100
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        SEO Score
                      </div>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-800" />
                    <div className="text-center">
                      <div className="text-2xl font-black text-indigo-400">
                        {seoResult.grade}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Grade
                      </div>
                    </div>
                  </div>
                </div>

                {/* VidPulse 10-Point Checklist */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                  <h3 className="font-semibold text-white text-sm mb-4">
                    VidPulse SEO Checklist Audit
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {seoResult.checklist.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/70 flex items-start gap-3"
                      >
                        {item.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {item.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              +{item.score} pts
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {item.feedback}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* VidIQ Video Tag Inspector & Copier */}
                <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-semibold text-white text-sm">
                        Current Video Tags ({seoResult.tagMetrics.count})
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {seoResult.tagMetrics.totalCharacters} / {seoResult.tagMetrics.maxAllowedCharacters} chars
                      </span>
                    </div>

                    {seoResult.tagMetrics.commaSeparated && (
                      <button
                        onClick={() => handleCopyTags(seoResult.tagMetrics.commaSeparated)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        {copiedTags ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied to Clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy All Tags</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedVideo.tags && selectedVideo.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No tags attached to this upload. Use the Gemini Copilot below to generate high-ranking tags.
                    </p>
                  )}
                </div>

                {/* AI Optimization Suite (Ollama / Groq) */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-purple-950/20 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h3 className="font-semibold text-white text-sm">
                          AI Video Growth Copilot
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold uppercase tracking-wider">
                          {selectedAiProvider === 'huggingface' ? 'Hugging Face' : selectedAiProvider === 'groq' ? 'Groq Cloud' : 'Auto Engine'}
                        </span>
                      </div>
                      {aiSuggestions?.activeProvider && (
                        <p className="text-[11px] text-purple-400 mt-0.5">
                          Generated via: {aiSuggestions.activeProvider}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleRunAI}
                      disabled={isGeneratingAI}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition disabled:opacity-50"
                    >
                      {isGeneratingAI ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analyzing Video...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Generate High-CTR Titles & Tags
                        </>
                      )}
                    </button>
                  </div>

                  {aiSuggestions ? (
                    <div className="space-y-4 mt-4">
                      {/* High CTR Titles with 3 Value Categories */}
                      <div>
                        <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                          High-CTR Title Angles (By Audience Value)
                        </h4>
                        <div className="space-y-2">
                          {aiSuggestions.highCtrTitles?.map((item: any, i: number) => {
                            const isObj = typeof item === 'object' && item !== null;
                            const titleText = isObj ? item.title : item;
                            const category = isObj ? item.category : (i === 0 ? 'Entertainment' : i === 1 ? 'Solution to a problem' : 'Thought provoking');
                            
                            const badgeColor =
                              category === 'Entertainment'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : category === 'Solution to a problem'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-purple-500/10 text-purple-300 border-purple-500/20';

                            const icon =
                              category === 'Entertainment'
                                ? '🎭'
                                : category === 'Solution to a problem'
                                ? '🛠️'
                                : '🧠';

                            return (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="flex items-start sm:items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                                    {icon} {category}
                                  </span>
                                  <span className="text-slate-200 font-medium">{titleText}</span>
                                </div>
                                <span className="text-[10px] text-purple-400 font-semibold shrink-0">
                                  Option {i + 1}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommended Tags */}
                      <div>
                        <h4 className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2">
                          Algorithmic Search Tags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {aiSuggestions.recommendedTags?.map((tag: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Thumbnail Concept */}
                      {aiSuggestions.thumbnailConcept && (
                        <div className="p-3 rounded-lg bg-slate-950/80 border border-purple-500/20">
                          <h4 className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5" />
                            AI Thumbnail Composition Concept
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {aiSuggestions.thumbnailConcept}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Click the button above to have Gemini AI inspect this video&apos;s title and generate high-CTR alternative titles, tag clusters, and thumbnail blueprints.
                    </p>
                  )}
                </div>
              </>
            )}

            {/* VidPulse Proprietary Research Suite: Keywords, Search Volume, Competition & Opportunity */}
            <div id="vidpulse-research-suite" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-white text-base">VidPulse Search Intelligence Engine</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      0 Quota Cost
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct live YouTube search index intelligence: Search volume, competition difficulty, overall score & opportunity rating.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {keywordQuery && (
                    <Link
                      href={`/dashboard/research?q=${encodeURIComponent(keywordQuery)}&type=${keywordType}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/30 border border-indigo-500/30"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Show Full Research Results &rarr;
                    </Link>
                  )}

                  {keywordResults.length > 0 && (
                    <button
                      onClick={handleExportKeywords}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      Export CSV
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <form onSubmit={(e) => handleKeywordSearch(e)} className="flex gap-2">
                <input
                  type="text"
                  value={keywordQuery}
                  onChange={(e) => setKeywordQuery(e.target.value)}
                  placeholder="Enter a keyword to inspect (e.g. ai, python, travel, crypto, gaming)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={isSearchingKeywords}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-rose-600/20"
                >
                  {isSearchingKeywords ? 'Analyzing...' : 'Search'}
                </button>
              </form>

              {/* 4 VidPulse Top Metric Overview Cards (Shown once searched) */}
              {keywordTopMetrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  {/* Overall Score */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-medium">Overall Score</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          keywordTopMetrics.overallScore >= 70
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : keywordTopMetrics.overallScore >= 50
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {keywordTopMetrics.overallLabel}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-white">
                      {keywordTopMetrics.overallScore}
                    </div>
                    <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full"
                        style={{ width: `${keywordTopMetrics.overallScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Search Volume */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-medium">Search Volume</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                        {keywordTopMetrics.volumeLabel}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {keywordTopMetrics.searchVolume.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Est. monthly searches</p>
                  </div>

                  {/* Competition */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-medium">Competition</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          keywordTopMetrics.competitionLabel === 'Low'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : keywordTopMetrics.competitionLabel === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {keywordTopMetrics.competitionLabel}
                      </span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      {keywordTopMetrics.competitionScore}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Creator saturation index</p>
                  </div>

                  {/* Views Per Hour Velocity */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className="font-medium">Topic Views/Hour</span>
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-black text-indigo-400">
                      {keywordTopMetrics.vph.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2">Active audience velocity</p>
                  </div>
                </div>
              )}

              {/* VidPulse Tabs: Related Keywords, Matching Terms, Questions, Live SERP */}
              {(keywordResults.length > 0 || serpVideos.length > 0 || isLoadingSerp) && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <button
                      onClick={() => {
                        setKeywordType('related');
                        handleKeywordSearch(undefined, 'related');
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        keywordType === 'related'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🔗 Related Keywords
                    </button>
                    <button
                      onClick={() => {
                        setKeywordType('matching');
                        handleKeywordSearch(undefined, 'matching');
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        keywordType === 'matching'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🔍 Matching Terms
                    </button>
                    <button
                      onClick={() => {
                        setKeywordType('questions');
                        handleKeywordSearch(undefined, 'questions');
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                        keywordType === 'questions'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ❓ Questions (High CTR)
                    </button>
                    <button
                      onClick={() => {
                        setKeywordType('serp');
                        handleFetchLiveSerp();
                      }}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                        keywordType === 'serp'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Live YouTube Search (Page 1)
                    </button>
                  </div>

                  {/* TAB CONTENT 1: Related / Matching / Questions Data Table */}
                  {keywordType !== 'serp' && (
                    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800 select-none">
                          <tr>
                            <th
                              onClick={() => handleSortKeywords('keyword')}
                              className="py-3 px-4 cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Keyword (A-Z / Z-A)"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Keyword</span>
                                {keywordSortField === 'keyword' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortKeywords('relatedScore')}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Related Score (Highest / Lowest)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>Related Score</span>
                                {keywordSortField === 'relatedScore' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortKeywords('searchVolume')}
                              className="py-3 px-4 text-right cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Search Volume (Highest / Lowest)"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Search Volume</span>
                                {keywordSortField === 'searchVolume' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortKeywords('competition')}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Competition Difficulty"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>Competition</span>
                                {keywordSortField === 'competition' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortKeywords('overallScore')}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Overall Score (Highest / Lowest)"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>Overall</span>
                                {keywordSortField === 'overallScore' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th
                              onClick={() => handleSortKeywords('wordCount')}
                              className="py-3 px-4 text-center cursor-pointer hover:bg-slate-800/60 transition group"
                              title="Sort by Word Count"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>Words</span>
                                {keywordSortField === 'wordCount' ? (
                                  keywordSortDir === 'asc' ? (
                                    <ArrowUp className="w-3 h-3 text-rose-400" />
                                  ) : (
                                    <ArrowDown className="w-3 h-3 text-rose-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
                                )}
                              </div>
                            </th>
                            <th className="py-3 px-4">Opportunity Recommendation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {sortedKeywordResults.map((kw: any, i: number) => (
                            <tr
                              key={i}
                              className="hover:bg-slate-900/50 transition cursor-pointer"
                              onClick={() => {
                                setKeywordQuery(kw.keyword);
                                handleKeywordSearch(undefined, keywordType, kw.keyword);
                              }}
                            >
                              <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                                <span>{kw.keyword}</span>
                                {kw.trend === 'up' && (
                                  <span className="text-[10px] text-emerald-400 font-bold">↑↑</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-400">
                                {i === 0 ? '—' : kw.relatedScore}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-200">
                                {kw.searchVolume.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                    kw.competition === 'Low'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : kw.competition === 'Medium'
                                      ? 'text-amber-400 bg-amber-500/10'
                                      : 'text-rose-400 bg-rose-500/10'
                                  }`}
                                >
                                  {kw.competition}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`text-[11px] font-black px-2 py-0.5 rounded ${
                                    kw.overallScore >= 70
                                      ? 'text-emerald-300 bg-emerald-500/20'
                                      : kw.overallScore >= 50
                                      ? 'text-amber-300 bg-amber-500/20'
                                      : 'text-rose-300 bg-rose-500/20'
                                  }`}
                                >
                                  {kw.overallScore}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-slate-400">
                                {kw.wordCount}
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-[11px]">
                                {kw.suggestedAction}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB CONTENT 2: Live YouTube Search Page (Actual Videos Arranged Exactly As On YouTube) */}
                  {keywordType === 'serp' && (
                    <div className="space-y-5">
                      {/* Live SERP Header with Outlier Focus Toggle (<20k Subs) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                          <span className="text-xs font-bold text-white">Live Search Results:</span>
                          <span className="text-xs font-semibold text-rose-300">&quot;{keywordQuery}&quot;</span>
                          {serpOutliersOnly ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-rose-500" />
                              Outliers Only (&lt; 20k Subs)
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              All Page 1 Videos
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Outlier Video Focus Toggle */}
                          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setSerpOutliersOnly(false);
                                handleFetchLiveSerp(keywordQuery, false);
                              }}
                              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                                !serpOutliersOnly
                                  ? 'bg-slate-800 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              All Page 1 Videos
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSerpOutliersOnly(true);
                                handleFetchLiveSerp(keywordQuery, true);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition ${
                                serpOutliersOnly
                                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                                  : 'text-rose-400 hover:text-rose-300'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5 fill-current" />
                              Breakthrough Outliers (&lt; 20k Subs)
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleFetchLiveSerp(keywordQuery, serpOutliersOnly)}
                            disabled={isLoadingSerp}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                            title="Refresh search rankings"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSerp ? 'animate-spin text-rose-400' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Graphical View Distribution Banner */}
                      {serpAnalysis && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[11px] text-slate-400">Avg Page-1 Views</span>
                              <div className="text-xl font-bold text-white mt-1">
                                {serpAnalysis.averageViews.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-slate-500">Benchmark to beat</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[11px] text-slate-400">Top Ranking Video</span>
                              <div className="text-xl font-bold text-rose-400 mt-1">
                                {serpAnalysis.topViews.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-slate-500">Highest views on page</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[11px] text-slate-400">Recent Uploads</span>
                              <div className="text-xl font-bold text-emerald-400 mt-1">
                                {serpAnalysis.recentUploadsCount}
                              </div>
                              <span className="text-[10px] text-slate-500">Under 2 months old</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[11px] text-slate-400">First-Page Opportunity</span>
                              <div className="text-xl font-bold text-indigo-400 mt-1">
                                {serpAnalysis.opportunityScore}/100
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {serpAnalysis.competitionLevel} Saturation
                              </span>
                            </div>
                          </div>

                          {/* Graphical View Distribution Bar Chart */}
                          {serpVideos.length > 0 && (
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-300">
                                  📊 YouTube Search Page-1 View Distribution Curve (Rank #1 to #{serpVideos.length})
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Real views of videos currently ranking on YouTube
                                </span>
                              </div>
                              <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={serpVideos.map((v, idx) => ({
                                      rank: `#${idx + 1}`,
                                      views: v.viewsCount,
                                      title: v.title,
                                      channel: v.channelTitle,
                                    }))}
                                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                  >
                                    <XAxis dataKey="rank" stroke="#64748b" fontSize={10} />
                                    <YAxis
                                      stroke="#64748b"
                                      fontSize={10}
                                      tickFormatter={(val) =>
                                        val >= 1000000
                                          ? `${(val / 1000000).toFixed(1)}M`
                                          : val >= 1000
                                          ? `${(val / 1000).toFixed(0)}k`
                                          : val
                                      }
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderColor: '#334155',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                      }}
                                      formatter={(val: any) => [`${Number(val).toLocaleString()} views`, 'Views']}
                                    />
                                    <Bar dataKey="views" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                                      {serpVideos.map((_, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={index === 0 ? '#f43f5e' : index < 3 ? '#8b5cf6' : '#6366f1'}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actual Video Cards Arranged Exactly As On YouTube */}
                      {isLoadingSerp ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                          <span className="text-xs font-medium">
                            Fetching actual live Page 1 results from YouTube for &quot;{keywordQuery}&quot;...
                          </span>
                        </div>
                      ) : serpVideos.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>
                              Showing <strong>{serpVideos.length} videos</strong> exactly in the order they appear on YouTube:
                            </span>
                            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                              ✓ Verified Live YouTube SERP
                            </span>
                          </div>

                          <div className="space-y-3">
                            {serpVideos.map((video, idx) => (
                              <div
                                key={video.id}
                                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row gap-4 group"
                              >
                                {/* Thumbnail + Rank Badge */}
                                <div className="relative shrink-0 w-full sm:w-56 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    referrerPolicy="no-referrer"
                                    onError={(e: any) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  />
                                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                                    #{idx + 1}
                                  </div>
                                  {video.lengthText && (
                                    <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                                      {video.lengthText}
                                    </div>
                                  )}
                                </div>

                                {/* Video Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-bold text-white hover:text-rose-400 transition line-clamp-2 leading-snug"
                                      >
                                        {video.title}
                                      </a>
                                      <a
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-slate-500 hover:text-white transition"
                                        title="Open on YouTube"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </div>

                                    {/* Channel and Stats */}
                                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                      {video.channelAvatar && (
                                        <img
                                          src={video.channelAvatar}
                                          alt={video.channelTitle}
                                          referrerPolicy="no-referrer"
                                          className="w-4 h-4 rounded-full"
                                        />
                                      )}
                                      <span className="font-semibold text-slate-300">
                                        {video.channelTitle}
                                      </span>
                                      <span>•</span>
                                      <span className="font-bold text-slate-200">
                                        {video.viewsText}
                                      </span>
                                      <span>•</span>
                                      <span>{video.publishedTime}</span>
                                    </div>

                                    {/* Snippet Description */}
                                    {video.snippet && (
                                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                        {video.snippet}
                                      </p>
                                    )}

                                    {/* Channel Subscriber Count Badge */}
                                    <div className="mt-2.5 flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-semibold text-indigo-300">
                                        👥 Channel Subscribers: {video.channelSubscriberCountText || 'Hidden'}
                                      </span>
                                      {video.viewToSubRatio > 0 && (
                                        <span className="text-[11px] text-slate-400">
                                          ({video.viewToSubRatio}x view ratio)
                                        </span>
                                      )}
                                    </div>

                                    {/* Outlier Breakthrough Callout & Emulation Trigger */}
                                    {video.isOutlierHit && (
                                      <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="space-y-1 min-w-0">
                                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                            <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                                            <span>Outlier Breakthrough ({video.viewToSubRatio ? `${video.viewToSubRatio}x` : 'Outlier Hit'})</span>
                                          </div>
                                          <p className="text-[11px] text-slate-300">
                                            This video gained high views ({video.viewsText}) relative to channel size ({video.channelSubscriberCountText || 'Small Creator'}). Click below to unlock the blueprint.
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleOpenEmulation(video)}
                                          className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                                        >
                                          <Rocket className="w-3.5 h-3.5" />
                                          Research for Emulation
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Badges */}
                                  {video.badges && video.badges.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                      {video.badges.map((b: string, bIdx: number) => (
                                        <span
                                          key={bIdx}
                                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-semibold uppercase"
                                        >
                                          {b}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                          <Flame className="w-8 h-8 text-rose-500/80 mx-auto" />
                          <h4 className="text-sm font-bold text-white">
                            {serpOutliersOnly
                              ? 'No Breakthrough Outliers (< 20k Subs) Found'
                              : 'No Search Results Available'}
                          </h4>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {serpOutliersOnly
                              ? `All videos ranking on Page 1 for "${keywordQuery}" belong to established channels with over 20k subscribers, or view counts haven't exceeded breakthrough ratios.`
                              : (serpError || 'Try searching for another keyword or topic to inspect rankings.')}
                          </p>
                          {serpOutliersOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                setSerpOutliersOnly(false);
                                handleFetchLiveSerp(keywordQuery, false);
                              }}
                              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                            >
                              Show All Page 1 Videos
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Google Trends YouTube Engine: Professional Suite with Exact Google Trends Controls */}
            <div id="section-google-trends" className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-900/70 to-rose-950/20 border border-slate-800 space-y-6">
              {/* Header Title & Format Switcher */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-white text-base">Google Trends YouTube Engine</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold uppercase">
                      Live Index
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Authentic Google Trends search interest & breakout velocity across geographical markets and categories.
                  </p>
                </div>

                {/* Filming Mode Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => {
                      setTrendsFormat('talking_head');
                      handleScoutTrends(undefined, 'talking_head');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                      trendsFormat === 'talking_head'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Talking Head
                  </button>
                  <button
                    onClick={() => {
                      setTrendsFormat('screencast');
                      handleScoutTrends(undefined, 'screencast');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                      trendsFormat === 'screencast'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    Screencast
                  </button>
                </div>
              </div>

              {/* Exact Google Trends Filter Pills Bar (from user screenshot) */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Geo Filter */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <select
                        value={trendsGeo}
                        onChange={(e) => {
                          const newGeo = e.target.value;
                          setTrendsGeo(newGeo);
                          handleScoutTrends(undefined, undefined, trendsSeed, newGeo, trendsTimeframe, trendsCategory, trendsProperty);
                        }}
                        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="US" className="bg-slate-900 text-slate-200">United States</option>
                        <option value="GB" className="bg-slate-900 text-slate-200">United Kingdom</option>
                        <option value="CA" className="bg-slate-900 text-slate-200">Canada</option>
                        <option value="AU" className="bg-slate-900 text-slate-200">Australia</option>
                        <option value="IN" className="bg-slate-900 text-slate-200">India</option>
                        <option value="NG" className="bg-slate-900 text-slate-200">Nigeria</option>
                        <option value="GLOBAL" className="bg-slate-900 text-slate-200">Worldwide</option>
                      </select>
                    </div>
                  </div>

                  {/* Timeframe Filter */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <select
                        value={trendsTimeframe}
                        onChange={(e) => {
                          const newTf = e.target.value;
                          setTrendsTimeframe(newTf);
                          handleScoutTrends(undefined, undefined, trendsSeed, trendsGeo, newTf, trendsCategory, trendsProperty);
                        }}
                        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="now 7-d" className="bg-slate-900 text-slate-200">Past 7 days</option>
                        <option value="today 1-m" className="bg-slate-900 text-slate-200">Past 30 days</option>
                        <option value="today 3-m" className="bg-slate-900 text-slate-200">Past 3 months</option>
                        <option value="today 12-m" className="bg-slate-900 text-slate-200">Past 12 months</option>
                        <option value="today 5-y" className="bg-slate-900 text-slate-200">Past 5 years</option>
                      </select>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <select
                        value={trendsCategory}
                        onChange={(e) => {
                          const newCat = e.target.value;
                          setTrendsCategory(newCat);
                          const newSeed = CATEGORY_DEFAULT_SEEDS[newCat] || trendsSeed;
                          setTrendsSeed(newSeed);
                          handleScoutTrends(undefined, undefined, newSeed, trendsGeo, trendsTimeframe, newCat, trendsProperty);
                        }}
                        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="Computers & Electronics" className="bg-slate-900 text-slate-200">Computers & Electronics</option>
                        <option value="Internet & Telecom" className="bg-slate-900 text-slate-200">Internet & Telecom</option>
                        <option value="Games" className="bg-slate-900 text-slate-200">Games & Gaming</option>
                        <option value="Science" className="bg-slate-900 text-slate-200">Science & High-Tech</option>
                        <option value="Business & Industrial" className="bg-slate-900 text-slate-200">Business & Industrial</option>
                        <option value="All Categories" className="bg-slate-900 text-slate-200">All Categories</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Filter */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition">
                      <Play className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <select
                        value={trendsProperty}
                        onChange={(e) => {
                          const newProp = e.target.value;
                          setTrendsProperty(newProp);
                          handleScoutTrends(undefined, undefined, trendsSeed, trendsGeo, trendsTimeframe, trendsCategory, newProp);
                        }}
                        className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer pr-1"
                      >
                        <option value="youtube" className="bg-slate-900 text-slate-200">YouTube Search</option>
                        <option value="web" className="bg-slate-900 text-slate-200">Web Search</option>
                        <option value="images" className="bg-slate-900 text-slate-200">Image Search</option>
                        <option value="news" className="bg-slate-900 text-slate-200">News Search</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Suggest Search Terms Quick Trigger */}
                <button
                  type="button"
                  onClick={handleSuggestSearchTerms}
                  disabled={isLoadingSuggestions}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-pink-600/30 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 hover:text-white font-semibold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Discover trending search queries within this category & filters"
                >
                  {isLoadingSuggestions ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  {isLoadingSuggestions ? 'Finding trending terms...' : 'Suggest search terms'}
                </button>
              </div>

              {/* Category-Specific Trending Suggestions Bar */}
              {suggestedTrendsKeywords.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        Trending in {trendsCategory} ({trendsGeo === 'GLOBAL' ? 'Worldwide' : trendsGeo}):
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuggestedTrendsKeywords([])}
                      className="text-slate-500 hover:text-slate-300 text-[11px] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {suggestedTrendsKeywords.map((term, idx) => {
                      const isSelected = trendsSeed.toLowerCase() === term.toLowerCase();
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setTrendsSeed(term);
                            handleScoutTrends(
                              undefined,
                              undefined,
                              term,
                              trendsGeo,
                              trendsTimeframe,
                              trendsCategory,
                              trendsProperty
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-500'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3 text-rose-400" />
                          <span>{term}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trends Search Form */}
              <form onSubmit={(e) => handleScoutTrends(e)} className="flex gap-2">
                <input
                  type="text"
                  value={trendsSeed}
                  onChange={(e) => setTrendsSeed(e.target.value)}
                  placeholder="Enter search term or keyword topic (e.g. Apple, Cursor AI, Next.js, Python, Gaming)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={isScoutingTrends}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {isScoutingTrends ? 'Mining Trends...' : 'Explore Trends'}
                </button>
              </form>

              {trendsError && (
                <div className="text-xs text-rose-400 font-medium">
                  {trendsError}
                </div>
              )}

              {/* Professional Dual Query Tables (Top Queries & Rising Queries from Screenshot) */}
              {trendsData && (
                <div className="space-y-6 pt-2">
                  {/* Screenshot Replica Dual Columns: Top queries and Rising queries */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Card 1: Top Queries Card */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-lg space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-sm">Top queries</h4>
                            <span title="Most popular search queries on YouTube" className="cursor-pointer">
                              <Info className="w-3.5 h-3.5 text-slate-500" />
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {trendsData.geo === 'US' ? 'United States' : trendsData.geo} • {trendsData.timeframe === 'today 3-m' ? 'Past 3 months' : trendsData.timeframe}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const header = 'Rank,Query,Search Interest,Change\n';
                            const rows = (trendsData.topQueries || [])
                              .map((q: any) => `${q.rank},"${q.query}",${q.interest},${q.changeText}`)
                              .join('\n');
                            const blob = new Blob([header + rows], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `top_queries_${trendsData.seed}.csv`;
                            a.click();
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="Download CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Header columns */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                        <span className="w-1/2">Query</span>
                        <span className="w-1/4 text-center">Search interest</span>
                        <span className="w-1/4 text-right">Change</span>
                      </div>

                      {/* Top queries list */}
                      <div className="divide-y divide-slate-900/80">
                        {(trendsData.topQueries || []).map((tq: any) => {
                          const isExpanded = expandedTrendQuery === tq.query;
                          return (
                            <div key={tq.rank} className="transition">
                              <div
                                onClick={() => handleToggleExpandTrendQuery(tq.query)}
                                className={`py-2.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 text-xs group ${
                                  isExpanded
                                    ? 'bg-rose-500/10 border border-rose-500/30'
                                    : 'hover:bg-slate-900/60'
                                }`}
                                title="Click to inspect rankings inline"
                              >
                                <div className="w-1/2 flex items-center gap-2.5 min-w-0" title={tq.query}>
                                  <span className="text-[11px] font-semibold text-slate-500 w-4 text-center shrink-0">
                                    {tq.rank}
                                  </span>
                                  <span 
                                    className="text-slate-200 font-medium truncate group-hover:text-rose-400 cursor-help"
                                    title={tq.query}
                                  >
                                    {tq.query}
                                  </span>
                                </div>

                                {/* Search Interest Bar */}
                                <div className="w-1/4 flex items-center justify-center">
                                  <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${tq.interest}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Percentage Change + Chevron */}
                                <div className="w-1/4 flex items-center justify-end gap-1.5 font-semibold text-xs">
                                  {tq.isPositive ? (
                                    <span className="text-emerald-400 flex items-center gap-0.5">
                                      <ArrowUp className="w-3 h-3" />
                                      {tq.changeText}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 flex items-center gap-0.5">
                                      <ArrowDown className="w-3 h-3 text-rose-400" />
                                      {tq.changeText}
                                    </span>
                                  )}
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180 text-rose-400' : ''
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* In-line Expanded Card */}
                              {isExpanded &&
                                renderInlineExpandedQuery(tq.query, tq.interest, tq.changeText, tq.isPositive)}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card 2: Rising Queries Card (Highlighted Breakout Queries) */}
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-lg space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-900">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-sm">Rising queries</h4>
                            <span title="Fastest growing search queries on YouTube" className="cursor-pointer">
                              <Info className="w-3.5 h-3.5 text-slate-500" />
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            {trendsData.geo === 'US' ? 'United States' : trendsData.geo} • {trendsData.timeframe === 'today 3-m' ? 'Past 3 months' : trendsData.timeframe}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const header = 'Rank,Query,Search Interest,Change\n';
                            const rows = (trendsData.risingQueries || [])
                              .map((q: any) => `${q.rank},"${q.query}",${q.interest},${q.changeText}`)
                              .join('\n');
                            const blob = new Blob([header + rows], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `rising_queries_${trendsData.seed}.csv`;
                            a.click();
                          }}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                          title="Download CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Header columns */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                        <span className="w-1/2">Query</span>
                        <span className="w-1/4 text-center">Search interest</span>
                        <span className="w-1/4 text-right">Change</span>
                      </div>

                      {/* Rising queries list */}
                      <div className="divide-y divide-slate-900/80">
                        {(trendsData.risingQueries || []).map((rq: any) => {
                          const isExpanded = expandedTrendQuery === rq.query;
                          return (
                            <div key={rq.rank} className="transition">
                              <div
                                onClick={() => handleToggleExpandTrendQuery(rq.query)}
                                className={`py-2.5 px-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-3 text-xs group ${
                                  isExpanded
                                    ? 'bg-indigo-500/15 border border-indigo-500/40'
                                    : rq.rank === 3
                                    ? 'bg-indigo-950/20 border border-indigo-500/20'
                                    : 'hover:bg-slate-900/60'
                                }`}
                                title="Click to inspect rankings inline"
                              >
                                <div className="w-1/2 flex items-center gap-2.5 min-w-0" title={rq.query}>
                                  <span className="text-[11px] font-semibold text-slate-500 w-4 text-center shrink-0">
                                    {rq.rank}
                                  </span>
                                  <span 
                                    className="text-slate-200 font-medium truncate group-hover:text-indigo-400 cursor-help"
                                    title={rq.query}
                                  >
                                    {rq.query}
                                  </span>
                                </div>

                                {/* Search Interest Bar */}
                                <div className="w-1/4 flex items-center justify-center">
                                  <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                    <div
                                      className="bg-indigo-500/70 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${rq.interest}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Breakout Velocity Percent + Chevron */}
                                <div className="w-1/4 flex items-center justify-end gap-1.5 font-bold text-xs text-rose-400">
                                  <div className="flex items-center gap-0.5">
                                    <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{rq.changeText}</span>
                                  </div>
                                  <ChevronDown
                                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180 text-indigo-400' : ''
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* In-line Expanded Card */}
                              {isExpanded &&
                                renderInlineExpandedQuery(rq.query, rq.interest, rq.changeText, true)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Strategic Production Blueprint: Recommended Hook, Angles & Thumbnail */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
                        ⭐ Recommended High-CTR Title Hook
                      </span>
                      <h4 className="text-lg font-black text-white mt-1 leading-snug">
                        {trendsData.primaryHookTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        💡 <strong className="text-slate-300">Why this spikes:</strong> {trendsData.whyItSpikes}
                      </p>
                    </div>

                    {/* Categorized Title Angles (Entertainment, Solution to a problem, Thought provoking) */}
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-2">
                        Targeted Value Angles (Entertainment • Solution • Thought Provoking)
                      </span>
                      <div className="space-y-2">
                        {trendsData.categorizedTitles?.map((ct: any, idx: number) => {
                          const badgeColor =
                            ct.category === 'Entertainment'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : ct.category === 'Solution to a problem'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/20';

                          const icon =
                            ct.category === 'Entertainment'
                              ? '🎭'
                              : ct.category === 'Solution to a problem'
                              ? '🛠️'
                              : '🧠';

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                                  {icon} {ct.category}
                                </span>
                                <span className="text-[10px] text-slate-500">Angle {idx + 1}</span>
                              </div>
                              <p className="font-semibold text-slate-100 text-sm mt-1">{ct.title}</p>
                              {ct.rationale && (
                                <p className="text-[11px] text-slate-400">
                                  🎯 <span className="text-slate-300">Why it works:</span> {ct.rationale}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Thumbnail Layout Blueprint */}
                    <div className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold block mb-1">
                        🎨 High-Converting Thumbnail Layout
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {trendsData.thumbnailLayout}
                      </p>
                    </div>

                    {/* Production Bullet Points & CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-900">
                      <div>
                        <span className="text-[11px] font-bold text-slate-300 block mb-2">
                          📋 Recommended Talking Outline:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                          {trendsData.productionStrategy?.talkingPoints?.map((pt: string, idx: number) => (
                            <li key={idx}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-300 block mb-2">
                          🎯 Strategic Call To Action:
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                          {trendsData.productionStrategy?.callToAction}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Direct Embedded Live YouTube SERP for Trends */}
                  <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <Play className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <h5 className="text-sm font-bold text-white">
                          Live Page 1 Results for &quot;{trendsSeed}&quot;
                        </h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                          Live Verified SERP
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Outlier focus toggle for trends seed */}
                        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSerpOutliersOnly(false);
                              handleFetchLiveSerp(trendsSeed, false);
                            }}
                            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                              !serpOutliersOnly
                                ? 'bg-slate-800 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            All Page 1 Videos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSerpOutliersOnly(true);
                              handleFetchLiveSerp(trendsSeed, true);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                              serpOutliersOnly
                                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                                : 'text-rose-400 hover:text-rose-300'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            Outliers Only (&lt; 20k Subs)
                          </button>
                        </div>

                        <button
                          onClick={() => handleFetchLiveSerp(trendsSeed, serpOutliersOnly)}
                          disabled={isLoadingSerp}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSerp ? 'animate-spin text-rose-400' : ''}`} />
                          Refresh Live SERP
                        </button>
                      </div>
                    </div>

                    {isLoadingSerp ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
                        <span className="text-xs">Fetching current top-ranking videos from YouTube...</span>
                      </div>
                    ) : serpVideos.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                          These are the actual videos YouTube is ranking on Page 1 for this trending topic right now:
                        </p>
                        <div className="space-y-3">
                          {serpVideos.map((video, idx) => (
                            <div
                              key={`trend-serp-${video.id}-${idx}`}
                              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row gap-4 group"
                            >
                              <div className="relative shrink-0 w-full sm:w-52 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                                <img
                                  src={video.thumbnail}
                                  alt={video.title}
                                  referrerPolicy="no-referrer"
                                  onError={(e: any) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                                  #{idx + 1}
                                </div>
                                {video.lengthText && (
                                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                                    {video.lengthText}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-bold text-white hover:text-rose-400 transition line-clamp-2 leading-snug"
                                    >
                                      {video.title}
                                    </a>
                                    <a
                                      href={video.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="shrink-0 text-slate-500 hover:text-white transition"
                                      title="Open on YouTube"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                                    {video.channelAvatar && (
                                      <img
                                        src={video.channelAvatar}
                                        alt={video.channelTitle}
                                        referrerPolicy="no-referrer"
                                        className="w-4 h-4 rounded-full"
                                      />
                                    )}
                                    <span className="font-semibold text-slate-300">{video.channelTitle}</span>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-semibold text-indigo-300">
                                      👥 {video.channelSubscriberCountText || 'Hidden subs'}
                                    </span>
                                    <span>•</span>
                                    <span className="font-bold text-slate-200">{video.viewsText}</span>
                                    <span>•</span>
                                    <span>{video.publishedTime}</span>
                                  </div>

                                  {video.snippet && (
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                      {video.snippet}
                                    </p>
                                  )}

                                  {/* Outlier Breakthrough Callout & Emulation Trigger */}
                                  {video.isOutlierHit && (
                                    <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                      <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                          <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                                          <span>Outlier Breakthrough ({video.viewToSubRatio ? `${video.viewToSubRatio}x` : 'Outlier Hit'})</span>
                                        </div>
                                        <p className="text-[11px] text-slate-300">
                                          High views ({video.viewsText}) relative to creator size ({video.channelSubscriberCountText || 'Small Creator'}). Click below to unlock the blueprint.
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => handleOpenEmulation(video)}
                                        className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                                      >
                                        <Rocket className="w-3.5 h-3.5" />
                                        Research for Emulation
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500">
                        {serpError || 'Click any rising query above or refresh to inspect live Page 1 results.'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* VidPulse Competitor Spy & Outlier Hit Radar */}
            <div id="section-competitor-radar" className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Radar className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-white text-sm">
                  Competitor Radar & Outlier Video Discovery
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Track any rival channel by @handle or ID to inspect their recent upload velocity and discover outlier videos breaking out of their typical view baseline.
              </p>

              <form onSubmit={handleInspectCompetitor} className="flex gap-2">
                <input
                  type="text"
                  value={competitorQuery}
                  onChange={(e) => setCompetitorQuery(e.target.value)}
                  placeholder="Enter competitor @handle (e.g. @MrBeast, @veritasium)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={isInspectingCompetitor}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  {isInspectingCompetitor ? 'Tracking...' : 'Inspect Channel'}
                </button>
              </form>

              {competitorError && (
                <div className="mt-3 text-xs text-rose-400 font-medium">
                  {competitorError}
                </div>
              )}

              {competitorData && (
                <div className="mt-5 space-y-4">
                  {/* Competitor Header */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {competitorData.channel.thumbnail && (
                        <img
                          src={competitorData.channel.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                        />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {competitorData.channel.title}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {competitorData.channel.customUrl || competitorData.channel.id}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-200">
                        {Number(competitorData.channel.subscriberCount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500">
                        Subscribers
                      </div>
                    </div>
                  </div>

                  {/* Outlier Videos */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Recent High-Velocity Uploads (VPH)
                    </h4>

                    <div className="space-y-2">
                      {competitorData.topOutliers.map((vid: any) => (
                        <div
                          key={vid.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            vid.isOutlier
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-slate-950/60 border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {vid.thumbnail && (
                              <img
                                src={vid.thumbnail}
                                alt=""
                                className="w-16 h-10 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-semibold text-slate-200 truncate">
                                {vid.title}
                              </h5>
                              <div className="text-[11px] text-slate-400">
                                {vid.views.toLocaleString()} views
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs font-bold text-amber-400">
                              {vid.vph} VPH
                            </span>
                            {vid.isOutlier && (
                              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                                🔥 Outlier Hit
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Emulation Blueprint Modal */}
      {activeEmulationVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                    <Rocket className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">Outlier Emulation Blueprint</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30">
                    High View-to-Sub Outlier
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Reverse-engineered viral blueprint for small creators to duplicate this high-CTR format.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveEmulationVideo(null);
                  setEmulationBlueprint(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Outlier Video Summary Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-4">
              <img
                src={activeEmulationVideo.thumbnail}
                alt={activeEmulationVideo.title}
                referrerPolicy="no-referrer"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://i.ytimg.com/vi/${activeEmulationVideo.id}/hqdefault.jpg`;
                }}
                className="w-full sm:w-44 aspect-video rounded-lg object-cover bg-slate-900 shrink-0"
              />
              <div className="space-y-2 flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white line-clamp-2">
                  {activeEmulationVideo.title}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span className="text-slate-300 font-semibold">{activeEmulationVideo.channelTitle}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-semibold">
                    👥 {activeEmulationVideo.channelSubscriberCountText || 'Small Creator'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">
                    🔥 {activeEmulationVideo.viewsText}
                  </span>
                  {activeEmulationVideo.viewToSubRatio > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold text-[10px]">
                      {activeEmulationVideo.viewToSubRatio}x Outlier Ratio
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingEmulation && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                <span className="text-sm font-medium">
                  Deconstructing viral hooks, packaging angles & script outline...
                </span>
                <span className="text-xs text-slate-500">
                  Powered by {selectedAiProvider === 'groq' ? 'Groq Cloud' : selectedAiProvider === 'huggingface' ? 'Hugging Face' : 'VidPulse AI Engine'}
                </span>
              </div>
            )}

            {/* Error State */}
            {emulationError && !isLoadingEmulation && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {emulationError}
              </div>
            )}

            {/* Generated Emulation Blueprint */}
            {emulationBlueprint && !isLoadingEmulation && (
              <div className="space-y-5">
                {/* 1. Why It Worked (Algorithmic & Psychological Breakout) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <Flame className="w-4 h-4 fill-current" />
                    <span>Why This Outlier Succeeded (Without an Audience)</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {emulationBlueprint.whyItWorked?.map((reason: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">
                        {reason}
                      </li>
                    ))}
                  </ul>
                  {emulationBlueprint.curiosityGapAngle && (
                    <p className="mt-2 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      💡 <strong className="text-slate-200">Curiosity Gap Trigger:</strong> {emulationBlueprint.curiosityGapAngle}
                    </p>
                  )}
                </div>

                {/* 2. Emulation Titles (Categorized Angles) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    3 High-CTR Title Angles You Can Use Right Now
                  </span>
                  <div className="space-y-2">
                    {emulationBlueprint.emulationTitles?.map((t: any, idx: number) => {
                      const badgeColor =
                        t.category === 'Entertainment'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : t.category === 'Solution to a problem'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/20';

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                              {t.category}
                            </span>
                            <div className="font-bold text-white text-sm mt-0.5">{t.title}</div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(t.title)}
                            className="shrink-0 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                            title="Copy Title"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Thumbnail Packaging Blueprint */}
                {emulationBlueprint.thumbnailConcept && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                      🎨 Thumbnail Visual Formula
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block">Bold Text Overlay</span>
                        <span className="font-extrabold text-white text-sm mt-0.5 block">
                          &quot;{emulationBlueprint.thumbnailConcept.boldTextOverlay}&quot;
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 block">Scroll-Stopping Cue</span>
                        <span className="text-slate-300 text-xs mt-0.5 block">
                          {emulationBlueprint.thumbnailConcept.visualContrastTrick}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 pt-1 leading-relaxed">
                      <strong>Visual Layout:</strong> {emulationBlueprint.thumbnailConcept.visualLayout}
                    </p>
                  </div>
                )}

                {/* 4. First 60-Second Retention Hook */}
                {emulationBlueprint.first60SecondsScript && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      ⏱️ 60-Second Retention Script Hook
                    </span>
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed font-mono">
                      &quot;{emulationBlueprint.first60SecondsScript}&quot;
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      Tip: Keep visual cuts under 4 seconds in the first 30 seconds to preserve algorithm velocity.
                    </span>
                  </div>
                )}

                {/* 5. Strategic Tags */}
                {emulationBlueprint.strategicTags && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recommended Search Index Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {emulationBlueprint.strategicTags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
