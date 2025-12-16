'use client';

import React from 'react';
import { Button } from './ui/button';
import { MessageSquare, Users, Settings, Moon, Sun, Bell } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface MobileNavProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const MobileNav = ({ darkMode, toggleDarkMode }: MobileNavProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/chat' && pathname?.startsWith('/chat')) return true;
    if (path === '/users' && pathname?.startsWith('/users')) return true;
    if (path === '/notifications' && pathname?.startsWith('/notifications')) return true;
    if (path === '/profile' && pathname?.startsWith('/profile')) return true;
    return false;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-50">
      <div className="flex justify-around items-center">
        

        <Button
          variant={isActive('/chat') ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => router.push('/chat')}
          className={isActive('/chat') ? 'text-primary' : 'text-muted-foreground'}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>

        <Button
          variant={isActive('/notifications') ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => router.push('/notifications')}
          className={isActive('/notifications') ? 'text-primary' : 'text-muted-foreground'}
        >
          <Bell className="w-5 h-5" />
        </Button>

        <Button
          variant={isActive('/users') ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => router.push('/users')}
          className={isActive('/users') ? 'text-primary' : 'text-muted-foreground'}
        >
          <Users className="w-5 h-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <Button
          variant={isActive('/profile') ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => router.push('/profile')}
          className={isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default MobileNav;
