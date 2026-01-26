'use client';

import { createClient } from "@/lib/supabase";
import { useGetFriendRequestCount, useGetMe } from "@/lib/react-query/queries";
import { useEffect, useState } from "react";

export const NotificationCount = () => {
  const [supabase] = useState(() => createClient());
  const { data: user } = useGetMe();

  const { data: countData, refetch } = useGetFriendRequestCount();
  

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'FriendRequest', filter: `receiverId=eq.${user.id}` }, () => {
        // refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase, refetch]);

  return <span>{countData?.count > 0 && countData?.count}</span>;
};
