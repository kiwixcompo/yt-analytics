'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Search,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X,
  Users,
  Eye,
  Clock,
  Rocket,
  Filter,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SerpVideo } from '@/app/api/youtube/search/route';

export interface OutlierExplorerProps {
  video: SerpVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEmulation?: (video: SerpVideo) => void;
}

export const SUBSCRIBER_RANGES = [
  { label: 'All Channels', value: 'all' },
  { label: '0 to 1,000 (Nano)', value: '0-1k' },
  { label: '1,001 to 5,000 (Micro)', value: '1k-5k' },
  { label: '5,001 to 10,000', value: '5k-10k' },
  { label: '10,001 to 20,000 (Breakout)', value: '10k-20k' },
  { label: '20,001 to 50,000', value: '20k-50k' },
  { label: 'Below 100,000 (< 100k)', value: 'under-100k' },
];

export default function OutlierExplorerModal({
  video,
  isOpen,
  onClose,
  onOpenEmulation,
}: OutlierExplorerProps) {
  const [similarityMode, setSimilarityMode] = useState<'outlier_exact' | 'topic_semantic'>('outlier_exact');
  const [selectedSubRange, setSelectedSubRange] = useState<string>('under-100k');
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [similarVideos, setSimilarVideos] = useState<SerpVideo[]>([]);
  const [matchedQuery, setMatchedQuery] = useState('');
  const [error, setError] = useState('');

  const fetchSimilarVideos = async () => {
    if (!video) return;
    setIsLoadingSimilar(true);
    setError('');

    try {
      const url = `/api/youtube/similar?title=${encodeURIComponent(video.title)}&videoId=${encodeURIComponent(
        video.id
      )}&mode=${similarityMode}&subRange=${selectedSubRange}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch similar videos');
      setSimilarVideos(data.similarVideos || []);
      setMatchedQuery(data.matchedQuery || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error finding similar videos');
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  useEffect(() => {
    if (isOpen && video) {
      fetchSimilarVideos();
    }
  }, [isOpen, video, similarityMode, selectedSubRange]);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                  Outlier Video Intelligence &amp; Similar Breakouts
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold shrink-0">
                  {video.viewToSubRatio ? `${video.viewToSubRatio}x View Velocity` : 'Outlier Hit'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Dissect why this video broke out and discover matching videos with similar creator dynamics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Target Video Spotlight Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-4">
            <div className="relative shrink-0 w-full sm:w-56 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {video.lengthText && (
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                  {video.lengthText}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
              <div>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-white hover:text-rose-400 text-sm sm:text-base line-clamp-2 leading-snug transition flex items-start gap-1.5"
                >
                  <span>{video.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 mt-1" />
                </a>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">{video.channelTitle}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-200">{video.viewsText}</span>
                  <span>•</span>
                  <span>{video.publishedTime}</span>
                </div>
              </div>

              {/* Creator Size & Multiplier Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Channel Subs</span>
                  <span className="font-bold text-indigo-300">
                    {video.channelSubscriberCountText || 'Hidden'}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">View Velocity Multiplier</span>
                  <span className="font-bold text-rose-400">
                    {video.viewToSubRatio ? `${video.viewToSubRatio}x Subscriber Base` : 'Breakout Ratio'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/studio?topic=${encodeURIComponent(video.title)}`}
                    className="w-full h-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Emulate in Studio &rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* SIMILAR OUTLIER EXPLORER TOOLBAR */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  <span>Discover Similar High-Leverage Videos</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Find more videos matching this video&apos;s exact outlier status or topic cluster.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSimilarityMode('outlier_exact')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    similarityMode === 'outlier_exact'
                      ? 'bg-rose-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Exact Outlier Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSimilarityMode('topic_semantic')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    similarityMode === 'topic_semantic'
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Same Topic Angle</span>
                </button>
              </div>
            </div>

            {/* Subscriber Count Bracket Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-300 font-medium">Channel Subscriber Range:</span>
                <select
                  value={selectedSubRange}
                  onChange={(e) => setSelectedSubRange(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-rose-300 font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {SUBSCRIBER_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-slate-500">
                Found {similarVideos.length} matching video{similarVideos.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Similar Videos List */}
          {isLoadingSimilar ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
              <span className="text-xs">Finding similar breakout videos from YouTube...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : similarVideos.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">No matching similar videos found in this subscriber bracket.</p>
              <p className="text-[11px] text-slate-500">Try changing the channel subscriber filter to &quot;All Channels&quot; or &quot;Below 100k&quot;.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {similarVideos.map((sim, sIdx) => (
                <div
                  key={sim.id + sIdx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0 w-28 aspect-video rounded-md overflow-hidden bg-slate-900 border border-slate-800">
                      <img
                        src={sim.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {sim.lengthText && (
                        <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[8px] font-semibold text-white">
                          {sim.lengthText}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <a
                        href={sim.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-xs text-white hover:text-rose-400 transition line-clamp-1 leading-snug"
                      >
                        {sim.title}
                      </a>

                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <span className="text-slate-300 font-medium">{sim.channelTitle}</span>
                        <span>•</span>
                        <span className="font-bold text-slate-200">{sim.viewsText}</span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-indigo-300 font-medium">
                          👥 {sim.channelSubscriberCountText || 'Hidden'}
                        </span>
                        {sim.viewToSubRatio ? (
                          <span className="text-rose-400 font-bold">
                            🔥 {sim.viewToSubRatio}x ratio
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link
                      href={`/dashboard/studio?topic=${encodeURIComponent(sim.title)}`}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold text-[11px] transition"
                    >
                      Use Topic &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
