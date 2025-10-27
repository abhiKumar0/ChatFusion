"use client";

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { Button } from '@/components/ui/button';

export function CallStats() {
  const { callStats, networkQuality } = useCallStore();

  if (!callStats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-20 left-4 bg-black/80 backdrop-blur-xl rounded-lg p-4 text-white text-sm space-y-2 min-w-[250px]"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Call Statistics</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Network Quality:</span>
          <span className="font-medium capitalize">{networkQuality}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Latency:</span>
          <span className="font-medium">{callStats.latency} ms</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Packet Loss:</span>
          <span className="font-medium">{callStats.packetLoss}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Bitrate:</span>
          <span className="font-medium">{callStats.bitrate} kbps</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Resolution:</span>
          <span className="font-medium">{callStats.resolution}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Codec:</span>
          <span className="font-medium">{callStats.codec}</span>
        </div>
      </div>
    </motion.div>
  );
}
