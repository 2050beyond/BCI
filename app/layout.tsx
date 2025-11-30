import type { Metadata } from 'next';
import { Inter, Georgia } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const georgia = Georgia({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-georgia',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Laser Knife Blog',
  description: 'Minimal. Forgiving. Rich.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${georgia.variable}`}>
      <body className="font-sans">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}

