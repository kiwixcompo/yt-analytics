'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Video,
  CheckCircle2,
  Circle,
  FileText,
  Copy,
  Download,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Search,
  Filter,
  Eye,
  Tag,
  Clock,
  Film,
  ListOrdered,
  Check,
  Clapperboard,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  getProductionItems,
  updateProductionItem,
  deleteProductionItem,
  deleteMultipleProductionItems,
  ProductionItem,
} from '@/lib/production-service';

export default function RecordingQueueClient() {
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready_to_record' | 'recorded'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeTabByItem, setActiveTabByItem] = useState<Record<string, 'script' | 'teleprompter' | 'metadata' | 'thumbnail'>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const refreshData = () => {
    const data = getProductionItems();
    setItems(data);
    if (data.length > 0 && !expandedItemId) {
      setExpandedItemId(data[0].id);
    }
  };

  useEffect(() => {
    refreshData();
    const handleUpdate = () => refreshData();
    window.addEventListener('vidpulse_production_updated', handleUpdate);
    return () => {
      window.removeEventListener('vidpulse_production_updated', handleUpdate);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === 'ready_to_record' && item.status !== 'ready_to_record') return false;
      if (statusFilter === 'recorded' && item.status !== 'recorded') return false;
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, searchFilter, statusFilter]);

  const readyCount = items.filter((i) => i.status === 'ready_to_record').length;
  const recordedCount = items.filter((i) => i.status === 'recorded').length;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleToggleStatus = (item: ProductionItem) => {
    const nextStatus = item.status === 'ready_to_record' ? 'recorded' : 'ready_to_record';
    updateProductionItem(item.id, {
      status: nextStatus,
      recordedAt: nextStatus === 'recorded' ? new Date().toISOString() : undefined,
    });
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = (status: 'ready_to_record' | 'recorded') => {
    selectedIds.forEach((id) => {
      updateProductionItem(id, {
        status,
        recordedAt: status === 'recorded' ? new Date().toISOString() : undefined,
      });
    });
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    if (confirm(`Remove ${selectedIds.size} production item(s)?`)) {
      deleteMultipleProductionItems(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleExportTxt = (item: ProductionItem) => {
    let content = `VIDPULSE PRODUCTION SHEET\n====================================\n`;
    content += `TOPIC: ${item.topic}\n`;
    content += `TITLE: ${item.title}\n`;
    content += `STATUS: ${item.status.toUpperCase()}\n`;
    content += `ESTIMATED DURATION: ${item.script?.totalEstimatedDuration || 'N/A'}\n`;
    content += `PACING: ${item.script?.recommendedPacing || 'N/A'}\n\n`;

    if (item.metadata?.thumbnailHookConcept) {
      content += `THUMBNAIL CONCEPT:\n`;
      content += `- Text: "${item.metadata.thumbnailHookConcept.textOverlay}"\n`;
      content += `- Visual: ${item.metadata.thumbnailHookConcept.visualLayout}\n`;
      content += `- Colors: ${item.metadata.thumbnailHookConcept.colorScheme}\n\n`;
    }

    if (item.metadata?.description) {
      content += `DESCRIPTION:\n${item.metadata.description}\n\n`;
    }

    if (item.metadata?.tags && item.metadata.tags.length > 0) {
      content += `TAGS:\n${item.metadata.tags.join(', ')}\n\n`;
    }

    if (item.script?.sections && item.script.sections.length > 0) {
      content += `====================================\nFULL SCRIPT & TALKING POINTS\n====================================\n\n`;
      item.script.sections.forEach((sec, idx) => {
        content += `[SECTION ${idx + 1}: ${sec.sectionName.toUpperCase()} (${sec.estimatedDuration})]\n`;
        content += `Tone: ${sec.tone}\n`;
        content += `Visual Cues: ${sec.visualCues}\n\n`;
        content += `SPOKEN SCRIPT:\n${sec.fullScript}\n\n`;
        content += `TALKING POINTS:\n`;
        sec.talkingPoints.forEach((tp) => {
          content += `- ${tp}\n`;
        });
        content += `\nRetention: ${sec.retentionStrategy}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VidPulse_RecordingSheet_${item.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                Recording Queue &amp; Production Sheet
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                  Ready to Film
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Every researched topic with its finalized title, full teleprompter script, SEO description, and thumbnail concept in one place.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/studio"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Content Studio</span>
          </Link>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Ready to Record (To-Do)</span>
            <span className="text-2xl font-black text-amber-400">{readyCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
            <Video className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Filmed &amp; Completed</span>
            <span className="text-2xl font-black text-emerald-400">{recordedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Total Researched Packages</span>
            <span className="text-2xl font-black text-white">{items.length}</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Bulk Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready_to_record')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'ready_to_record'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              <Circle className="w-2.5 h-2.5 fill-current" />
              <span>Ready to Record ({readyCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('recorded')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'recorded'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Filmed ({recordedCount})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search topics or scripts..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">{selectedIds.size} selected:</span>
            <button
              onClick={() => handleBulkStatus('recorded')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition cursor-pointer"
            >
              Mark Filmed
            </button>
            <button
              onClick={() => handleBulkStatus('ready_to_record')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
            >
              Mark To Record
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Production Items Accordion List */}
      {filteredItems.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <Film className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Your Recording Queue is Empty</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            When you research a topic in Content Studio or Keyword Vault, click <strong>&quot;Add to Recording Queue&quot;</strong> to save the title, script, and SEO package here so you can film it seamlessly.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Go to Content Studio</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isChecked = selectedIds.has(item.id);
            const activeTab = activeTabByItem[item.id] || 'teleprompter';

            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition overflow-hidden ${
                  item.status === 'recorded'
                    ? 'bg-slate-950/60 border-slate-800/60 opacity-80'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Accordion Header Banner */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(item.id)}
                      className="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-700 text-rose-600 focus:ring-0 cursor-pointer accent-rose-600 shrink-0"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Recording status badge toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                            item.status === 'recorded'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          {item.status === 'recorded' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Filmed / Complete</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-2.5 h-2.5 fill-current" />
                              <span>Ready to Record</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          Topic: {item.topic}
                        </span>

                        {item.script?.totalEstimatedDuration && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                            ⏱️ {item.script.totalEstimatedDuration}
                          </span>
                        )}
                      </div>

                      <h2
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`text-base font-bold cursor-pointer transition ${
                          item.status === 'recorded' ? 'line-through text-slate-400' : 'text-white hover:text-rose-400'
                        }`}
                      >
                        {item.title}
                      </h2>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-stretch sm:self-center justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExportTxt(item)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                        title="Download Full Production Sheet (.txt)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <Link
                        href={`/dashboard/studio?topic=${encodeURIComponent(item.topic)}`}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                        title="Edit in Content Studio"
                      >
                        <Sparkles className="w-4 h-4 text-rose-400" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${item.title}" from recording queue?`)) {
                            deleteProductionItem(item.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse' : 'Open Sheet'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Production Sheet View */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-3 sm:p-5 space-y-6 bg-slate-950/80">
                    {/* View Switcher Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold overflow-x-auto no-scrollbar max-w-full">
                        <button
                          onClick={() =>
                            setActiveTabByItem((prev) => ({ ...prev, [item.id]: 'teleprompter' }))
                          }
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            activeTab === 'teleprompter'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Teleprompter</span>
                        </button>

                        <button
                          onClick={() =>
                            setActiveTabByItem((prev) => ({ ...prev, [item.id]: 'script' }))
                          }
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            activeTab === 'script'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>Talking Points</span>
                        </button>

                        <button
                          onClick={() =>
                            setActiveTabByItem((prev) => ({ ...prev, [item.id]: 'metadata' }))
                          }
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            activeTab === 'metadata'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>SEO &amp; Tags</span>
                        </button>

                        <button
                          onClick={() =>
                            setActiveTabByItem((prev) => ({ ...prev, [item.id]: 'thumbnail' }))
                          }
                          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                            activeTab === 'thumbnail'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Thumbnail</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                            item.status === 'recorded'
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          <span>{item.status === 'recorded' ? 'Mark as Not Filmed' : 'Mark as Filmed & Completed'}</span>
                        </button>
                      </div>
                    </div>

                    {/* TAB 1: TELEPROMPTER SCRIPT */}
                    {activeTab === 'teleprompter' && (
                      <div className="space-y-4">
                        {item.script?.sections && item.script.sections.length > 0 ? (
                          <div className="space-y-4">
                            {item.script.sections.map((sec, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                                      {sec.estimatedDuration}
                                    </span>
                                    <span className="text-xs font-bold text-white uppercase">
                                      {sec.sectionName}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      ({sec.tone})
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleCopy(sec.fullScript, `prompter_${item.id}_${sIdx}`)}
                                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `prompter_${item.id}_${sIdx}` ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>Copy</span>
                                  </button>
                                </div>

                                <p className="text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-wrap">
                                  {sec.fullScript}
                                </p>

                                {sec.visualCues && (
                                  <div className="pt-2 text-[11px] text-amber-300/90 font-mono">
                                    🎬 <strong>Visual Cue:</strong> {sec.visualCues}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-500 text-xs">
                            No full script generated yet. Launch Content Studio to generate word-for-word lines.
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: TALKING POINTS */}
                    {activeTab === 'script' && (
                      <div className="space-y-4">
                        {item.script?.sections && item.script.sections.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.script.sections.map((sec, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                              >
                                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                                  <span className="text-xs font-bold text-indigo-300">
                                    {sec.sectionName} ({sec.estimatedDuration})
                                  </span>
                                  <span className="text-[10px] text-slate-500">{sec.retentionStrategy}</span>
                                </div>
                                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside pt-1">
                                  {sec.talkingPoints.map((tp, pIdx) => (
                                    <li key={pIdx} className="leading-relaxed">
                                      {tp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-500 text-xs">
                            No talking points saved for this item yet.
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: METADATA & SEO */}
                    {activeTab === 'metadata' && (
                      <div className="space-y-4">
                        {/* SEO Description */}
                        {item.metadata?.description ? (
                          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300">
                                SEO Description (Hook, Timestamps &amp; CTA)
                              </span>
                              <button
                                onClick={() => handleCopy(item.metadata!.description, `desc_${item.id}`)}
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                              >
                                {copiedKey === `desc_${item.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy Full Description</span>
                              </button>
                            </div>
                            <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                              {item.metadata.description}
                            </pre>
                          </div>
                        ) : null}

                        {/* Tags */}
                        {item.metadata?.tags && item.metadata.tags.length > 0 && (
                          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300">
                                YouTube Tags ({item.metadata.tags.length})
                              </span>
                              <button
                                onClick={() => handleCopy(item.metadata!.tags.join(', '), `tags_${item.id}`)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `tags_${item.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy Tags</span>
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {item.metadata.tags.map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: THUMBNAIL CONCEPT */}
                    {activeTab === 'thumbnail' && (
                      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                        {item.metadata?.thumbnailHookConcept ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                Text Overlay
                              </span>
                              <div className="text-xl font-black text-rose-400 uppercase py-1">
                                &quot;{item.metadata.thumbnailHookConcept.textOverlay}&quot;
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Colors: {item.metadata.thumbnailHookConcept.colorScheme}
                              </span>
                            </div>

                            <div className="md:col-span-2 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                              <span className="text-xs font-bold text-slate-300">Visual Composition:</span>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {item.metadata.thumbnailHookConcept.visualLayout}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-slate-500 text-xs">
                            No thumbnail concept saved for this item yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
