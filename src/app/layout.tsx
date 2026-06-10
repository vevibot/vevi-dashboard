import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vevi Trading Bot',
  description: 'Multi-account SMC trading bot observatory',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vevi',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#020617" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
