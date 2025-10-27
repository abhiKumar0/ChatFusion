"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCallStore } from '@/store/useCallStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function IncomingCall() {
  const { status, remoteUser, callType, acceptCall: answerCall, rejectCall } = useCallStore();

  console.log('IncomingCall component render - status:', status, 'remoteUser:', remoteUser);

  if (status !== 'ringing' || !remoteUser) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 50 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700"
        >
          <div className="text-center space-y-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex justify-center"
            >
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-blue-500">
                  <AvatarImage src={remoteUser.avatar} />
                  <AvatarFallback className="text-4xl">
                    {remoteUser.fullName.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 rounded-full border-4 border-blue-500 opacity-50"
                />
              </div>
            </motion.div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {remoteUser.fullName}
              </h2>
              <p className="text-gray-400 text-sm">
                {remoteUser.username}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-blue-400">
              {callType === 'video' ? (
                <>
                  <Video className="w-5 h-5" />
                  <span className="text-sm font-medium">Incoming Video Call</span>
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-medium">Incoming Audio Call</span>
                </>
              )}
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={rejectCall}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
              
              <Button
                size="lg"
                onClick={answerCall}
                className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-all animate-pulse"
              >
                <Phone className="w-6 h-6" />
              </Button>
            </div>

            <p className="text-gray-500 text-xs">
              Tap to answer or decline
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default IncomingCall;