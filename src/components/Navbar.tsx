'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { LayoutDashboard, ListTodo, BarChart3, Users, Trophy, Settings, LogOut } from 'lucide-react';
import { logout } from '@/actions/auth';

export default function Navbar() {
  const pathname = usePathname();

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
      <div className="glass px-6 py-3 rounded-full flex gap-6 items-center pointer-events-auto">
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
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      <button
        onClick={() => logout()}
        className="absolute right-6 top-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-red-500 transition-all pointer-events-auto"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </nav>
  );
}
