'use client';

import React from 'react';
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
} from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const mobileTabs: TabItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/research', label: 'Research', icon: Search },
  { href: '/dashboard/studio', label: 'Studio', icon: Clapperboard },
  { href: '/dashboard/production', label: 'Record', icon: Film, badge: 'Ready' },
  { href: '/dashboard/vault', label: 'Vault', icon: Bookmark },
  { href: '/dashboard/analytics', label: 'Stats', icon: BarChart3 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-pb"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {mobileTabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                active
                  ? 'text-rose-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 text-rose-500' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[50px] text-center">
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-6 h-0.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
