'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('vevi_role');
    if (!role) router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="member" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
