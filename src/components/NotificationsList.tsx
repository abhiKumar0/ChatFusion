'use client';

import React from "react";
import { useAcceptFriendRequest, useGetFriendRequests, useRemoveFriendRequest } from "@/lib/react-query/queries";
import { Check, X, Bell, Loader2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NotificationsList = () => {
  const { data: notifications, isLoading, error } = useGetFriendRequests();

  const {mutate: removeMutation, isPending: isRemovePending} = useRemoveFriendRequest();
  const {mutate: acceptMutation, isPending: isAcceptPending} = useAcceptFriendRequest();

  const handleAccept = (id: string) => {
    acceptMutation(id);
  };
  const handleRemove = (id: string) => {
    removeMutation(id);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#0f0f11]">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-[#0f0f11]">
        <div className="p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-red-400 mb-2">Error loading notifications</p>
            <p className="text-sm text-gray-500">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f0f11]">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          {notifications && notifications.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-xs text-violet-400">
              {notifications.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {notifications && notifications.length > 0 ? (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className="mx-2 my-1 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11 border border-white/10">
                  <AvatarImage src={n.sender?.avatar} />
                  <AvatarFallback className="bg-violet-500/20 text-violet-400 font-medium text-sm">
                    {n.sender?.username?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs text-violet-400 font-medium">Friend Request</span>
                  </div>
                  <p className="font-medium text-sm text-white truncate">{n.sender?.username || "Unknown User"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.sender?.fullName || "wants to connect"}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      className="flex-1 h-8 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      onClick={() => handleAccept(n.id)}
                      disabled={isAcceptPending}
                    >
                      {isAcceptPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Accept
                    </button>
                    <button
                      className="flex-1 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      onClick={() => handleRemove(n.id)}
                      disabled={isRemovePending}
                    >
                      <X className="w-3 h-3" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="font-medium text-white mb-1">No notifications</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              You're all caught up! Friend requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;