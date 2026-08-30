'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getOverview, getMyDashboard } from '@/lib/api';
import {
  LayoutDashboard, Users, Settings, LogOut,
  TrendingUp, ListOrdered, BarChart2, Activity, Briefcase, CalendarDays,
  Menu, X,
} from 'lucide-react';
import Image from 'next/image';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

// Real connection health — derived from the last successful data poll.
export type ConnStatus = 'live' | 'stale' | 'offline' | 'unknown';

const STATUS_META: Record<ConnStatus, { label: string; color: string; dot: string; ping: boolean }> = {
  live:    { label: 'LIVE',    color: 'text-green', dot: 'bg-green', ping: true  },
  stale:   { label: 'STALE',   color: 'text-warn',  dot: 'bg-warn',  ping: false },
  offline: { label: 'OFFLINE', color: 'text-red',   dot: 'bg-red',   ping: false },
  unknown: { label: '···',     color: 'text-muted', dot: 'bg-muted', ping: false },
};

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

  const [email, setEmail]       = useState<string>('');
  const [mobileOpen, setOpen]   = useState(false);
  const [status, setStatus]     = useState<ConnStatus>('unknown');
  const lastOkRef  = useRef(0);
  const lastErrRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEmail(localStorage.getItem('vevi_email') || '');
  }, []);

  // Connection health: poll the role-appropriate endpoint and grade freshness.
  // green LIVE (<60s) · amber STALE (60s–5min) · red OFFLINE (>5min or errored).
  useEffect(() => {
    let stopped = false;
    const compute = () => {
      const ok = lastOkRef.current, err = lastErrRef.current;
      if (ok === 0 && err === 0) { setStatus('unknown'); return; }
      if (err > ok)              { setStatus('offline'); return; }
      const age = Date.now() - ok;
      setStatus(age < 60_000 ? 'live' : age < 300_000 ? 'stale' : 'offline');
    };
    const ping = async () => {
      try {
        if (role === 'admin') await getOverview(); else await getMyDashboard();
        lastOkRef.current = Date.now();
      } catch {
        lastErrRef.current = Date.now();
      }
      if (!stopped) compute();
    };
    ping();
    const pv = setInterval(ping, 30_000);      // re-poll backend
    const cv = setInterval(compute, 10_000);   // re-grade staleness between polls
    return () => { stopped = true; clearInterval(pv); clearInterval(cv); };
  }, [role]);

  const statusMeta = STATUS_META[status];

  // Close mobile drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const logout = () => {
    localStorage.removeItem('vevi_token');
    localStorage.removeItem('vevi_role');
    localStorage.removeItem('vevi_email');
    localStorage.removeItem('vevi_account_id');
    router.push('/login');
  };

  const initial = email ? email[0].toUpperCase() : '·';

  return (
    <>
      {/* ── MOBILE TOP BAR — only visible < md ────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-surface/95 backdrop-blur border-b border-border flex items-center justify-between px-4">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 text-text hover:bg-elevated rounded-lg active:scale-95 transition-transform"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Image src="/vevi-logo.svg" alt="Vevi" width={72} height={20} priority />
          <span className="flex items-center gap-1" title={`Backend connection: ${statusMeta.label}`}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusMeta.dot, statusMeta.ping && 'animate-pulse-slow')} />
            <span className={cn('text-[9px] font-mono font-bold tracking-wider', statusMeta.color)}>{statusMeta.label}</span>
          </span>
        </div>
        <div className="w-7 h-7 border border-accent/35 flex items-center justify-center">
          <span className="text-[11px] font-mono font-bold text-accent">{initial}</span>
        </div>
      </div>

      {/* Mobile spacer so content isn't behind the bar */}
      <div className="md:hidden h-14 shrink-0" />

      {/* ── MOBILE DRAWER (backdrop + slide-in) ─────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          // h-[100dvh] = dynamic viewport height; correctly handles iOS Safari's
          // address bar + bottom toolbar that shrink/grow the visible area
          // (h-screen would put the bottom of the drawer behind the URL bar).
          'md:hidden fixed top-0 left-0 z-50 w-72 h-[100dvh] bg-surface border-r border-border flex flex-col transition-transform duration-300',
          'pb-[env(safe-area-inset-bottom)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarBody
          role={role}
          nav={nav}
          pathname={pathname}
          email={email}
          initial={initial}
          logout={logout}
          status={status}
          onItemClick={() => setOpen(false)}
          showClose
          onClose={() => setOpen(false)}
        />
      </aside>

      {/* ── DESKTOP SIDEBAR — md and up ─────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-[212px] shrink-0 bg-surface border-r border-border flex-col min-h-screen sticky top-0">
        <SidebarBody
          role={role}
          nav={nav}
          pathname={pathname}
          email={email}
          initial={initial}
          logout={logout}
          status={status}
        />
      </aside>
    </>
  );
}

function SidebarBody({
  role, nav, pathname, email, initial, logout, status, onItemClick, showClose, onClose,
}: {
  role: 'admin' | 'member';
  nav: NavItem[];
  pathname: string;
  email: string;
  initial: string;
  logout: () => void;
  status: ConnStatus;
  onItemClick?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  const meta = STATUS_META[status];
  return (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <Image src="/vevi-logo.svg" alt="Vevi" width={92} height={25} priority />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5" title={`Backend connection: ${meta.label}`}>
              <span className="relative flex h-1.5 w-1.5">
                {meta.ping && (
                  <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', meta.dot)} />
                )}
                <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', meta.dot)} />
              </span>
              <span className={cn('text-[9px] font-mono font-bold tracking-wider', meta.color)}>{meta.label}</span>
            </span>
            {showClose && (
              <button onClick={onClose} aria-label="Close menu"
                className="p-1 text-muted hover:text-text active:scale-95 transition-transform">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="lbl mb-4">Algorithmic Edge</p>

        {/* User identity */}
        <div className="border border-border px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-6 h-6 border border-accent/35 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-mono font-bold text-accent">{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-text font-sans truncate leading-tight" title={email || 'signed in'}>
              {email || 'signed in'}
            </p>
            <p className="text-[11px] text-muted font-mono tracking-wide mt-0.5">
              {role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 flex flex-col overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm transition-colors duration-150 cursor-pointer',
                'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:transition-colors before:duration-150',
                active
                  ? 'text-text bg-white/[.035] before:bg-accent'
                  : 'text-muted before:bg-transparent hover:text-text hover:bg-white/[.02] active:bg-white/[.05]',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="py-2 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 pl-4 pr-3 py-2.5 text-sm text-muted hover:bg-white/[.02] hover:text-red active:bg-white/[.05] transition-colors duration-150 cursor-pointer w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );
}
