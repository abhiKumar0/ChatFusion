'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react'
import { Button } from './ui/button'
import { Phone, Video } from 'lucide-react'
import { Card } from './ui/card'

const RightSidebar = () => {
  return (
    <div className="w-72 border-l border-border hidden xl:flex flex-col">
          <div className="p-6 flex flex-col items-center text-center border-b border-border">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src="https://i.pravatar.cc/150?img=1" />
              <AvatarFallback>AJ</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold mb-1">Alex Johnson</h3>
            <p className="text-sm text-muted-foreground mb-3">Product Designer</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <Phone className="w-4 h-4 mr-1" /> Call
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                <Video className="w-4 h-4 mr-1" /> Video
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <h4 className="text-sm font-medium mb-3">Shared Files</h4>
            <div className="space-y-3">
              <Card className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Project_Brief.pdf</p>
                  <p className="text-xs text-muted-foreground">2.4 MB</p>
                </div>
              </Card>
              <Card className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Design_Mockup.png</p>
                  <p className="text-xs text-muted-foreground">4.8 MB</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
  )
}

export default RightSidebar