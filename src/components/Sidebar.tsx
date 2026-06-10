'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Settings, LogOut,
  TrendingUp, ListOrdered, BarChart2, Activity,
} from 'lucide-react';
import Image from 'next/image';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const adminNav: NavItem[] = [
  { href: '/admin',            label: 'Overview',  icon: <LayoutDashboard size={16} /> },
  { href: '/admin/accounts',   label: 'Accounts',  icon: <Users size={16} /> },
  { href: '/admin/activity',   label: 'Activity',  icon: <Activity size={16} /> },
  { href: '/admin/charts',     label: 'Charts',    icon: <BarChart2 size={16} /> },
  { href: '/admin/settings',   label: 'Settings',  icon: <Settings size={16} /> },
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

  const logout = () => {
    localStorage.removeItem('vevi_token');
    localStorage.removeItem('vevi_role');
    localStorage.removeItem('vevi_account_id');
    router.push('/login');
  };

  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-border flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/vevi-logo.svg" alt="Vevi" width={100} height={27} priority />
              {role === 'admin' && (
                <span className="text-[10px] bg-green/10 text-green border border-green/30 rounded px-1.5 py-0.5 font-mono ml-auto">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted/50 font-sans mt-1 tracking-wide">algorithmic edge</p>
          </div>
        </div>
      </div>

      {/* Nav */}
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
                  : 'text-muted hover:bg-elevated hover:text-text',
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
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-muted hover:bg-elevated hover:text-red transition-colors duration-150 cursor-pointer w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
