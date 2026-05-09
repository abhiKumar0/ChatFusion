'use client';

import { useGetFriendRequestCount, useGetMe } from "@/lib/react-query/queries";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export const NotificationCount = () => {
  const { data: user } = useGetMe();
  const { data: countData, refetch } = useGetFriendRequestCount();

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocket(user.id);

    socket.on('friend_request:new', () => {
      refetch();
    });

    return () => {
      socket.off('friend_request:new');
    };
  }, [user?.id, refetch]);

  return <span>{countData?.count > 0 && countData?.count}</span>;
};
