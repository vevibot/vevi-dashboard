'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('vevi_role');
    if (role !== 'admin') router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
