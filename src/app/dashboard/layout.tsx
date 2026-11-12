'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileBottomNav from './components/mobile-bottom-nav';
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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Flame,
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
  { href: '/dashboard/most-searched', label: 'Most Searched', icon: Flame, badge: 'Hot' },
  { href: '/dashboard/research', label: 'Keyword Research', icon: Search },
  { href: '/dashboard/vault', label: 'Keyword Vault', icon: Bookmark },
  { href: '/dashboard/studio', label: 'Content Studio', icon: Clapperboard },
  { href: '/dashboard/production', label: 'Recording Queue', icon: Film, badge: 'Ready' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/trends', label: 'Trend Scout', icon: Compass },
  { href: '/dashboard/competitors', label: 'Competitor Radar', icon: Radar },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const isActive = (item: NavItem): boolean => {
    if (item.isAnchor) return false;
    if (item.exactMatch) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-2.5 px-4 py-4 border-b border-slate-800 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo.svg"
            alt="VidPulse Studio Logo"
            className="w-8 h-8 rounded-xl shrink-0 shadow-md shadow-rose-600/20"
          />
          {!collapsed && (
            <span className="font-bold text-sm text-white tracking-tight truncate">
              VidPulse Studio
            </span>
          )}
        </Link>

        {/* Desktop Collapse Toggle Button inside header */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Minimize sidebar to icons'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          if (item.isAnchor) {
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                collapsed ? 'justify-center px-0' : 'px-3'
              } ${
                active
                  ? 'bg-rose-500/10 text-rose-400 font-bold border-r-2 border-rose-500 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
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
      <div className={`p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <a
          href="http://localhost:3000/dashboard"
          title={collapsed ? 'Chrome Extension' : undefined}
          className={`flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 transition-colors ${
            collapsed ? 'justify-center px-0' : 'px-3'
          }`}
        >
          <Puzzle className="w-4 h-4 shrink-0 text-indigo-400" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-semibold text-slate-400 truncate">Chrome Extension</div>
              <div className="text-[10px] text-slate-600 truncate">Also available in browser</div>
            </div>
          )}
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* ── Desktop Sidebar (Dynamic Width when collapsed) ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarContent collapsed={isCollapsed} />
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
        <SidebarContent collapsed={false} />
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md shrink-0">
          {/* Left: mobile hamburger + desktop collapse trigger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Quick Toggle Icon */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar to icons'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-indigo-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* VidPulse logo text */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-sm">
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
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950 pb-20 md:pb-0">
          {children}
        </main>

        {/* ── Mobile Bottom Navigation Bar ── */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
