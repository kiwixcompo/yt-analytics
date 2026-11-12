'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Bookmark,
  Check,
  Rocket,
  Flame,
  ArrowRight,
  Filter,
  Layers,
  Copy,
} from 'lucide-react';
import { DugKeywordItem } from '@/app/api/keywords/dig/route';

interface KeywordDeepDiveModalProps {
  keyword: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectKeyword: (kw: string) => void;
  onOpenStudio?: (kw: string) => void;
}

export default function KeywordDeepDiveModal({
  keyword,
  isOpen,
  onClose,
  onSelectKeyword,
  onOpenStudio,
}: KeywordDeepDiveModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'exact' | 'similar'>('all');
  const [results, setResults] = useState<DugKeywordItem[]>([]);
  const [totalExact, setTotalExact] = useState(0);
  const [totalSimilar, setTotalSimilar] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && keyword) {
      fetchDeepDive(keyword, activeTab);
    }
  }, [isOpen, keyword, activeTab]);

  const fetchDeepDive = async (targetKw: string, mode: 'all' | 'exact' | 'similar') => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/keywords/dig?q=${encodeURIComponent(targetKw)}&mode=${mode}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotalExact(data.totalExact || 0);
        setTotalSimilar(data.totalSimilar || 0);
      }
    } catch (err) {
      console.error('Deep dive fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (kw: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(kw);
    setCopiedKw(kw);
    setTimeout(() => setCopiedKw(null), 2000);
  };

  if (!isOpen || !keyword) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Search className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                <span>Dug Investigation:</span>
                <span className="text-indigo-400">&quot;{keyword}&quot;</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Examining all deep queries containing this exact term or highly relevant semantic variations.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs Bar */}
        <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Dug Queries ({totalExact + totalSimilar})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('exact')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'exact'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-300" />
              <span>Exact Match In Keywords ({totalExact})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('similar')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activeTab === 'similar'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-300 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-300" />
              <span>Similar &amp; Semantic ({totalSimilar})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Click any phrase to switch your primary research search
          </div>
        </div>

        {/* Body Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span>Digging deeper into keyword variations &amp; search demand...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No matching dug keywords discovered for &quot;{keyword}&quot;.
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.keyword + idx}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[11px] font-mono text-slate-500 w-6 shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs group-hover:text-indigo-300 transition">
                        {item.keyword}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold border ${
                          item.matchType === 'exact'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {item.matchType === 'exact' ? 'Exact Match' : 'Similar Topic'}
                      </span>
                      {item.trend === 'up' && (
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                          ↑ Rising
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics + Action Buttons */}
                <div className="flex items-center gap-4 shrink-0 text-xs self-end sm:self-auto">
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Vol</span>
                      <span className="font-mono font-bold text-slate-200">
                        {item.searchVolume.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Comp</span>
                      <span
                        className={`font-semibold ${
                          item.competition === 'Low'
                            ? 'text-emerald-400'
                            : item.competition === 'Medium'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {item.competition}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Score</span>
                      <span className="font-bold text-indigo-300 font-mono">
                        {item.overallScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(item.keyword, e)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                      title="Copy keyword"
                    >
                      {copiedKw === item.keyword ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectKeyword(item.keyword);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer"
                    >
                      <Search className="w-3 h-3" />
                      <span>Search This</span>
                    </button>

                    {onOpenStudio && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenStudio(item.keyword);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Rocket className="w-3 h-3" />
                        <span>Studio</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Found {results.length} total keyword opportunities</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
