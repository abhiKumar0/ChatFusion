'use client';

import React from "react";
import { useGetFriendRequests, useRespondToFriendRequest } from "@/lib/react-query/queries";
import { Check, XIcon, Bell, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";

const NotificationsList = () => {
  const { data: notifications, isLoading, error } = useGetFriendRequests();
  const respondMutation = useRespondToFriendRequest();

  const handleRespond = (id: string, status: "ACCEPTED" | "REJECTED") => {
    respondMutation.mutate({ friendRequestId: id, status });
  };

  if (isLoading) {
    return (
      <div className="border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-r border-border flex flex-col h-full">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold">Notifications</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-destructive mb-2">Error loading notifications</p>
            <p className="text-sm text-muted-foreground">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-r border-border flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Notifications</h2>
          {notifications && notifications.length > 0 && (
            <span className="ml-auto px-2 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications && notifications.length > 0 ? (
          notifications.map((n: any) => (
            <Card
              key={n.id}
              className="rounded-xl border-border hover:border-primary transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={n.sender?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {n.sender?.username?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{n.sender?.username || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground mt-1">sent you a friend request</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white active:scale-95 transition-transform duration-150"
                        onClick={() => handleRespond(n.id, "ACCEPTED")}
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white active:scale-95 transition-transform duration-150"
                        onClick={() => handleRespond(n.id, "REJECTED")}
                        disabled={respondMutation.isPending}
                      >
                        <XIcon className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No notifications</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              You're all caught up! New friend requests will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsList;