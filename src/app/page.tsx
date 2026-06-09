'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem('vevi_role');
    if (role === 'admin')  router.replace('/admin');
    else if (role === 'member') router.replace('/member');
    else router.replace('/login');
  }, [router]);
  return null;
}
