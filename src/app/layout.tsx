import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SwUpdater } from '@/components/SwUpdater';

export const metadata: Metadata = {
  title: 'Vevi Trading Bot',
  description: 'Multi-account SMC trading bot observatory',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vevi',
    startupImage: ['/icon-512.png'],
  },
  icons: {
    icon: '/vevi-icon.svg',
    apple: '/apple-touch-icon.png',
  },
};

// Next.js 14: split viewport + theme-color out of metadata (deprecated there)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Apple-specific PWA install support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vevi" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-bg text-text antialiased">
        {children}
        <SwUpdater />
      </body>
    </html>
  );
}
