import { Bell, Contact, LogOut, MessageSquare, Moon, Settings, Sun, UserRoundSearch, Users } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

interface SidebarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setIsContactListOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ darkMode, toggleDarkMode, setIsContactListOpen }: SidebarProps) => {
  const { data: user } = useGetMe();
  const router = useRouter();
  const { mutate: logout } = useLogOut();

  const toggleLogout = () => {
    //clear cookie
    logout();
    router.push('/auth');
  };

  return (
    <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 hidden md:flex">
      <TooltipProvider>
        <div className="flex flex-col items-center gap-6">
          {/* App Logo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>ChatFusion</p>
            </TooltipContent>
          </Tooltip>

          {/* Navigation Icons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setIsContactListOpen(true)}>
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Messages</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/users">
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <UserRoundSearch className="w-5 h-5" /> 
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Users</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Link href="/notifications"><Bell className="w-5 h-5" /> </Link>
                <NotificationCount />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="mt-auto flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleLogout}>
                <LogOut className="w-5 h-5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>


          {/* Dark Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{darkMode ? 'Light Mode' : 'Dark Mode'}</p>
            </TooltipContent>
          </Tooltip>

          {/* User Avatar */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="cursor-pointer border-2 border-primary hover:scale-110 transition-transform">
                <AvatarImage src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.fullName || 'User'}`} />
                <AvatarFallback>{user?.fullName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{user?.fullName}</p>
            </TooltipContent>
          </Tooltip>

        </div>
      </TooltipProvider>
    </aside>
  );
};

export default Sidebar;