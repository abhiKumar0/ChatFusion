"use client";

import { Wifi, WifiOff } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NetworkIndicator() {
  const { networkQuality, callStats } = useCallStore();

  const getColor = () => {
    switch (networkQuality) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-yellow-500';
      case 'poor':
        return 'text-orange-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSignalBars = () => {
    switch (networkQuality) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'poor':
        return 2;
      case 'disconnected':
        return 0;
      default:
        return 1;
    }
  };

  const bars = getSignalBars();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
            {networkQuality === 'disconnected' ? (
              <WifiOff className={cn("w-5 h-5", getColor())} />
            ) : (
              <div className="flex items-end gap-0.5 h-5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className={cn(
                      "w-1 transition-all",
                      bar <= bars ? getColor() : "bg-gray-600"
                    )}
                    style={{ height: `${bar * 25}%` }}
                  />
                ))}
              </div>
            )}
            <span className={cn("text-xs font-medium", getColor())}>
              {networkQuality?.charAt(0).toUpperCase() + networkQuality.slice(1)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-gray-800 border-gray-700">
          <div className="text-xs space-y-1">
            {callStats && (
              <>
                <div>Latency: {callStats.latency}ms</div>
                <div>Packet Loss: {callStats.packetLoss}</div>
                <div>Bitrate: {callStats.bitrate} kbps</div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
