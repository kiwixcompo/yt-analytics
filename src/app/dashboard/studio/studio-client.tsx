'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clapperboard,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  RefreshCw,
  HelpCircle,
  Flame,
  ArrowRight,
  TrendingUp,
  Tag,
  FileText,
  Clock,
  Eye,
  Sliders,
  CheckCircle2,
  Cpu,
  ChevronDown,
  BookOpen,
  Film,
  Download,
  Edit3,
  Video,
  ListOrdered,
  Layers,
  Sparkle,
} from 'lucide-react';
import { updateVaultKeyword, getSavedKeywords } from '@/lib/vault-service';
import { saveToProductionPipeline } from '@/lib/production-service';

interface TitleOption {
  title: string;
  hookType: string;
  predictedCTR: string;
  explanation: string;
}

interface MetadataResponse {
  titles: TitleOption[];
  recommendedTitle: string;
  seoDescription: {
    hookParagraph: string;
    body: string;
    timestampsPlaceholder: string;
    callToAction: string;
  };
  tags: string[];
  thumbnailHookConcept: {
    visualLayout: string;
    textOverlay: string;
    colorScheme: string;
  };
  activeProvider?: string;
}

interface ScriptSection {
  id: string;
  sectionName: string;
  estimatedDuration: string;
  tone: string;
  fullScript: string;
  talkingPoints: string[];
  visualCues: string;
  retentionStrategy: string;
}

interface ScriptResponse {
  totalEstimatedDuration: string;
  recommendedPacing: string;
  sections: ScriptSection[];
  activeProvider?: string;
}

function StudioContent() {
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get('topic') || '';
  const vaultId = searchParams.get('vaultId') || '';

  // Studio Mode: Metadata Packaging vs Full Script Builder
  const [activeStudioTab, setActiveStudioTab] = useState<'metadata' | 'script'>('metadata');

  // Core Form Inputs
  const [topic, setTopic] = useState(initialTopic || 'Personal Finance for Beginners');
  const [videoStyle, setVideoStyle] = useState<'talking_head' | 'screencast' | 'vlog_story' | 'podcast'>('talking_head');
  const [titleTone, setTitleTone] = useState<'assertive_provocative' | 'question_hook' | 'bold_statement' | 'educational_curiosity'>('assertive_provocative');
  const [targetAudience, setTargetAudience] = useState('Adults 20-35 who feel stuck or overwhelmed');
  const [aiProvider, setAiProvider] = useState<'auto' | 'groq' | 'huggingface'>('auto');

  // Script Builder Form Inputs
  const [scriptTone, setScriptTone] = useState<'high_energy' | 'thoughtful_deep' | 'conversational_funny' | 'educational_authoritative' | 'controversial_provocative'>('controversial_provocative');
  const [videoLengthMinutes, setVideoLengthMinutes] = useState<number>(8);
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Generation States
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isAligningTitle, setIsAligningTitle] = useState(false);
  const [metadataResult, setMetadataResult] = useState<MetadataResponse | null>(null);
  const [scriptResult, setScriptResult] = useState<ScriptResponse | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedToVaultToast, setSavedToVaultToast] = useState(false);

  // Active view in script builder: 'full_script' vs 'talking_points'
  const [scriptViewMode, setScriptViewMode] = useState<'full_script' | 'talking_points'>('full_script');

  // If topic changes in URL
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Generate Metadata Handler
  const handleGenerateMetadata = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setIsGeneratingMetadata(true);
    setMetadataResult(null);

    try {
      const res = await fetch('/api/ai/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          videoStyle,
          titleTone,
          targetAudience,
          provider: aiProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate metadata');

      setMetadataResult(data);
      const chosen = data.recommendedTitle || data.titles?.[0]?.title || '';
      setSelectedTitle(chosen);
      if (chosen) {
        alignEverythingToTitle(chosen, data);
      }
    } catch (err: any) {
      console.error('Metadata generation failed:', err);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // Align chapters, timestamps, script & talking points to the exact energy of the selected title
  const alignEverythingToTitle = async (newTitle: string, currentMeta = metadataResult) => {
    setSelectedTitle(newTitle);
    setIsAligningTitle(true);

    try {
      const res = await fetch('/api/ai/align-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          topic: topic.trim(),
          videoStyle,
          provider: aiProvider,
        }),
      });

      const alignData = await res.json();
      if (!res.ok) throw new Error(alignData.error || 'Failed to align title');

      // 1. Update Chapters & Timestamps and above-the-fold hook inside metadata
      if (currentMeta) {
        setMetadataResult({
          ...currentMeta,
          seoDescription: {
            ...currentMeta.seoDescription,
            hookParagraph: alignData.alignedHook || currentMeta.seoDescription.hookParagraph,
            timestampsPlaceholder: alignData.timestampsString || currentMeta.seoDescription.timestampsPlaceholder,
          },
        });
      }

      // 2. Synchronize script and talking points to match the exact title energy
      if (alignData.scriptOutline) {
        setScriptResult(alignData.scriptOutline);
      }
    } catch (err) {
      console.error('Error synchronizing chapters and script to title:', err);
    } finally {
      setIsAligningTitle(false);
    }
  };

  // Generate Script Handler
  const handleGenerateScript = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveTitle = selectedTitle.trim() || topic.trim();
    if (!effectiveTitle) return;

    setIsGeneratingScript(true);
    setScriptResult(null);

    try {
      const res = await fetch('/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          title: effectiveTitle,
          videoStyle,
          scriptTone,
          videoLengthMinutes,
          customInstructions,
          provider: aiProvider,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to build script');

      setScriptResult(data);
    } catch (err: any) {
      console.error('Script generation failed:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Save generated metadata + script back to Keyword Vault card if vaultId is present
  const handleSaveBackToVault = () => {
    // 1. Always save to Production Queue (Ready to Film)
    saveToProductionPipeline({
      topic: topic.trim(),
      title: selectedTitle || topic.trim(),
      metadata: metadataResult
        ? {
            titles: metadataResult.titles.map((t) => t.title),
            selectedTitle: selectedTitle || topic.trim(),
            description: fullDescriptionString,
            tags: metadataResult.tags,
            thumbnailHookConcept: metadataResult.thumbnailHookConcept,
          }
        : undefined,
      script: scriptResult || undefined,
      status: 'ready_to_record',
    });

    // 2. Also link back to Keyword Vault item if applicable
    if (vaultId) {
      const payload: any = {
        status: 'scripted',
      };

      if (metadataResult) {
        payload.generatedMetadata = {
          titles: metadataResult.titles.map((t) => t.title),
          selectedTitle,
          description: fullDescriptionString,
          tags: metadataResult.tags,
          scriptOutline: scriptResult || undefined,
        };
      }

      updateVaultKeyword(vaultId, payload);
    }

    setSavedToVaultToast(true);
    setTimeout(() => setSavedToVaultToast(false), 3500);
  };

  // Assemble full description string
  const fullDescriptionString = metadataResult
    ? `${metadataResult.seoDescription.hookParagraph}

${metadataResult.seoDescription.body}

TIMESTAMPS:
${metadataResult.seoDescription.timestampsPlaceholder}

${metadataResult.seoDescription.callToAction}`
    : '';

  // Export Script as Text File
  const handleExportScriptText = () => {
    if (!scriptResult) return;
    let content = `VIDPULSE STUDIO SCRIPT OUTLINE\n====================================\nTopic: ${topic}\nTitle: ${selectedTitle || topic}\nEstimated Duration: ${scriptResult.totalEstimatedDuration}\nPacing: ${scriptResult.recommendedPacing}\n====================================\n\n`;

    scriptResult.sections.forEach((sec, i) => {
      content += `SECTION ${i + 1}: ${sec.sectionName.toUpperCase()} (${sec.estimatedDuration})\n`;
      content += `Tone: ${sec.tone}\n`;
      content += `Visual Cues: ${sec.visualCues}\n\n`;
      content += `[FULL SPOKEN SCRIPT]:\n${sec.fullScript}\n\n`;
      content += `[KEY TALKING POINTS]:\n`;
      sec.talkingPoints.forEach((pt) => {
        content += `- ${pt}\n`;
      });
      content += `\nRetention Strategy: ${sec.retentionStrategy}\n`;
      content += `------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VidPulse_Script_${(selectedTitle || topic).replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full px-4 sm:px-8 py-8 space-y-8 text-slate-100 max-w-7xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-600/20">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Content Studio</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              Production Lab
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Engineer viral psychological titles, SEO description packaging, and high-retention talking head scripts with tailored talking points.
          </p>
        </div>

        {/* AI Provider Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] text-slate-400 font-semibold">Engine:</span>
          <select
            value={aiProvider}
            onChange={(e: any) => setAiProvider(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="auto" className="bg-slate-900 text-white">Auto (Groq ➔ HuggingFace)</option>
            <option value="groq" className="bg-slate-900 text-white">Groq Cloud (Ultra-Fast)</option>
            <option value="huggingface" className="bg-slate-900 text-white">Hugging Face (Serverless)</option>
          </select>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => setActiveStudioTab('metadata')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeStudioTab === 'metadata'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Stage 1: Titles &amp; SEO Packaging</span>
        </button>

        <button
          onClick={() => {
            setActiveStudioTab('script');
            // If script isn't generated yet and we have a topic, trigger it automatically or let user adjust
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeStudioTab === 'script'
              ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Stage 2: Script &amp; Talking Points Builder</span>
          {scriptResult && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: METADATA & TITLES PACKAGING                                       */}
      {/* ========================================================================= */}
      {activeStudioTab === 'metadata' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Form & Configuration */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <form onSubmit={handleGenerateMetadata} className="space-y-4">
              {/* Topic input */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Target Topic or Seed Keyword
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Why smart people stay broke, Passive income in 2026, Python clean code..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                  {vaultId && (
                    <div className="absolute right-3 top-2.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400">
                      📌 Connected to Vault Keyword
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Video Style */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Video Format &amp; Delivery Style
                  </label>
                  <select
                    value={videoStyle}
                    onChange={(e: any) => setVideoStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="talking_head">🎙️ Talking Head (Psychological &amp; Direct)</option>
                    <option value="screencast">🖥️ Screencast / Step-by-Step Tutorial</option>
                    <option value="vlog_story">🎭 Narrative Storytelling / Case Study</option>
                    <option value="podcast">🎙️ Long-form Deep Dive / Intellectual</option>
                  </select>
                </div>

                {/* Title Tone Hook */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Primary Title Hook Philosophy
                  </label>
                  <select
                    value={titleTone}
                    onChange={(e: any) => setTitleTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="assertive_provocative">🔥 Assertive &amp; Provocative (e.g. &quot;You&apos;re Broke Because...&quot;)</option>
                    <option value="question_hook">❓ Question Hook (e.g. &quot;Why Are Smart People Poor?&quot;)</option>
                    <option value="bold_statement">📣 Bold Direct Statement (e.g. &quot;This One Habit Ruined Me&quot;)</option>
                    <option value="educational_curiosity">📚 Contrarian Education (e.g. &quot;The Truth About...&quot;)</option>
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Audience Context
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Beginners, skeptical creators, busy professionals"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Action Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                  <span>Generates 5 distinct title angles, 2-line hook description, 20 tags &amp; thumbnail text.</span>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingMetadata || !topic.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isGeneratingMetadata ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Engineering Viral Metadata...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Metadata Package</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Results Area */}
          {metadataResult && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Active Provider Banner */}
              {metadataResult.activeProvider && (
                <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generated via: <strong className="text-slate-200">{metadataResult.activeProvider}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSaveBackToVault}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>📌 Save to Recording Queue (Ready to Film)</span>
                    </button>
                    {vaultId && (
                      <button
                        onClick={handleSaveBackToVault}
                        className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Update Keyword Vault</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Section 1: 5 High-CTR Titles */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-500" />
                      High-CTR Curiosity Titles (Ranked by Predicted CTR)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Click any title to select it as your primary video title and script foundation.
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    5 Angles
                  </span>
                </div>

                <div className="space-y-3">
                  {metadataResult.titles.map((t, idx) => {
                    const isSelected = selectedTitle === t.title;
                    return (
                      <div
                        key={idx}
                        onClick={() => alignEverythingToTitle(t.title)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/10'
                            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {t.hookType}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                              CTR: {t.predictedCTR}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                                {isAligningTitle ? (
                                  <>
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    <span>Syncing Chapters &amp; Script...</span>
                                  </>
                                ) : (
                                  <span>Selected &amp; Synced Title</span>
                                )}
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-white pt-0.5 leading-snug">
                            {t.title}
                          </h3>

                          <p className="text-xs text-slate-400 leading-relaxed">
                            💡 <strong className="text-slate-300">Why it clicks:</strong> {t.explanation}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(t.title, `title_${idx}`);
                            }}
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
                            title="Copy Title"
                          >
                            {copiedKey === `title_${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Full SEO Description Package */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      YouTube Algorithm SEO Description
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Engineered with an above-the-fold hook, keyword-dense body, timestamps, and an engagement CTA.
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopy(fullDescriptionString, 'full_desc')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    {copiedKey === 'full_desc' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Entire Description</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Description</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hook callout (Above the fold) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/30 via-slate-950 to-indigo-950/20 border border-rose-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                    <span>⚡ Above-the-fold Hook (First 2 Lines before &quot;Show More&quot;):</span>
                    <button
                      onClick={() => handleCopy(metadataResult.seoDescription.hookParagraph, 'hook_lines')}
                      className="text-[11px] text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedKey === 'hook_lines' ? 'Copied' : 'Copy Hook'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-line font-medium leading-relaxed">
                    {metadataResult.seoDescription.hookParagraph}
                  </p>
                </div>

                {/* Body */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 block">SEO Keyword Body:</span>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {metadataResult.seoDescription.body}
                  </p>
                </div>

                {/* Timestamps & CTA Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 block flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Suggested Chapters &amp; Timestamps (Aligned to Chosen Title):</span>
                      </span>
                      {isAligningTitle && (
                        <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Calibrating to Title...
                        </span>
                      )}
                    </div>
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {metadataResult.seoDescription.timestampsPlaceholder}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                    <span className="text-xs font-bold text-amber-400 block">Algorithm Engagement CTA:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {metadataResult.seoDescription.callToAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Ranking Tags & Thumbnail Hook */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tags (7 cols) */}
                <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        Ranking Video Tags ({metadataResult.tags.length})
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Extracted from actual high-volume search metrics.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(metadataResult.tags.join(', '), 'tags_csv')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                    >
                      {copiedKey === 'tags_csv' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied for YouTube Studio</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy All (Comma-Separated)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {metadataResult.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        onClick={() => handleCopy(tag, `tag_${tIdx}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium hover:border-emerald-500/50 hover:text-emerald-300 transition cursor-pointer"
                        title="Click to copy individual tag"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Thumbnail Visual Concept (5 cols) */}
                <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 space-y-4">
                  <div className="pb-3 border-b border-slate-800">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      Thumbnail Curiosity Concept
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Engineered text and visual pairing for feed CTR.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-center space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Recommended 3-Word Overlay
                      </span>
                      <div className="text-2xl font-black text-rose-500 tracking-tight py-1 uppercase">
                        &quot;{metadataResult.thumbnailHookConcept.textOverlay}&quot;
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Color: {metadataResult.thumbnailHookConcept.colorScheme}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/60 space-y-1">
                      <span className="text-xs font-bold text-slate-300 block">Visual Framing:</span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {metadataResult.thumbnailHookConcept.visualLayout}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway to Part 4: Jump directly to Script Builder */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-indigo-950/40 border border-rose-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Metadata Locked In &rarr; Continue to Script Builder</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                    You have chosen: <strong>&quot;{selectedTitle}&quot;</strong>. Turn this into an engaging, structured video script with talking points.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setActiveStudioTab('script');
                    if (!scriptResult) {
                      handleGenerateScript();
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer shrink-0"
                >
                  <span>Build Script Outline Now &rarr;</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCRIPT & TALKING POINTS BUILDER (PART 4)                          */}
      {/* ========================================================================= */}
      {activeStudioTab === 'script' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Script Builder Configuration Bar */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <div className="pb-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  Script Architecture &amp; Retention Controls
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure delivery tone, target length, and pacing for <strong>&quot;{selectedTitle || topic}&quot;</strong>
                </p>
              </div>

              {scriptResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveBackToVault}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>📌 Save to Recording Queue</span>
                  </button>
                  <button
                    onClick={handleExportScriptText}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download (.txt)</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleGenerateScript} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Script Tone */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Delivery Tone &amp; Energy
                  </label>
                  <select
                    value={scriptTone}
                    onChange={(e: any) => setScriptTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="controversial_provocative">🔥 Provocative &amp; Assertive (Unpopular Truths)</option>
                    <option value="high_energy">⚡ High Energy &amp; Motivational (Punchy &amp; Fast)</option>
                    <option value="thoughtful_deep">🤔 Thoughtful &amp; Philosophical (Deep Insight)</option>
                    <option value="conversational_funny">😂 Conversational &amp; Witty (Relatable &amp; Funny)</option>
                    <option value="educational_authoritative">🎓 Authoritative &amp; Direct (Teacher-First)</option>
                  </select>
                </div>

                {/* Target Length */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Video Duration
                  </label>
                  <select
                    value={videoLengthMinutes}
                    onChange={(e: any) => setVideoLengthMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={5}>⏱️ 5 Minutes (Fast Punchy Breakdown)</option>
                    <option value={8}>⏱️ 8-10 Minutes (Standard YouTube Sweetspot)</option>
                    <option value={12}>⏱️ 12-15 Minutes (Comprehensive Masterclass)</option>
                    <option value={20}>⏱️ 20+ Minutes (Deep-Dive Documentary Style)</option>
                  </select>
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Custom Notes / Stories to Include
                  </label>
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Mention my portfolio breakdown, emphasize mistake #2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  Topic: <strong className="text-slate-200">{topic}</strong> &bull; Title:{' '}
                  <strong className="text-rose-400">{selectedTitle || topic}</strong>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingScript}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isGeneratingScript ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scripting Retention Flow...</span>
                    </>
                  ) : (
                    <>
                      <Film className="w-4 h-4" />
                      <span>{scriptResult ? 'Regenerate Script' : 'Generate Full Script'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Script Content Display */}
          {scriptResult && (
            <div className="space-y-6">
              {/* Pacing & Overview Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    ⏱️ Estimated Duration: {scriptResult.totalEstimatedDuration}
                  </span>
                  <span className="text-slate-400">
                    Pacing Strategy: <strong className="text-slate-200">{scriptResult.recommendedPacing}</strong>
                  </span>
                </div>

                {/* View Mode Switcher (Full Script vs Bulleted Talking Points) */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setScriptViewMode('full_script')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      scriptViewMode === 'full_script'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Full Teleprompter Script</span>
                  </button>

                  <button
                    onClick={() => setScriptViewMode('talking_points')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      scriptViewMode === 'talking_points'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Bullet Talking Points</span>
                  </button>
                </div>
              </div>

              {/* Sections Accordion / Cards List */}
              <div className="space-y-5">
                {scriptResult.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                          {sec.estimatedDuration}
                        </span>
                        <h3 className="text-sm font-bold text-white">
                          {sec.sectionName}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                          Tone: {sec.tone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(sec.fullScript, `sec_script_${idx}`)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold transition cursor-pointer"
                        >
                          {copiedKey === `sec_script_${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied Section</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content: Mode dependent */}
                    {scriptViewMode === 'full_script' ? (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                          Spoken Script (Read to Camera / Teleprompter):
                        </span>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                          {sec.fullScript}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">
                          Off-Script Delivery Talking Points:
                        </span>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                          {sec.talkingPoints.map((pt, pIdx) => (
                            <div key={pIdx} className="flex items-start gap-2.5 text-xs text-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                              <span className="leading-relaxed font-medium">{pt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cue Notes & Retention Strategy Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-400 space-y-0.5">
                        <span className="font-bold text-amber-400 text-[11px] block">🎬 Visual &amp; B-Roll Cue:</span>
                        <p className="leading-snug text-slate-300">{sec.visualCues}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60 text-slate-400 space-y-0.5">
                        <span className="font-bold text-emerald-400 text-[11px] block">🧠 Retention Psychological Strategy:</span>
                        <p className="leading-snug text-slate-300">{sec.retentionStrategy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar Bottom */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Ready to film? Save this script into your Keyword Vault pipeline to track your recording status.
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportScriptText}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Script File</span>
                  </button>

                  {vaultId && (
                    <button
                      onClick={handleSaveBackToVault}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Attach to Keyword Vault Card</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!scriptResult && !isGeneratingScript && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
              <Film className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Script Generated Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Configure your preferred delivery tone and video length above, then click <strong>&quot;Generate Full Script&quot;</strong> to build your 5-stage retention outline.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vault Save Success Toast */}
      {savedToVaultToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-950/90 text-indigo-200 border border-indigo-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Script and metadata saved to Keyword Vault! Status updated to &quot;Scripted&quot;.</span>
        </div>
      )}
    </div>
  );
}

export default function StudioPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Content Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
