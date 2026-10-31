'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  Clapperboard,
  Film,
  BarChart3,
  Compass,
  Radar,
  Menu,
  X,
  Zap,
  Puzzle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  isAnchor?: boolean;
  exactMatch?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, exactMatch: true },
  { href: '/dashboard/research', label: 'Keyword Research', icon: Search },
  { href: '/dashboard/vault', label: 'Keyword Vault', icon: Bookmark },
  { href: '/dashboard/studio', label: 'Content Studio', icon: Clapperboard },
  { href: '/dashboard/production', label: 'Recording Queue', icon: Film, badge: 'Ready' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  {
    href: '/dashboard#section-google-trends',
    label: 'Trend Scout',
    icon: Compass,
    isAnchor: true,
  },
  {
    href: '/dashboard#section-competitor-radar',
    label: 'Competitor Radar',
    icon: Radar,
    isAnchor: true,
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (item: NavItem): boolean => {
    if (item.isAnchor) return false;
    if (item.exactMatch) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shrink-0">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-bold text-sm text-white tracking-tight">VidPulse Studio</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          if (item.isAnchor) {
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-rose-500/10 text-rose-400 border-r-2 border-rose-500'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-slate-800" />

      {/* Bottom section */}
      <div className="p-4">
        <a
          href="http://localhost:3000/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-colors"
        >
          <Puzzle className="w-4 h-4 shrink-0 text-indigo-400" />
          <div className="min-w-0">
            <div className="font-semibold text-slate-400">Chrome Extension</div>
            <div className="text-[10px] text-slate-600 truncate">Also available in your browser</div>
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay Backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile Sidebar (Drawer) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-60 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button inside mobile drawer */}
        <button
          onClick={closeSidebar}
          className="absolute top-3.5 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md shrink-0">
          {/* Left: mobile hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* VidPulse logo text (desktop only, hidden on mobile since sidebar shows it) */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-white">VidPulse</span>
            </div>
          </div>

          {/* Right: Switch Account */}
          <div className="flex items-center gap-3">
            <a
              href="/api/auth/google"
              title="Switch Google Account or pick another Brand Account"
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Switch Account
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
