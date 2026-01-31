'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LayoutDashboard, ListTodo, BarChart3, Users, Trophy, Settings, LogOut, Download } from 'lucide-react';
import { logout } from '@/actions/auth';

export default function Navbar() {
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }


  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Problems', href: '/problems', icon: ListTodo },
    { name: 'Insights', href: '/insights', icon: BarChart3 },
    { name: 'Friends', href: '/friends', icon: Users },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <div className="glass px-4 md:px-6 py-3 rounded-full flex gap-3 md:gap-6 items-center pointer-events-auto max-w-[90vw] overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              <span className="font-medium text-sm hidden md:inline">{item.name}</span>
            </Link>
          );
        })}

        <div className="w-px h-6 bg-white/10 hidden md:block" />

        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white rounded-full transition-all text-xs font-bold whitespace-nowrap"
          >
            <Download size={14} />
            <span className="hidden md:inline">Install App</span>
          </button>
        )}

        <button
          onClick={() => logout()}
          className="p-2 rounded-full hover:bg-white/10 text-muted-foreground hover:text-red-500 transition-all pointer-events-auto"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
