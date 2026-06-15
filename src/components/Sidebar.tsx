'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Settings, LogOut,
  TrendingUp, ListOrdered, BarChart2, Activity, Briefcase, CalendarDays,
} from 'lucide-react';
import Image from 'next/image';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { href: '/admin',            label: 'Overview',     icon: <LayoutDashboard size={16} /> },
  { href: '/admin/accounts',   label: 'Accounts',     icon: <Users size={16} /> },
  { href: '/admin/activity',   label: 'Activity',     icon: <Activity size={16} /> },
  { href: '/admin/trades',     label: 'Trades',       icon: <Briefcase size={16} /> },
  { href: '/admin/pnl',        label: 'P&L Calendar', icon: <CalendarDays size={16} /> },
  { href: '/admin/charts',     label: 'Charts',       icon: <BarChart2 size={16} /> },
  { href: '/admin/settings',   label: 'Settings',     icon: <Settings size={16} /> },
];

const memberNav: NavItem[] = [
  { href: '/member',         label: 'Dashboard', icon: <TrendingUp size={16} /> },
  { href: '/member/trades',  label: 'Trades',    icon: <ListOrdered size={16} /> },
  { href: '/member/charts',  label: 'Charts',    icon: <BarChart2 size={16} /> },
];

interface Props { role: 'admin' | 'member'; }

export function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const nav      = role === 'admin' ? adminNav : memberNav;

  const [email, setEmail] = useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEmail(localStorage.getItem('vevi_email') || '');
  }, []);

  const logout = () => {
    localStorage.removeItem('vevi_token');
    localStorage.removeItem('vevi_role');
    localStorage.removeItem('vevi_email');
    localStorage.removeItem('vevi_account_id');
    router.push('/login');
  };

  const initial = email ? email[0].toUpperCase() : '·';

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col min-h-screen">
      {/* ── Brand block ──────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <Image src="/vevi-logo.svg" alt="Vevi" width={92} height={25} priority />
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
            </span>
            <span className="text-[9px] font-mono font-bold text-green tracking-wider">LIVE</span>
          </span>
        </div>
        <p className="text-[11px] text-muted font-sans tracking-wide mb-4">Algorithmic Edge</p>

        {/* User identity card */}
        <div className="bg-elevated border border-border/60 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green/20 to-green/5 border border-green/30 flex items-center justify-center shrink-0">
            <span className="text-[12px] font-mono font-bold text-green">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-text font-sans truncate leading-tight" title={email || 'signed in'}>
              {email || 'signed in'}
            </p>
            <p className="text-[9px] text-muted/80 font-mono tracking-wide mt-0.5">
              {role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-colors duration-150 cursor-pointer',
                active
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'text-muted hover:bg-elevated hover:text-text border border-transparent',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Logout ───────────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-muted hover:bg-elevated hover:text-red transition-colors duration-150 cursor-pointer w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
