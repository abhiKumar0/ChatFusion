'use client';

import React from 'react';
import { MessageSquare, Users, Moon, Sun, Bell, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useGetMe } from '@/lib/react-query/queries';

interface MobileNavProps {
  activeView?: string;
  setActiveView?: (view: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const MobileNav = ({ darkMode, toggleDarkMode }: MobileNavProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useGetMe();

  const isActive = (path: string) => {
    if (path === '/chat' && pathname?.startsWith('/chat')) return true;
    if (path === '/users' && pathname?.startsWith('/users')) return true;
    if (path === '/notifications' && pathname?.startsWith('/notifications')) return true;
    if (path === '/profile' && pathname?.startsWith('/profile')) return true;
    return false;
  };

  const NavItem = ({ path, icon: Icon, label }: { path: string; icon: React.ElementType; label: string }) => {
    const active = isActive(path);
    return (
      <button
        onClick={() => router.push(path)}
        className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${active
            ? 'text-violet-400'
            : 'text-gray-500 hover:text-gray-300'
          }`}
      >
        <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
          <Icon className="w-5 h-5" />
          {active && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
          )}
        </div>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f11]/95 backdrop-blur-xl border-t border-white/5 px-2 pb-safe z-50">
      <div className="flex justify-around items-center py-1">
        <NavItem path="/chat" icon={MessageSquare} label="Chat" />
        <NavItem path="/notifications" icon={Bell} label="Alerts" />
        <NavItem path="/users" icon={Users} label="Users" />

        <button
          onClick={toggleDarkMode}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>

        <button
          onClick={() => router.push('/profile')}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isActive('/profile') ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
            }`}
        >
          <div className={`relative ${isActive('/profile') ? 'scale-110' : ''} transition-transform`}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName || 'User'}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-[10px] text-violet-400 font-medium">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            {isActive('/profile') && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
            )}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
