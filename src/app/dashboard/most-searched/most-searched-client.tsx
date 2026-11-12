'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
  Flame,
  Search,
  Sparkles,
  TrendingUp,
  Filter,
  RefreshCw,
  Rocket,
  Download,
  Calendar,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Info,
  Target,
  Video,
} from 'lucide-react';
import { NICHE_HIERARCHY, GeneralNiche, SubNiche } from '@/lib/niche-taxonomy';
import { MostSearchedItem } from '@/app/api/keywords/most-searched/route';
import KeywordDeepDiveModal from '../components/keyword-deep-dive-modal';

function MostSearchedContent() {
  // Navigation & Category Hierarchy
  const [selectedNicheId, setSelectedNicheId] = useState<string>('technology');
  const [selectedSubNicheId, setSelectedSubNicheId] = useState<string>('ai');
  const [selectedSubSubNicheId, setSelectedSubSubNicheId] = useState<string>('');

  // Timeframe and Opportunity Gap Filter
  const [timeframe, setTimeframe] = useState<string>('past_month');
  const [opportunityOnly, setOpportunityOnly] = useState<boolean>(false);

  // Async Data State
  const [keywords, setKeywords] = useState<MostSearchedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dig Deeper Modal State
  const [selectedDigKeyword, setSelectedDigKeyword] = useState<string | null>(null);
  const [isDigModalOpen, setIsDigModalOpen] = useState<boolean>(false);

  // Active general niche and sub-niche objects
  const activeGeneralNiche = useMemo(
    () => NICHE_HIERARCHY.find((n) => n.id === selectedNicheId) || NICHE_HIERARCHY[0],
    [selectedNicheId]
  );

  const activeSubNiche = useMemo(
    () => activeGeneralNiche.subNiches.find((sn) => sn.id === selectedSubNicheId) || activeGeneralNiche.subNiches[0],
    [activeGeneralNiche, selectedSubNicheId]
  );

  const activeSubSubNiches = useMemo(
    () => activeSubNiche.subNiches || [],
    [activeSubNiche]
  );

  useEffect(() => {
    fetchMostSearched();
  }, [selectedNicheId, selectedSubNicheId, selectedSubSubNicheId, timeframe, opportunityOnly]);

  const fetchMostSearched = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/keywords/most-searched?niche=${selectedNicheId}&subNiche=${selectedSubNicheId}&timeframe=${timeframe}`;
      if (selectedSubSubNicheId) {
        url += `&subSubNiche=${selectedSubSubNicheId}`;
      }
      if (opportunityOnly) {
        url += '&opportunityOnly=true';
      }

      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to fetch keywords');
      }

      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading most searched keywords');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (keywords.length === 0) return;
    const header = ['Keyword,Rank,Search Volume,Exact Video Count,Total Page Videos,Competition,Opportunity Score,Is Opportunity Gap'];
    const rows = keywords.map((k) =>
      `"${k.keyword}",${k.rank},${k.searchVolume},${k.exactVideoCount},${k.totalPageVideos},${k.competitionLevel},${k.opportunityScore},${k.isOpportunityGap}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `most_searched_${selectedNicheId}_${selectedSubNicheId}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-indigo-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-md">
              <Flame className="w-5 h-5 text-rose-500 fill-rose-500/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Most Searched Keywords
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-bold uppercase tracking-wider">
                  Real Demand Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mined directly from YouTube’s live search suggest index, categorized across deep sub-niches with real video saturation auditing.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={keywords.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* "Craft Anything" Template Callout Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">
                High Search Volume + Low Video Competition Filter
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Craft Anything Mode
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Like the breakthrough search spike for <strong>&quot;Craft Anything&quot;</strong>, YouTube has massive unsatisfied queries where thousands search daily, yet few creators have recorded dedicated videos. Activate this toggle to isolate high-demand keywords with low video density!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpportunityOnly(!opportunityOnly)}
          className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-md cursor-pointer ${
            opportunityOnly
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white border border-amber-400 shadow-amber-500/30 ring-2 ring-amber-500/40'
              : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{opportunityOnly ? '✓ Opportunity Gap Only (Active)' : 'Show Low Video Supply Only'}</span>
        </button>
      </div>

      {/* 3-Tier Niche & Sub-Niche Navigation Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        {/* Tier 1: General Niches */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
              1. General Niche
            </span>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timeframe:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-semibold cursor-pointer focus:outline-none"
              >
                <option value="past_24h">Past 24 Hours</option>
                <option value="past_week">Past 7 Days</option>
                <option value="past_month">Past 30 Days</option>
                <option value="past_year">Past 12 Months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {NICHE_HIERARCHY.map((n) => {
              const isSelected = selectedNicheId === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setSelectedNicheId(n.id);
                    setSelectedSubNicheId(n.subNiches[0].id);
                    setSelectedSubSubNicheId('');
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span className="truncate">{n.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 2: Sub-Niches */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] block">
            2. Sub-Niche Category
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {activeGeneralNiche.subNiches.map((sn) => {
              const isSelected = selectedSubNicheId === sn.id;
              return (
                <button
                  key={sn.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubNicheId(sn.id);
                    setSelectedSubSubNicheId('');
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sn.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tier 3: Deep Sub-Sub-Niches (if available) */}
        {activeSubSubNiches.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] block">
              3. Deep Topic Branch
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubSubNicheId('')}
                className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                  selectedSubSubNicheId === ''
                    ? 'bg-slate-800 text-white border-slate-700'
                    : 'bg-slate-950/70 text-slate-400 border-slate-800/80 hover:text-white'
                }`}
              >
                All {activeSubNiche.name} Branches
              </button>
              {activeSubSubNiches.map((ssn) => {
                const isSelected = selectedSubSubNicheId === ssn.id;
                return (
                  <button
                    key={ssn.id}
                    type="button"
                    onClick={() => setSelectedSubSubNicheId(ssn.id)}
                    className={`px-3 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white border-rose-500 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {ssn.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Main Results Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{keywords.length} most searched keywords</strong> for{' '}
              <strong className="text-white">{activeGeneralNiche.name} &gt; {activeSubNiche.name}</strong>
            </span>
            {opportunityOnly && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                Low Video Competition Only
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchMostSearched}
            disabled={isLoading}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Data</span>
          </button>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Most Searched Keyword</th>
                <th className="py-3 px-4 text-right">Search Volume</th>
                <th className="py-3 px-4 text-center">Video Supply Density</th>
                <th className="py-3 px-4 text-center">Competition</th>
                <th className="py-3 px-4 text-center">Opportunity Score</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                    <span>Mining YouTube search suggest index and auditing video supply...</span>
                  </td>
                </tr>
              ) : keywords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    No keywords found matching this filter criteria. Try expanding timeframe or toggling off Low Video Supply Only.
                  </td>
                </tr>
              ) : (
                keywords.map((item, idx) => (
                  <tr
                    key={item.keyword + idx}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 font-bold text-xs">
                      #{idx + 1}
                    </td>

                    {/* Keyword + Opportunity Reason */}
                    <td className="py-3.5 px-4 min-w-[240px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-rose-400 transition">
                            {item.keyword}
                          </span>
                          {item.isOpportunityGap && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>High Demand &bull; Few Videos</span>
                            </span>
                          )}
                        </div>
                        {item.opportunityGapReason && (
                          <p className="text-[11px] text-amber-400/90 leading-tight">
                            {item.opportunityGapReason}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Search Volume */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 text-xs">
                      {item.searchVolume.toLocaleString()}
                    </td>

                    {/* Video Supply Density (Page 1 direct videos) */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-mono font-bold text-xs ${
                          item.exactVideoCount <= 6 ? 'text-emerald-400' : 'text-slate-300'
                        }`}>
                          {item.exactVideoCount} / {item.totalPageVideos} videos
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {Math.round(item.supplyDensityRatio * 100)}% page saturation
                        </span>
                      </div>
                    </td>

                    {/* Competition Level */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          item.competitionLevel === 'Low'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : item.competitionLevel === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.competitionLevel}
                      </span>
                    </td>

                    {/* Opportunity Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-black text-xs px-2.5 py-0.5 rounded-full border ${
                          item.opportunityScore >= 80
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : item.opportunityScore >= 65
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {item.opportunityScore}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDigKeyword(item.keyword);
                            setIsDigModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-[11px] transition cursor-pointer"
                          title="Dig into this topic"
                        >
                          Dig Deeper
                        </button>

                        <Link
                          href={`/dashboard/research?q=${encodeURIComponent(item.keyword)}`}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Search in Keyword Research"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </Link>

                        <Link
                          href={`/dashboard/studio?topic=${encodeURIComponent(item.keyword)}`}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1 cursor-pointer"
                          title="Generate titles and script in Studio"
                        >
                          <Rocket className="w-3 h-3" />
                          <span>Studio</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dig Deeper Modal */}
      <KeywordDeepDiveModal
        keyword={selectedDigKeyword}
        isOpen={isDigModalOpen}
        onClose={() => setIsDigModalOpen(false)}
        onSelectKeyword={(kw) => {
          window.location.href = `/dashboard/research?q=${encodeURIComponent(kw)}`;
        }}
        onOpenStudio={(kw) => {
          window.location.href = `/dashboard/studio?topic=${encodeURIComponent(kw)}`;
        }}
      />
    </div>
  );
}

export default function MostSearchedClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Most Searched Keywords Engine...
        </div>
      }
    >
      <MostSearchedContent />
    </Suspense>
  );
}
