import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("h-full", inter.variable, "font-sans", geist.variable)}>
      <body className="h-full font-sans antialiased">{children}</body>
    </html>
  );
}
