'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Radar,
  Users,
  Video,
  Flame,
  Search,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Rocket,
  Check,
  TrendingUp,
  BarChart2,
  Calendar,
  Eye,
  ArrowUpRight,
} from 'lucide-react';
import OutlierExplorerModal, { SUBSCRIBER_RANGES } from '../components/outlier-explorer-modal';

interface CompetitorChannel {
  id: string;
  title: string;
  customUrl?: string;
  thumbnail?: string;
  subscriberCount?: number;
  videoCount?: number;
  medianViews?: number;
  recentVideos?: any[];
  outlierVideos?: any[];
  addedAt?: string;
}

const DEFAULT_WATCHLIST: string[] = ['@MrBeast', '@mkbhd', '@Fireship'];

function CompetitorsClientContent() {
  const [handleInput, setHandleInput] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Saved channels list
  const [trackedChannels, setTrackedChannels] = useState<CompetitorChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<CompetitorChannel | null>(null);

  // Filter & Outlier Sub-range state
  const [outlierSubRange, setOutlierSubRange] = useState<string>('all');
  const [outliersOnly, setOutliersOnly] = useState<boolean>(true);

  // Explorer Modal state
  const [selectedExplorerVideo, setSelectedExplorerVideo] = useState<any | null>(null);
  const [isExplorerModalOpen, setIsExplorerModalOpen] = useState<boolean>(false);

  // Load tracked channels from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vidpulse_tracked_competitors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize any previously saved records that may lack a title
          const normalized = parsed.map((item: any) => {
            const chan = item.channel || item;
            return {
              id: chan.id || item.id || 'unknown',
              title: chan.title || item.title || chan.customUrl || item.customUrl || 'Competitor Channel',
              customUrl: chan.customUrl || item.customUrl || '',
              thumbnail: chan.thumbnail || item.thumbnail || '',
              subscriberCount: Number(chan.subscriberCount || item.subscriberCount || 0),
              videoCount: Number(chan.videoCount || item.videoCount || 0),
              medianViews: item.medianViews || 0,
              recentVideos: item.recentVideos || item.topOutliers || [],
              outlierVideos: item.outlierVideos || item.topOutliers || [],
              addedAt: item.addedAt || new Date().toISOString(),
            };
          });
          setTrackedChannels(normalized);
          setSelectedChannel(normalized[0]);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // If nothing saved, inspect first default
    inspectChannel('@Fireship', true);
  }, []);

  const saveChannelsToStorage = (channels: CompetitorChannel[]) => {
    setTrackedChannels(channels);
    try {
      localStorage.setItem('vidpulse_tracked_competitors', JSON.stringify(channels));
    } catch (e) {
      console.error(e);
    }
  };

  const inspectChannel = async (targetHandle: string, autoSelect = false) => {
    if (!targetHandle.trim()) return;
    setIsInspecting(true);
    setInspectError(null);

    try {
      const res = await fetch('/api/competitors/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handleOrId: targetHandle.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to inspect channel');
      }

      const data = await res.json();
      
      // Handle both raw channel object and { channel, topOutliers } wrapper structure
      const rawChan = data.channel || data;
      const rawOutliers = data.topOutliers || data.outlierVideos || [];
      const rawRecent = data.recentVideos || data.topOutliers || [];

      // Calculate median views if not present
      let median = rawChan.medianViews || data.medianViews;
      if (!median && rawRecent.length > 0) {
        const sortedViews = [...rawRecent].map((v: any) => v.views || v.viewCount || 0).sort((a, b) => a - b);
        const mid = Math.floor(sortedViews.length / 2);
        median = sortedViews.length % 2 !== 0 ? sortedViews[mid] : Math.round((sortedViews[mid - 1] + sortedViews[mid]) / 2);
      }

      const channelData: CompetitorChannel = {
        id: rawChan.id || targetHandle,
        title: rawChan.title || targetHandle.replace('@', ''),
        customUrl: rawChan.customUrl || targetHandle,
        thumbnail: rawChan.thumbnail || rawChan.thumbnails?.default?.url || '',
        subscriberCount: Number(rawChan.subscriberCount || 0),
        videoCount: Number(rawChan.videoCount || 0),
        medianViews: median || 0,
        recentVideos: rawRecent,
        outlierVideos: rawOutliers,
        addedAt: new Date().toISOString(),
      };

      // Add to tracked list if not already present
      setTrackedChannels((prev) => {
        const exists = prev.some((c) => c.id === channelData.id);
        const updated = exists
          ? prev.map((c) => (c.id === channelData.id ? channelData : c))
          : [channelData, ...prev];
        try {
          localStorage.setItem('vidpulse_tracked_competitors', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (autoSelect || !selectedChannel) {
        setSelectedChannel(channelData);
      }
      setHandleInput('');
    } catch (err: any) {
      console.error(err);
      setInspectError(err.message || 'Error inspecting competitor channel');
    } finally {
      setIsInspecting(false);
    }
  };

  const removeChannel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = trackedChannels.filter((c) => c.id !== id);
    saveChannelsToStorage(updated);
    if (selectedChannel?.id === id) {
      setSelectedChannel(updated.length > 0 ? updated[0] : null);
    }
  };

  // Filter video lists based on outlier toggle
  const displayedVideos = selectedChannel
    ? outliersOnly && selectedChannel.outlierVideos && selectedChannel.outlierVideos.length > 0
      ? selectedChannel.outlierVideos
      : selectedChannel.recentVideos || []
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500/20 to-purple-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-md">
              <Radar className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Competitor Radar</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  Channel Spy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track rival channels, compute historical median views, and instantly detect outlier videos exceeding 2.5x baseline performance.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Add Channel Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inspectChannel(handleInput, true);
          }}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              value={handleInput}
              onChange={(e) => setHandleInput(e.target.value)}
              placeholder="Add channel (@handle or ID)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isInspecting || !handleInput.trim()}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isInspecting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Track</span>
          </button>
        </form>
      </div>

      {inspectError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {inspectError}
        </div>
      )}

      {/* Main Tracked Channels Grid & Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Tracked Channels Watchlist */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>Watchlist ({trackedChannels.length})</span>
            <span className="text-[11px] text-slate-500">Click to inspect</span>
          </div>

          <div className="space-y-2">
            {trackedChannels.map((c) => {
              const isSelected = selectedChannel?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedChannel(c)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 border-rose-500/50 shadow-md ring-1 ring-rose-500/30'
                      : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.title || 'Channel'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {(c.title || c.customUrl || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-200 text-xs truncate">{c.title || c.customUrl || 'Channel'}</h4>
                      <p className="text-[11px] text-slate-400">
                        {c.subscriberCount ? `${c.subscriberCount.toLocaleString()} subs` : c.customUrl || 'Channel'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => removeChannel(c.id, e)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer shrink-0"
                    title="Remove channel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {trackedChannels.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500 space-y-2">
                <p>No competitor channels tracked yet.</p>
                <div className="flex flex-wrap gap-1 justify-center pt-1">
                  {DEFAULT_WATCHLIST.map((handle) => (
                    <button
                      key={handle}
                      type="button"
                      onClick={() => inspectChannel(handle, true)}
                      className="px-2 py-1 rounded bg-slate-900 text-[10px] text-indigo-300 hover:text-white border border-slate-800 cursor-pointer"
                    >
                      + {handle}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Channel Intel & Outlier Grid */}
        <div className="lg:col-span-3 space-y-6">
          {selectedChannel ? (
            <div className="space-y-6">
              {/* Channel Stats Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-rose-950/20 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {selectedChannel.thumbnail && (
                      <img
                        src={selectedChannel.thumbnail}
                        alt={selectedChannel.title}
                        className="w-12 h-12 rounded-full border border-slate-700 object-cover shadow-md"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{selectedChannel.title}</h2>
                        {selectedChannel.customUrl && (
                          <span className="text-xs text-indigo-400 font-medium">{selectedChannel.customUrl}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Historical median view benchmark calculated across recent uploads
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => inspectChannel(selectedChannel.customUrl || selectedChannel.id)}
                    disabled={isInspecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isInspecting ? 'animate-spin' : ''}`} />
                    <span>Re-scan Channel</span>
                  </button>
                </div>

                {/* Metrics 3-box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Subscribers</span>
                    <p className="text-base font-bold text-white mt-1">
                      {selectedChannel.subscriberCount?.toLocaleString() || 'Hidden'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Uploaded Videos</span>
                    <p className="text-base font-bold text-white mt-1">
                      {selectedChannel.videoCount?.toLocaleString() || '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-medium">Median Views</span>
                    <p className="text-base font-bold text-indigo-400 mt-1">
                      {selectedChannel.medianViews ? `${selectedChannel.medianViews.toLocaleString()} views` : '—'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[11px] text-rose-400 font-bold">Detected Outliers</span>
                    <p className="text-base font-bold text-rose-300 mt-1">
                      {selectedChannel.outlierVideos?.length || 0} breakout videos
                    </p>
                  </div>
                </div>
              </div>

              {/* Videos Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOutliersOnly(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      outliersOnly
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>Outliers Only ({selectedChannel.outlierVideos?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutliersOnly(false)}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                      !outliersOnly
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    All Recent Uploads ({selectedChannel.recentVideos?.length || 0})
                  </button>
                </div>
              </div>

              {/* Video Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedVideos.map((vid: any) => {
                  const isOutlier = vid.isOutlier || (selectedChannel.medianViews && vid.views >= selectedChannel.medianViews * 2.5);
                  const multiplier = selectedChannel.medianViews && selectedChannel.medianViews > 0
                    ? (vid.views / selectedChannel.medianViews).toFixed(1)
                    : null;

                  return (
                    <div
                      key={vid.videoId || vid.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-lg space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        {vid.thumbnail && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                            <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                            {multiplier && (
                              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-rose-600/90 text-white text-[11px] font-bold shadow-md flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-current" />
                                <span>{multiplier}x Median</span>
                              </div>
                            )}
                          </div>
                        )}

                        <h4 className="font-bold text-slate-200 text-xs line-clamp-2 leading-snug">
                          {vid.title}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-100">{vid.views?.toLocaleString()} views</span>
                          <span>&bull;</span>
                          <span>{vid.publishedAt ? new Date(vid.publishedAt).toLocaleDateString() : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExplorerVideo({
                              videoId: vid.videoId || vid.id,
                              title: vid.title,
                              thumbnail: vid.thumbnail,
                              channelTitle: selectedChannel.title,
                              viewsText: `${vid.views?.toLocaleString()} views`,
                              views: vid.views,
                              channelSubscriberCountText: selectedChannel.subscriberCount?.toLocaleString() || '',
                              channelSubscribers: selectedChannel.subscriberCount,
                              publishedTime: vid.publishedAt,
                              url: `https://www.youtube.com/watch?v=${vid.videoId || vid.id}`,
                            });
                            setIsExplorerModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white text-[11px] font-bold transition cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Find Similar</span>
                        </button>

                        <Link
                          href={`/dashboard/studio?topic=${encodeURIComponent(vid.title)}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
                        >
                          <Rocket className="w-3 h-3" />
                          <span>Emulate Blueprint</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedVideos.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
                  No videos matched the current filters.
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
              Select or add a competitor channel from the watchlist to inspect its video breakout analytics.
            </div>
          )}
        </div>
      </div>

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

export default function CompetitorsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Competitor Radar...
        </div>
      }
    >
      <CompetitorsClientContent />
    </Suspense>
  );
}
