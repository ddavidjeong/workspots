import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'WorkHub - Find Remote Work Spots',
  description: 'Discover the best cafes and spaces for remote work in NYC and SF. Photos, wifi ratings, outlet availability, and more.',
  keywords: ['remote work', 'coworking', 'cafe', 'wifi', 'nyc', 'san francisco'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full font-sans antialiased">{children}</body>
    </html>
  );
}
