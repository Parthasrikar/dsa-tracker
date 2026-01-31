import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { ToastProvider } from '@/components/ToastProvider';

import RegisterSW from '@/components/RegisterSW';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DSA Tracker',
  description: '16-week DSA mastery journey',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <RegisterSW />
        <ToastProvider>
          <div className="min-h-screen bg-background text-foreground bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-background to-background overflow-x-hidden">
            <Navbar />
            <main className="pt-24 px-4 pb-12 max-w-6xl mx-auto">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
