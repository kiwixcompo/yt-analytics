'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Share2,
  Globe2,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Layers,
  Film,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface AnalyticsDataPoint {
  date: string;
  views: number;
  watchTimeMinutes: number;
  avgViewDurationSec: number;
  subscribersGained: number;
  subscribersLost: number;
}

interface TrafficSource {
  sourceKey: string;
  label: string;
  views: number;
  watchTimeMinutes: number;
}

interface TopCountry {
  countryCode: string;
  views: number;
  watchTimeMinutes: number;
}

interface VideoItem {
  id: string;
  title: string;
  publishedAt: string;
  thumbnails?: any;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  vph: number;
}

interface ChannelInfo {
  title: string;
  id: string;
  subscriberCount: number | string;
  viewCount: number | string;
  videoCount: number | string;
  thumbnail?: string;
}

export default function AnalyticsClient() {
  const [days, setDays] = useState<number>(28);
  const [activeTab, setActiveTab] = useState<'views' | 'watchtime' | 'subscribers' | 'sources' | 'geography'>('views');
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsDataPoint[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [error, setError] = useState<string>('');

  const fetchAnalytics = async (selectedDays = days) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/youtube/analytics?days=${selectedDays}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load analytics');
      }
      setChannel(data.channel);
      setAnalytics(data.analytics || []);
      setTrafficSources(data.trafficSources || []);
      setTopCountries(data.topCountries || []);
      setVideos(data.videos || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(days);
  }, [days]);

  // Totals & Averages calculations
  const totalPeriodViews = analytics.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalWatchTimeHours = Math.round(
    analytics.reduce((acc, curr) => acc + (curr.watchTimeMinutes || 0), 0) / 60
  );
  const netSubscribers = analytics.reduce(
    (acc, curr) => acc + ((curr.subscribersGained || 0) - (curr.subscribersLost || 0)),
    0
  );
  const avgViewsPerDay = analytics.length > 0 ? Math.round(totalPeriodViews / analytics.length) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Channel Performance Analytics
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  Official YouTube API
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {channel ? channel.title : 'Active Channel'} &bull; Real-time subscriber cohort trends, traffic attribution, and watch time.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {[
              { label: '7 Days', val: 7 },
              { label: '28 Days', val: 28 },
              { label: '90 Days', val: 90 },
            ].map((d) => (
              <button
                key={d.val}
                onClick={() => setDays(d.val)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  days === d.val
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchAnalytics(days)}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Period Views</span>
            <Eye className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {isLoading ? '...' : totalPeriodViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Avg ~{avgViewsPerDay.toLocaleString()} views/day in last {days} days
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Estimated Watch Time</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">
            {isLoading ? '...' : `${totalWatchTimeHours.toLocaleString()} hrs`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total minutes watched / 60</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Net Subscribers</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400">
            {isLoading ? '...' : `${netSubscribers >= 0 ? '+' : ''}${netSubscribers.toLocaleString()}`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gained vs. Lost in timeframe</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>Channel Subscribers</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {channel ? Number(channel.subscriberCount || 0).toLocaleString() : '—'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {channel ? Number(channel.videoCount || 0).toLocaleString() : '0'} published videos
          </p>
        </div>
      </div>

      {/* Main Chart Section with Multi-Tab Switcher */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Trend Trajectory &amp; Audience Acquisition
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Official YouTube Analytics report across the chosen {days}-day window.
            </p>
          </div>

          {/* Metric Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('views')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'views'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Views
            </button>
            <button
              onClick={() => setActiveTab('watchtime')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'watchtime'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Watch Time (Mins)
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'subscribers'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Subscribers Gained
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'sources'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3 h-3" />
              Traffic Sources
            </button>
            <button
              onClick={() => setActiveTab('geography')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'geography'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              Top Countries
            </button>
          </div>
        </div>

        {/* View Chart */}
        {activeTab === 'views' && (
          <div className="h-72 w-full">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="analyticsColorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} views`, 'Views']}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsColorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading trajectory data...' : 'No view data available for this timeframe.'}
              </div>
            )}
          </div>
        )}

        {/* Watch Time Chart */}
        {activeTab === 'watchtime' && (
          <div className="h-72 w-full">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="analyticsColorWatch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} mins`, 'Watch Time']}
                  />
                  <Area
                    type="monotone"
                    dataKey="watchTimeMinutes"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsColorWatch)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading watch time data...' : 'No watch time data available for this timeframe.'}
              </div>
            )}
          </div>
        )}

        {/* Subscribers Gained Chart */}
        {activeTab === 'subscribers' && (
          <div className="h-72 w-full">
            {analytics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`+${val} subscribers`, 'Subscribers Gained']}
                  />
                  <Bar dataKey="subscribersGained" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading subscriber growth data...' : 'No subscriber data available for this timeframe.'}
              </div>
            )}
          </div>
        )}

        {/* Traffic Sources Chart */}
        {activeTab === 'sources' && (
          <div className="h-72 w-full">
            {trafficSources.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficSources} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="label" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} views`, 'Attributed Views']}
                  />
                  <Bar dataKey="views" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {trafficSources.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#10b981' : index === 1 ? '#06b6d4' : '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading traffic attribution...' : 'No traffic sources available yet for this channel.'}
              </div>
            )}
          </div>
        )}

        {/* Geography Chart */}
        {activeTab === 'geography' && (
          <div className="h-72 w-full">
            {topCountries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCountries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <XAxis dataKey="countryCode" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} views`, 'Views']}
                  />
                  <Bar dataKey="views" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isLoading ? 'Loading geographic breakdown...' : 'No country demographics returned yet for this channel.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Velocity & Recent Videos Performance */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              Recent Video Performance &amp; VPH Velocity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant analysis of your latest uploads ranked by views and views-per-hour (VPH).
            </p>
          </div>
          <span className="text-xs text-slate-500">Showing {videos.length} videos</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Video Title</th>
                <th className="py-3 px-4 text-center">Published</th>
                <th className="py-3 px-4 text-right">Total Views</th>
                <th className="py-3 px-4 text-center">Velocity (VPH)</th>
                <th className="py-3 px-4 text-right">Likes</th>
                <th className="py-3 px-4 text-center">Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {videos.map((vid) => (
                <tr key={vid.id} className="hover:bg-slate-900/50 transition">
                  <td className="py-3 px-4 flex items-center gap-3">
                    {vid.thumbnails?.default?.url && (
                      <img
                        src={vid.thumbnails.default.url}
                        alt=""
                        className="w-12 h-7 rounded object-cover shrink-0 border border-slate-800"
                      />
                    )}
                    <a
                      href={`https://www.youtube.com/watch?v=${vid.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-200 hover:text-rose-400 transition line-clamp-1 max-w-sm"
                    >
                      {vid.title}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {vid.publishedAt ? new Date(vid.publishedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-200">
                    {vid.viewCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        vid.vph > 50
                          ? 'bg-rose-500/10 text-rose-400'
                          : vid.vph > 10
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {vid.vph} / hr
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {vid.likeCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/dashboard/studio?topic=${encodeURIComponent(vid.title)}`}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition"
                    >
                      Generate Hooks &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
