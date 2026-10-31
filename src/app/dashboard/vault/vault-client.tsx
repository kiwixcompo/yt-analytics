'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  CheckCircle2,
  Circle,
  Trash2,
  Sparkles,
  Search,
  Filter,
  Plus,
  FolderPlus,
  Folder,
  ArrowRight,
  ExternalLink,
  Video,
  FileText,
  Calendar,
  Layers,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getSavedKeywords,
  updateVaultKeyword,
  deleteVaultKeyword,
  deleteMultipleKeywords,
  getCollections,
  addCollection,
  deleteCollection,
  VaultKeyword,
  VaultStatus,
  DEFAULT_COLLECTION,
} from '@/lib/vault-service';

export default function VaultClient() {
  const [keywords, setKeywords] = useState<VaultKeyword[]>([]);
  const [collections, setCollections] = useState<string[]>([DEFAULT_COLLECTION]);
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal for new collection
  const [isAddCollectionOpen, setIsAddCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Load data
  const refreshData = () => {
    setKeywords(getSavedKeywords());
    setCollections(getCollections());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('vidpulse_vault_updated', handleUpdate);
    window.addEventListener('vidpulse_collections_updated', handleUpdate);
    return () => {
      window.removeEventListener('vidpulse_vault_updated', handleUpdate);
      window.removeEventListener('vidpulse_collections_updated', handleUpdate);
    };
  }, []);

  // Filtered keywords
  const filteredKeywords = useMemo(() => {
    return keywords.filter((item) => {
      // Collection filter
      if (selectedCollection !== 'all' && item.collection !== selectedCollection) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'recorded' && !item.recorded) return false;
        if (statusFilter === 'unrecorded' && item.recorded) return false;
        if (['idea', 'scripted', 'published'].includes(statusFilter) && item.status !== statusFilter) {
          return false;
        }
      }
      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return item.keyword.toLowerCase().includes(q) || item.collection.toLowerCase().includes(q);
      }
      return true;
    });
  }, [keywords, selectedCollection, statusFilter, searchFilter]);

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredKeywords.map((k) => k.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} saved keywords from vault?`)) {
      deleteMultipleKeywords(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleBulkMarkRecorded = (recorded: boolean) => {
    selectedIds.forEach((id) => {
      updateVaultKeyword(id, { recorded, status: recorded ? 'recorded' : 'idea' });
    });
    setSelectedIds(new Set());
  };

  const handleToggleRecorded = (item: VaultKeyword) => {
    const nextRecorded = !item.recorded;
    updateVaultKeyword(item.id, {
      recorded: nextRecorded,
      status: nextRecorded ? 'recorded' : 'idea',
    });
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim());
    setSelectedCollection(newCollectionName.trim());
    setNewCollectionName('');
    setIsAddCollectionOpen(false);
  };

  // Stats
  const totalCount = keywords.length;
  const recordedCount = keywords.filter((k) => k.recorded).length;
  const ideaCount = totalCount - recordedCount;

  return (
    <div className="w-full px-6 py-8 space-y-8 text-slate-100 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Keyword Vault &amp; Pipeline</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Production Board
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Dedicated workspace for your selected keywords. Track filmed videos, organize by niche buckets, and launch metadata creation.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/research"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-rose-400" />
            <span>Scout More Keywords</span>
          </Link>
          <button
            onClick={() => setIsAddCollectionOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Total Vault Keywords</span>
            <span className="text-2xl font-black text-white">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Videos Filmed / Completed</span>
            <span className="text-2xl font-black text-emerald-400">{recordedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Ideas Ready to Film</span>
            <span className="text-2xl font-black text-amber-400">{ideaCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Workspace Layout (Collections sidebar + Keywords Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Collections List (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              Collections
            </span>
            <button
              onClick={() => setIsAddCollectionOpen(true)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setSelectedCollection('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                selectedCollection === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span>📁 All Vault Keywords</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/40 text-slate-200">
                {totalCount}
              </span>
            </button>

            {collections.map((col) => {
              const countInCol = keywords.filter((k) => k.collection === col).length;
              const isSelected = selectedCollection === col;
              return (
                <div
                  key={col}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                  onClick={() => setSelectedCollection(col)}
                >
                  <span className="truncate pr-2">{col}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/40 text-slate-200">
                      {countInCol}
                    </span>
                    {col !== DEFAULT_COLLECTION && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete collection "${col}"? Keywords will be moved to General Ideas.`)) {
                            deleteCollection(col);
                            if (selectedCollection === col) setSelectedCollection('all');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition p-0.5"
                        title="Delete collection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Keywords Table & Filters (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search within vault */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search saved keywords..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({filteredKeywords.length})
              </button>
              <button
                onClick={() => setStatusFilter('unrecorded')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'unrecorded' ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>To Film</span>
              </button>
              <button
                onClick={() => setStatusFilter('recorded')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'recorded' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Filmed</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl">
            {/* Table Header / Bulk Selection Actions */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={
                      filteredKeywords.length > 0 && selectedIds.size === filteredKeywords.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                  />
                  <span>Select All ({filteredKeywords.length})</span>
                </label>

                {selectedIds.size > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {selectedIds.size} Selected
                  </span>
                )}
              </div>

              {/* Bulk Action Buttons */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBulkMarkRecorded(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Mark Filmed</span>
                  </button>
                  <button
                    onClick={() => handleBulkMarkRecorded(false)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition cursor-pointer"
                  >
                    <Circle className="w-3 h-3" />
                    <span>Mark To-Film</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[11px] transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            {/* Rows */}
            {filteredKeywords.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No keywords found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {keywords.length === 0
                    ? 'Your Keyword Vault is empty. Head to Keyword Research and select keywords to save them here!'
                    : 'No keywords match your selected filters.'}
                </p>
                {keywords.length === 0 && (
                  <Link
                    href="/dashboard/research"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Go to Keyword Research</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredKeywords.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                        item.recorded
                          ? 'bg-slate-950/40 opacity-80 hover:opacity-100'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Left: Checkbox + Title + Meta */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.id)}
                          className="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600 shrink-0"
                        />

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`text-sm font-bold truncate ${
                                item.recorded ? 'line-through text-slate-400' : 'text-white'
                              }`}
                              title={item.keyword}
                            >
                              {item.keyword}
                            </h3>

                            {/* Filmed Toggle Pill */}
                            <button
                              type="button"
                              onClick={() => handleToggleRecorded(item)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                item.recorded
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                              }`}
                            >
                              {item.recorded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Filmed</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="w-2.5 h-2.5 fill-current" />
                                  <span>To Film</span>
                                </>
                              )}
                            </button>

                            {/* Collection Tag */}
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                              📁 {item.collection}
                            </span>
                          </div>

                          {/* Keyword Stats (from research engine) */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            {item.searchVolume !== undefined && (
                              <span>
                                Vol: <strong className="text-slate-200">{item.searchVolume.toLocaleString()}</strong>
                              </span>
                            )}
                            {item.competition && (
                              <span>
                                Comp: <strong className="text-slate-200">{item.competition}</strong>
                              </span>
                            )}
                            {item.overallScore !== undefined && (
                              <span>
                                Score: <strong className="text-indigo-400">{item.overallScore}/100</strong>
                              </span>
                            )}
                            <span>&bull;</span>
                            <span className="text-slate-500">
                              Added {new Date(item.addedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Buttons (Launch Metadata Studio + Delete) */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <Link
                          href={`/dashboard/studio?topic=${encodeURIComponent(item.keyword)}&vaultId=${item.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
                          title="Generate high-CTR titles, description, and talking points in Content Studio"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate Metadata &rarr;</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove "${item.keyword}" from vault?`)) {
                              deleteVaultKeyword(item.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Collection Modal */}
      {isAddCollectionOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-400" />
                Create New Collection
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCollectionOpen(false)}
                className="text-slate-400 hover:text-white text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Collection / Bucket Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Talking Head 2026, Finance Deep-Dives, Shorts Ideas..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCollectionOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/30"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
