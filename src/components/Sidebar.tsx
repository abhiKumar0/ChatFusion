import { Bell, LogOut, MessageSquare, Moon, Sun, UserRoundSearch } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetMe, useLogOut } from '@/lib/react-query/queries';
import { NotificationCount } from './NotificationCount';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setIsContactListOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ darkMode, toggleDarkMode, setIsContactListOpen }: SidebarProps) => {
  const { data: user } = useGetMe();
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: logout } = useLogOut();

  const toggleLogout = () => {
    logout();
    router.push('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/chat' || pathname?.startsWith('/chat/');
    return pathname === path || pathname?.startsWith(path);
  };

  const NavButton = ({ href, icon: Icon, label, onClick }: {
    href?: string;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
  }) => {
    const active = href ? isActive(href) : false;
    const content = (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={`relative h-11 w-11 rounded-xl transition-all duration-200 ${active
            ? 'bg-violet-500/10 text-violet-500 shadow-sm'
            : 'text-gray-500 hover:text-white hover:bg-white/5'
          }`}
      >
        <Icon className="w-5 h-5" />
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full" />
        )}
      </Button>
    );

    if (href) {
      return (
        <Link href={href} onClick={() => onClick?.()}>
          {content}
        </Link>
      );
    }
    return content;
  };

  return (
    <aside className="w-[72px] bg-[#0f0f11] border-r border-white/5 flex flex-col items-center py-5 hidden md:flex">
      <TooltipProvider delayDuration={0}>
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/chat" className="mb-8">
              <div className="h-11 w-11 bg-violet-600 rounded-xl flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-violet-500/20">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
            <p className="text-sm">ChatFusion</p>
          </TooltipContent>
        </Tooltip>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div><NavButton href="/" icon={MessageSquare} label="Messages" onClick={() => setIsContactListOpen(true)} /></div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">Messages</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div><NavButton href="/users" icon={UserRoundSearch} label="Find Users" /></div>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">Find Users</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-xl text-gray-500 hover:text-white hover:bg-white/5">
                  <Bell className="w-5 h-5" />
                  <NotificationCount />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">Notifications</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom section */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={toggleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">Logout</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl text-gray-500 hover:text-white hover:bg-white/5"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* User Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/profile" className="mt-2">
                <Avatar className="h-10 w-10 cursor-pointer border-2 border-violet-500/50 hover:border-violet-500 hover:scale-105 transition-all ring-2 ring-transparent hover:ring-violet-500/20">
                  <AvatarImage src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}&background=7c3aed&color=fff`} />
                  <AvatarFallback className="bg-violet-600 text-white text-sm font-medium">
                    {user?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1d] border-white/10">
              <p className="text-sm">{user?.fullName}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </aside>
  );
};

export default Sidebar;