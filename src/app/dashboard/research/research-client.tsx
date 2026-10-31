'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Bookmark,
  Check,
  FolderPlus,
  X,
  ListFilter,
  Flame,
  ArrowRight,
  Layers,
  Copy,
  ExternalLink,
  Rocket,
  Eye,
  Video,
  Play,
  Users,
} from 'lucide-react';
import {
  saveKeywordsToVault,
  getCollections,
  addCollection,
  DEFAULT_COLLECTION,
} from '@/lib/vault-service';

interface KeywordMetric {
  keyword: string;
  relatedScore: number;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High' | 'Very High';
  overallScore: number;
  wordCount: number;
  trend: 'up' | 'stable';
  opportunityScore: number;
  suggestedAction: string;
}

interface AutocompleteItem {
  keyword: string;
  rank: number;
  branch?: string;
}

interface SerpVideo {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  channelTitle: string;
  channelUrl: string;
  channelSubscriberCountText?: string;
  channelSubscriberCount?: number;
  viewsText: string;
  viewsCount: number;
  publishedTime: string;
  lengthText: string;
  badges: string[];
  snippet: string;
  isOutlierHit?: boolean;
  viewToSubRatio?: number;
}

interface SerpAnalysis {
  averageViews: number;
  topViews: number;
  medianViews: number;
  recentUploadsCount: number;
  competitionLevel: string;
  opportunityScore: number;
  outlierVideosCount: number;
}

type SortField =
  | 'keyword'
  | 'relatedScore'
  | 'searchVolume'
  | 'competition'
  | 'overallScore'
  | 'wordCount'
  | 'opportunityScore';

type SortDirection = 'asc' | 'desc';

function ResearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || 'can ai ';
  const initialType = (searchParams.get('type') as any) || 'serp'; // Default to live YouTube video previews

  const [query, setQuery] = useState(initialQ);
  const [type, setType] = useState<'serp' | 'autocomplete' | 'related' | 'matching' | 'questions'>(initialType);
  const [keywords, setKeywords] = useState<KeywordMetric[]>([]);
  const [topMetrics, setTopMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Live YouTube Video Preview & Outlier States
  const [serpVideos, setSerpVideos] = useState<SerpVideo[]>([]);
  const [serpAnalysis, setSerpAnalysis] = useState<SerpAnalysis | null>(null);
  const [isLoadingSerp, setIsLoadingSerp] = useState(false);
  const [serpOutliersOnly, setSerpOutliersOnly] = useState(false);

  // Emulation Blueprint Modal States
  const [activeEmulationVideo, setActiveEmulationVideo] = useState<any>(null);
  const [emulationBlueprint, setEmulationBlueprint] = useState<any>(null);
  const [isLoadingEmulation, setIsLoadingEmulation] = useState(false);
  const [emulationError, setEmulationError] = useState('');

  // Live YouTube Autocomplete States
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteItem[]>([]);
  const [isDeepScout, setIsDeepScout] = useState(false);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('overallScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Checkbox selection state
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Save to Vault Modal state
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultCollections, setVaultCollections] = useState<string[]>([DEFAULT_COLLECTION]);
  const [targetCollection, setTargetCollection] = useState<string>(DEFAULT_COLLECTION);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [saveToast, setSaveToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  // Fetch Live YouTube SERP Videos (Thumbnails, Outliers, Ratios)
  const fetchLiveSerp = async (searchTarget: string, outliersOnly: boolean = false) => {
    if (!searchTarget.trim()) return;
    setIsLoadingSerp(true);
    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(searchTarget.trim())}${
        outliersOnly ? '&outliers=true&maxSubs=20000' : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      setSerpVideos(data.videos || []);
      setSerpAnalysis(data.analysis || null);
    } catch (err) {
      console.error('Failed to fetch live SERP videos:', err);
    } finally {
      setIsLoadingSerp(false);
    }
  };

  // Fetch standard keyword research
  const fetchFullResearch = async (searchTarget: string, searchType: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/keywords?q=${encodeURIComponent(searchTarget)}&type=${searchType}&limit=100`
      );
      const data = await res.json();
      setKeywords(data.keywords || []);
      setTopMetrics(data.topMetrics || null);
      setCurrentPage(1);
      setSelectedKeywords(new Set());
    } catch (e) {
      console.error('Failed to fetch full research:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch live YouTube autocomplete data
  const fetchYouTubeAutocomplete = async (searchTarget: string, deep: boolean = false) => {
    if (!searchTarget.trim()) return;
    setIsLoadingAutocomplete(true);
    try {
      const res = await fetch(
        `/api/keywords/autocomplete?q=${encodeURIComponent(searchTarget)}&deep=${deep ? 'true' : 'false'}`
      );
      const data = await res.json();
      setAutocompleteResults(data.results || []);
      setSelectedKeywords(new Set());
    } catch (e) {
      console.error('Failed to fetch YouTube autocomplete:', e);
    } finally {
      setIsLoadingAutocomplete(false);
    }
  };

  // Emulation Blueprint Generator
  const handleOpenEmulation = async (video: SerpVideo) => {
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

  useEffect(() => {
    if (initialQ) {
      if (initialType === 'serp') {
        fetchLiveSerp(initialQ, serpOutliersOnly);
      } else if (initialType === 'autocomplete') {
        fetchYouTubeAutocomplete(initialQ, isDeepScout);
      } else {
        fetchFullResearch(initialQ, initialType);
      }
    }
  }, [initialQ, initialType]);

  useEffect(() => {
    setVaultCollections(getCollections());
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (type === 'serp') {
      fetchLiveSerp(query.trim(), serpOutliersOnly);
    } else if (type === 'autocomplete') {
      fetchYouTubeAutocomplete(query.trim(), isDeepScout);
    } else {
      fetchFullResearch(query.trim(), type);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      if (field === 'keyword') {
        setSortDirection('asc');
      } else {
        setSortDirection('desc');
      }
    }
    setCurrentPage(1);
  };

  const competitionRank: Record<string, number> = {
    Low: 1,
    Medium: 2,
    High: 3,
    'Very High': 4,
  };

  // Sorted list for standard research
  const sortedKeywords = useMemo(() => {
    const list = [...keywords];
    list.sort((a, b) => {
      let comp = 0;
      if (sortField === 'keyword') {
        comp = a.keyword.localeCompare(b.keyword);
      } else if (sortField === 'competition') {
        const rankA = competitionRank[a.competition] || 2;
        const rankB = competitionRank[b.competition] || 2;
        comp = rankA - rankB;
      } else {
        comp = (a[sortField] as number) - (b[sortField] as number);
      }
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [keywords, sortField, sortDirection]);

  // Paginated slice for standard research
  const totalResults = sortedKeywords.length;
  const totalPages = Math.ceil(totalResults / pageSize) || 1;
  const paginatedKeywords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedKeywords.slice(start, start + pageSize);
  }, [sortedKeywords, currentPage, pageSize]);

  // Checkbox selection handlers
  const handleToggleSelectKeyword = (kwStr: string) => {
    const next = new Set(selectedKeywords);
    if (next.has(kwStr)) {
      next.delete(kwStr);
    } else {
      next.add(kwStr);
    }
    setSelectedKeywords(next);
  };

  const handleToggleSelectPage = (checked: boolean) => {
    const next = new Set(selectedKeywords);
    if (checked) {
      if (type === 'autocomplete') {
        autocompleteResults.forEach((k) => next.add(k.keyword));
      } else {
        paginatedKeywords.forEach((k) => next.add(k.keyword));
      }
    } else {
      if (type === 'autocomplete') {
        autocompleteResults.forEach((k) => next.delete(k.keyword));
      } else {
        paginatedKeywords.forEach((k) => next.delete(k.keyword));
      }
    }
    setSelectedKeywords(next);
  };

  const handleSelectAllResults = () => {
    if (type === 'autocomplete') {
      const next = new Set(autocompleteResults.map((k) => k.keyword));
      setSelectedKeywords(next);
    } else {
      const next = new Set(sortedKeywords.map((k) => k.keyword));
      setSelectedKeywords(next);
    }
  };

  const isCurrentPageAllSelected = useMemo(() => {
    if (type === 'autocomplete') {
      if (autocompleteResults.length === 0) return false;
      return autocompleteResults.every((k) => selectedKeywords.has(k.keyword));
    }
    if (paginatedKeywords.length === 0) return false;
    return paginatedKeywords.every((k) => selectedKeywords.has(k.keyword));
  }, [type, autocompleteResults, paginatedKeywords, selectedKeywords]);

  // Save to Vault
  const handleOpenVaultModal = () => {
    setVaultCollections(getCollections());
    setIsVaultModalOpen(true);
  };

  const handleConfirmSaveToVault = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKeywords.size === 0) return;

    let chosenCollection = targetCollection;
    if (isCreatingCollection && newCollectionName.trim()) {
      chosenCollection = newCollectionName.trim();
      addCollection(chosenCollection);
    }

    const itemsToSave = Array.from(selectedKeywords).map((kwStr) => {
      const found = sortedKeywords.find((k) => k.keyword === kwStr);
      return {
        keyword: kwStr,
        searchVolume: found?.searchVolume || undefined,
        competition: found?.competition || undefined,
        overallScore: found?.overallScore || undefined,
        opportunityScore: found?.opportunityScore || undefined,
      };
    });

    const result = saveKeywordsToVault(itemsToSave, chosenCollection);
    setIsVaultModalOpen(false);
    setSelectedKeywords(new Set());
    setIsCreatingCollection(false);
    setNewCollectionName('');

    const msg = `Saved ${result.addedCount} keywords to "${chosenCollection}"! ${
      result.duplicateCount > 0 ? `(${result.duplicateCount} were already in vault)` : ''
    }`;
    setSaveToast({ show: true, msg });
    setTimeout(() => {
      setSaveToast({ show: false, msg: '' });
    }, 4500);
  };

  // Export CSV
  const handleExportCSV = (selectedOnly: boolean = false) => {
    if (type === 'autocomplete') {
      const targetList = selectedOnly
        ? autocompleteResults.filter((k) => selectedKeywords.has(k.keyword))
        : autocompleteResults;
      if (targetList.length === 0) return;

      const header = ['Rank', 'YouTube Autocomplete Keyword', 'Search Seed'].join(',');
      const rows = targetList.map((k) => {
        const kw = `"${k.keyword.replace(/"/g, '""')}"`;
        const q = `"${query.replace(/"/g, '""')}"`;
        return [k.rank, kw, q].join(',');
      });

      const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `YouTube_Autocomplete_${query.replace(/[^a-z0-9]/gi, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const targetList = selectedOnly
      ? sortedKeywords.filter((k) => selectedKeywords.has(k.keyword))
      : sortedKeywords;

    if (targetList.length === 0) return;

    const header = [
      'Keyword',
      'Related Score',
      'Search Volume',
      'Competition',
      'Overall Score',
      'Word Count',
      'Opportunity Recommendation',
    ].join(',');

    const rows = targetList.map((k) => {
      const kw = `"${k.keyword.replace(/"/g, '""')}"`;
      const action = `"${k.suggestedAction.replace(/"/g, '""')}"`;
      return [
        kw,
        k.relatedScore,
        k.searchVolume,
        k.competition,
        k.overallScore,
        k.wordCount,
        action,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VidPulse_Keywords_${query.replace(/[^a-z0-9]/gi, '_')}_${selectedOnly ? 'selected' : 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-rose-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-rose-400" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Title & Vault shortcut */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span>⚡ VidPulse Search Intelligence &amp; Keyword Research</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                0 Quota Cost
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct live YouTube search index intelligence: Search volume, competition difficulty, overall score &amp; opportunity rating, autocomplete, and outlier video previews.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/vault"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Open Keyword Vault</span>
            </Link>

            <button
              onClick={() => handleExportCSV(false)}
              disabled={
                type === 'autocomplete'
                  ? autocompleteResults.length === 0
                  : type === 'serp'
                  ? serpVideos.length === 0
                  : keywords.length === 0
              }
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                Export CSV ({type === 'autocomplete' ? autocompleteResults.length : type === 'serp' ? serpVideos.length : totalResults})
              </span>
            </button>
          </div>
        </div>

        {/* Search & Mode Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search seed keyword (e.g. can ai, passive income, python, trading)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={type === 'serp' ? isLoadingSerp : type === 'autocomplete' ? isLoadingAutocomplete : isLoading}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {(type === 'serp' ? isLoadingSerp : type === 'autocomplete' ? isLoadingAutocomplete : isLoading) ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Results...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Inspect Search Data</span>
                </>
              )}
            </button>
          </form>

          {/* Query Types & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              {/* YouTube Video Previews & Outlier Mode Button */}
              <button
                type="button"
                onClick={() => {
                  setType('serp');
                  fetchLiveSerp(query, serpOutliersOnly);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  type === 'serp'
                    ? 'bg-rose-600 text-white font-bold shadow-sm'
                    : 'text-rose-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>🎬 YouTube Video Previews &amp; Outliers</span>
              </button>

              {/* Autocomplete Mode Button */}
              <button
                type="button"
                onClick={() => {
                  setType('autocomplete');
                  fetchYouTubeAutocomplete(query, isDeepScout);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  type === 'autocomplete'
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>⚡ YouTube Autocomplete (Live)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('related');
                  fetchFullResearch(query, 'related');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  type === 'related' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>🔍 Search Volume &amp; Competition</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('matching');
                  fetchFullResearch(query, 'matching');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  type === 'matching' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🔍 Matching Terms
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('questions');
                  fetchFullResearch(query, 'questions');
                }}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  type === 'questions' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                ❓ Questions (High CTR)
              </button>
            </div>

            {/* Sub-Filters based on active view */}
            {type === 'serp' ? (
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSerpOutliersOnly(false);
                    fetchLiveSerp(query, false);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    !serpOutliersOnly
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Page 1 Videos ({serpVideos.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSerpOutliersOnly(true);
                    fetchLiveSerp(query, true);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    serpOutliersOnly
                      ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-sm'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Outliers Only (&lt; 20k Subs)</span>
                </button>
              </div>
            ) : type === 'autocomplete' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextDeep = !isDeepScout;
                    setIsDeepScout(nextDeep);
                    fetchYouTubeAutocomplete(query, nextDeep);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDeepScout
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                  title="Expands the query across the alphabet (a-z) to discover 50+ deep autocomplete branches"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Deep Scout (A–Z Wildcard Expansion)</span>
                  {isDeepScout && <span className="text-[10px] bg-indigo-500/30 px-1.5 rounded">ON</span>}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>
                  Showing <strong>{totalResults > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> -{' '}
                  <strong>{Math.min(currentPage * pageSize, totalResults)}</strong> of{' '}
                  <strong>{totalResults}</strong>
                </span>

                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={10} className="bg-slate-900 text-white">10 per page</option>
                    <option value={20} className="bg-slate-900 text-white">20 per page</option>
                    <option value={50} className="bg-slate-900 text-white">50 per page</option>
                    <option value={100} className="bg-slate-900 text-white">100 per page</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: YOUTUBE VIDEO PREVIEWS, THUMBNAILS & OUTLIERS                     */}
        {/* ========================================================================= */}
        {type === 'serp' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Intelligence Stats Header */}
            {serpAnalysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Average Page 1 Views</span>
                  <span className="text-xl font-bold text-white">
                    {serpAnalysis.averageViews?.toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Top Page 1 Video Views</span>
                  <span className="text-xl font-bold text-rose-400">
                    {serpAnalysis.topViews?.toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Topic Opportunity Score</span>
                  <span className="text-xl font-bold text-indigo-400">
                    {serpAnalysis.opportunityScore}/100
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Outlier Breakthroughs</span>
                  <span className="text-xl font-bold text-amber-400">
                    {serpAnalysis.outlierVideosCount || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Video Cards Grid/List */}
            {isLoadingSerp ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin text-rose-500" />
                <span className="text-xs font-semibold">
                  Inspecting YouTube Page 1 thumbnails, creator sizes, and viral outliers for &quot;{query}&quot;...
                </span>
              </div>
            ) : serpVideos.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <Flame className="w-8 h-8 text-rose-500/80 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  {serpOutliersOnly
                    ? 'No Breakthrough Outliers (< 20k Subs) Found'
                    : 'No Search Results Available'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {serpOutliersOnly
                    ? `All ranking videos for "${query}" are from channels exceeding 20k subscribers or lacking breakthrough ratios.`
                    : 'Try typing another keyword to preview live YouTube results.'}
                </p>
                {serpOutliersOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setSerpOutliersOnly(false);
                      fetchLiveSerp(query, false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    Show All Page 1 Videos
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                  <span>
                    Showing <strong>{serpVideos.length} live YouTube videos</strong>:
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                    ✓ Live Search Index Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {serpVideos.map((video, idx) => (
                    <div
                      key={video.id + idx}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row gap-4 group"
                    >
                      {/* Video Thumbnail Box */}
                      <div className="relative shrink-0 w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
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
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                          #{idx + 1}
                        </div>
                        {video.lengthText && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                            {video.lengthText}
                          </div>
                        )}
                      </div>

                      {/* Video Details */}
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

                          {/* Channel Info & Metrics */}
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
                            <span className="font-semibold text-slate-200">
                              {video.channelTitle}
                            </span>
                            <span>&bull;</span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-indigo-300">
                              👥 {video.channelSubscriberCountText || 'Hidden'}
                            </span>
                            <span>&bull;</span>
                            <span className="font-bold text-slate-100">{video.viewsText}</span>
                            <span>&bull;</span>
                            <span>{video.publishedTime}</span>
                          </div>

                          {video.snippet && (
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                              {video.snippet}
                            </p>
                          )}
                        </div>

                        {/* Outlier Emulation Callout */}
                        {video.isOutlierHit && (
                          <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                                <span>
                                  Outlier Breakthrough ({video.viewToSubRatio ? `${video.viewToSubRatio}x View Ratio` : 'Outlier Hit'})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                This video gained high views relative to channel size. High organic search demand!
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEmulation(video)}
                              className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                            >
                              <Rocket className="w-3.5 h-3.5" />
                              <span>Emulate Blueprint &rarr;</span>
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
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: LIVE YOUTUBE AUTOCOMPLETE SEARCH STREAM                           */}
        {/* ========================================================================= */}
        {type === 'autocomplete' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-white">Live YouTube Auto-Suggest Feed:</span>
                <span className="text-slate-400">
                  Exact rank order returned by YouTube search index for &quot;{query}&quot;. Top suggestions represent the highest search volume queries.
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {autocompleteResults.length} Autocomplete Results
              </span>
            </div>

            {/* YouTube Dark Mode Autocomplete Dropdown Simulator */}
            <div className="rounded-2xl border border-slate-800 bg-[#0f0f0f] shadow-2xl overflow-hidden">
              {/* Header Bar */}
              <div className="bg-[#181818] px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={isCurrentPageAllSelected}
                    onChange={(e) => handleToggleSelectPage(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                  />
                  <span>Select All ({autocompleteResults.length})</span>
                </label>

                {selectedKeywords.size > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    {selectedKeywords.size} Selected
                  </span>
                )}
              </div>

              {/* Rows */}
              {isLoadingAutocomplete ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                  Streaming live YouTube search autocomplete data...
                </div>
              ) : autocompleteResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No autocomplete results found for &quot;{query}&quot;. Try typing a different root keyword.
                </div>
              ) : (
                <div className="divide-y divide-[#222222]">
                  {autocompleteResults.map((item, idx) => {
                    const isChecked = selectedKeywords.has(item.keyword);
                    return (
                      <div
                        key={item.keyword + idx}
                        className={`px-4 py-3 flex items-center justify-between gap-3 transition cursor-pointer ${
                          isChecked ? 'bg-rose-500/10' : 'hover:bg-[#222222]'
                        }`}
                      >
                        {/* Left: Checkbox + Rank + YouTube Search Icon + Keyword */}
                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectKeyword(item.keyword)}
                            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600 shrink-0"
                          />

                          {/* Rank Badge */}
                          <span className="w-6 text-center font-mono font-bold text-xs text-slate-500">
                            #{item.rank}
                          </span>

                          {/* YouTube Magnifying Glass Icon */}
                          <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 shrink-0">
                            <Search className="w-3.5 h-3.5" />
                          </div>

                          {/* Keyword Text */}
                          <span
                            onClick={() => handleToggleSelectKeyword(item.keyword)}
                            className="font-medium text-sm text-slate-100 hover:text-rose-400 transition truncate"
                          >
                            {item.keyword}
                          </span>

                          {item.branch && item.branch !== 'top_rank' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                              +{item.branch}
                            </span>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setType('serp');
                              setQuery(item.keyword);
                              fetchLiveSerp(item.keyword, false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                            title="Preview video thumbnails and outliers for this query"
                          >
                            Preview Videos &rarr;
                          </button>

                          <Link
                            href={`/dashboard/studio?topic=${encodeURIComponent(item.keyword)}`}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 font-bold text-[11px] transition"
                            title="Generate titles and script in Content Studio"
                          >
                            Create Video
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.keyword);
                              setSaveToast({ show: true, msg: `Copied "${item.keyword}" to clipboard!` });
                              setTimeout(() => setSaveToast({ show: false, msg: '' }), 2500);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: STANDARD KEYWORD METRICS & SCORECARD TABLE                        */}
        {/* ========================================================================= */}
        {type !== 'serp' && type !== 'autocomplete' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 4 Metric Summary Cards */}
            {topMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Primary Overall Score</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white">{topMetrics.overallScore}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        topMetrics.overallScore >= 70
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {topMetrics.overallLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Search Volume</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white">{topMetrics.searchVolume.toLocaleString()}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                      {topMetrics.volumeLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Competition Level</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-white">{topMetrics.competitionScore}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                      {topMetrics.competitionLabel}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Estimated Views / Hour</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-indigo-400">{topMetrics.vph?.toLocaleString()}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                      Velocity
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Sortable Data Table */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 select-none">
                    <tr>
                      {/* Checkbox column */}
                      <th className="py-3.5 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isCurrentPageAllSelected}
                          onChange={(e) => handleToggleSelectPage(e.target.checked)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                          title="Select all on this page"
                        />
                      </th>

                      {/* Keyword Column */}
                      <th
                        onClick={() => handleSort('keyword')}
                        className="py-3.5 px-4 cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Keyword</span>
                          {renderSortIcon('keyword')}
                        </div>
                      </th>

                      {/* Related Score */}
                      <th
                        onClick={() => handleSort('relatedScore')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Related Score</span>
                          {renderSortIcon('relatedScore')}
                        </div>
                      </th>

                      {/* Search Volume */}
                      <th
                        onClick={() => handleSort('searchVolume')}
                        className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Search Volume</span>
                          {renderSortIcon('searchVolume')}
                        </div>
                      </th>

                      {/* Competition */}
                      <th
                        onClick={() => handleSort('competition')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Competition</span>
                          {renderSortIcon('competition')}
                        </div>
                      </th>

                      {/* Overall */}
                      <th
                        onClick={() => handleSort('overallScore')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Overall</span>
                          {renderSortIcon('overallScore')}
                        </div>
                      </th>

                      {/* Words */}
                      <th
                        onClick={() => handleSort('wordCount')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Words</span>
                          {renderSortIcon('wordCount')}
                        </div>
                      </th>

                      {/* Opportunity Score */}
                      <th
                        onClick={() => handleSort('opportunityScore')}
                        className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-900 transition group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Opportunity</span>
                          {renderSortIcon('opportunityScore')}
                        </div>
                      </th>

                      {/* Recommendation */}
                      <th className="py-3.5 px-4">Opportunity Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {isLoading ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
                          Loading comprehensive keyword results...
                        </td>
                      </tr>
                    ) : paginatedKeywords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          No keyword records found for this query. Try a different seed.
                        </td>
                      </tr>
                    ) : (
                      paginatedKeywords.map((kw, i) => {
                        const isChecked = selectedKeywords.has(kw.keyword);
                        return (
                          <tr
                            key={kw.keyword + i}
                            className={`transition group ${
                              isChecked ? 'bg-rose-500/10' : 'hover:bg-slate-800/40'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectKeyword(kw.keyword)}
                                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600"
                              />
                            </td>

                            <td className="py-3 px-4 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-[11px] w-5 text-right font-mono">
                                  {(currentPage - 1) * pageSize + i + 1}.
                                </span>
                                <span
                                  onClick={() => handleToggleSelectKeyword(kw.keyword)}
                                  className="group-hover:text-rose-400 transition cursor-pointer"
                                >
                                  {kw.keyword}
                                </span>
                                {kw.trend === 'up' && (
                                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">
                                    ↑↑
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">
                              {kw.relatedScore}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                              {kw.searchVolume.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                                  kw.competition === 'Low'
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : kw.competition === 'Medium'
                                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                                }`}
                              >
                                {kw.competition}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                                  kw.overallScore >= 70
                                    ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30'
                                    : kw.overallScore >= 50
                                    ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                                    : 'text-rose-300 bg-rose-500/20 border-rose-500/30'
                                }`}
                              >
                                {kw.overallScore}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400 font-mono">
                              {kw.wordCount}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-xs font-bold text-indigo-400 font-mono">
                                {kw.opportunityScore}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-300 text-[11px]">
                              {kw.suggestedAction}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
                <div>
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalResults} total keywords)
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <React.Fragment key={p}>
                            {prev && p - prev > 1 && <span className="px-1 text-slate-600">...</span>}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                                currentPage === p
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar for Checkbox Selection */}
      {selectedKeywords.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-white text-sm">
              {selectedKeywords.size} Keyword{selectedKeywords.size > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenVaultModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Save to Vault &rarr;</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected</span>
            </button>

            <button
              onClick={handleSelectAllResults}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-200 font-semibold transition cursor-pointer"
            >
              Select All {type === 'autocomplete' ? autocompleteResults.length : 100}
            </button>

            <button
              onClick={() => setSelectedKeywords(new Set())}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Save to Vault Modal */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                Save {selectedKeywords.size} Keywords to Vault
              </h3>
              <button
                type="button"
                onClick={() => setIsVaultModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmSaveToVault} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Choose Target Collection
                </label>

                {!isCreatingCollection ? (
                  <div className="space-y-2">
                    <select
                      value={targetCollection}
                      onChange={(e) => setTargetCollection(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {vaultCollections.map((c) => (
                        <option key={c} value={c} className="bg-slate-900 text-white">
                          📁 {c}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsCreatingCollection(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ Create a new collection bucket</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="e.g. Talking Head 2026, Finance Deep-Dives..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCollection(false);
                        setNewCollectionName('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
                    >
                      &larr; Use existing collection instead
                    </button>
                  </div>
                )}
              </div>

              {/* Selected keywords preview */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 max-h-32 overflow-y-auto space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Keywords to add:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedKeywords).map((k) => (
                    <span
                      key={k}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-medium truncate max-w-[200px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emulation Blueprint Modal */}
      {activeEmulationVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  ⚡ Outlier Emulation Blueprint
                </span>
                <h3 className="text-base font-bold text-white mt-1 leading-snug">
                  {activeEmulationVideo.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <span>{activeEmulationVideo.channelTitle}</span>
                  <span>&bull;</span>
                  <span className="text-rose-400 font-semibold">{activeEmulationVideo.viewsText}</span>
                  <span>&bull;</span>
                  <span className="text-indigo-400 font-semibold">
                    {activeEmulationVideo.channelSubscriberCountText} subs
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmulationVideo(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingEmulation ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                <span className="text-xs">Deconstructing viral hook and algorithm triggers...</span>
              </div>
            ) : emulationError ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {emulationError}
              </div>
            ) : emulationBlueprint ? (
              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-rose-400 uppercase tracking-wide text-[10px] block">
                    Why this video scaled past channel subscribers:
                  </span>
                  <p className="leading-relaxed">
                    {emulationBlueprint.whyItWorked || emulationBlueprint.hookExplanation}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-indigo-400 uppercase tracking-wide text-[10px] block">
                    Suggested Creator Emulation Strategy:
                  </span>
                  <p className="leading-relaxed">
                    {emulationBlueprint.suggestedStrategy || emulationBlueprint.angle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={`/dashboard/studio?topic=${encodeURIComponent(activeEmulationVideo.title)}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Spin into New Video in Content Studio &rarr;</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveEmulationVideo(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {saveToast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 text-emerald-200 border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast.msg}</span>
          <Link
            href="/dashboard/vault"
            className="ml-2 underline font-bold text-white hover:text-emerald-300"
          >
            View Vault &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResearchPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading VidPulse Keyword Research Explorer...
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
