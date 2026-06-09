import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vevi Trading Bot',
  description: 'Multi-account SMC trading bot observatory',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
