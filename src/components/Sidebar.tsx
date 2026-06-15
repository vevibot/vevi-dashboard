'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Settings, LogOut,
  TrendingUp, ListOrdered, BarChart2, Activity, Briefcase, CalendarDays,
  Menu, X,
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

  const [email, setEmail]       = useState<string>('');
  const [mobileOpen, setOpen]   = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEmail(localStorage.getItem('vevi_email') || '');
  }, []);

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
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse-slow" />
            <span className="text-[9px] font-mono font-bold text-green tracking-wider">LIVE</span>
          </span>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green/20 to-green/5 border border-green/30 flex items-center justify-center">
          <span className="text-[11px] font-mono font-bold text-green">{initial}</span>
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
          'md:hidden fixed top-0 left-0 z-50 w-72 h-screen bg-surface border-r border-border flex flex-col transition-transform duration-300',
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
          onItemClick={() => setOpen(false)}
          showClose
          onClose={() => setOpen(false)}
        />
      </aside>

      {/* ── DESKTOP SIDEBAR — md and up ─────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-60 shrink-0 bg-surface border-r border-border flex-col min-h-screen sticky top-0">
        <SidebarBody
          role={role}
          nav={nav}
          pathname={pathname}
          email={email}
          initial={initial}
          logout={logout}
        />
      </aside>
    </>
  );
}

function SidebarBody({
  role, nav, pathname, email, initial, logout, onItemClick, showClose, onClose,
}: {
  role: 'admin' | 'member';
  nav: NavItem[];
  pathname: string;
  email: string;
  initial: string;
  logout: () => void;
  onItemClick?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <Image src="/vevi-logo.svg" alt="Vevi" width={92} height={25} priority />
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green" />
              </span>
              <span className="text-[9px] font-mono font-bold text-green tracking-wider">LIVE</span>
            </span>
            {showClose && (
              <button onClick={onClose} aria-label="Close menu"
                className="p-1 text-muted hover:text-text active:scale-95 transition-transform">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted font-sans tracking-wide mb-4">Algorithmic Edge</p>

        {/* User identity */}
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-sans transition-colors duration-150 cursor-pointer',
                active
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'text-muted hover:bg-elevated hover:text-text border border-transparent active:bg-elevated',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-sans text-muted hover:bg-elevated hover:text-red active:bg-elevated transition-colors duration-150 cursor-pointer w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );
}
