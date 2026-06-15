'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(email, password);
      localStorage.setItem('vevi_token',      data.access_token);
      localStorage.setItem('vevi_role',       data.role);
      localStorage.setItem('vevi_email',      email);
      localStorage.setItem('vevi_account_id', data.account_id || '');
      router.replace(data.role === 'admin' ? '/admin' : '/member');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Image src="/vevi-logo.svg" alt="Vevi" width={130} height={34} priority />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-text font-sans font-semibold text-xl mb-1">Sign in</h1>
          <p className="text-muted text-sm font-sans mb-6">Access your trading dashboard</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-muted text-xs font-sans mb-1.5">Email</label>
              <input
                type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-text font-sans text-sm
                           placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20
                           transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-muted text-xs font-sans mb-1.5">Password</label>
              <input
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-elevated border border-border rounded-lg px-3 py-2.5 text-text font-sans text-sm
                           placeholder:text-muted/40 focus:outline-none focus:border-green/50 focus:ring-1 focus:ring-green/20
                           transition-colors duration-150"
              />
            </div>

            {error && (
              <p className="text-red text-sm font-sans bg-red/5 border border-red/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-green text-bg font-sans font-semibold py-2.5 rounded-lg
                         hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-150 cursor-pointer mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-muted text-xs font-sans mt-6">
          Vevi Trading Bot &mdash; Observatory
        </p>
      </div>
    </div>
  );
}
