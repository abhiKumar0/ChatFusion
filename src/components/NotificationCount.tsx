'use client';

import { createClient } from "@/lib/supabase";
import { useGetMe } from "@/lib/react-query/queries";
import { useEffect, useState } from "react";

export const NotificationCount = () => {
  const [supabase] = useState(() => createClient());
  const { data: user } = useGetMe();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!user) return;
    const res = await fetch(`/api/friend-requests/count?userId=${user.id}`);
    const data = await res.json();
    setCount(data.count);
  };

  useEffect(() => {
    fetchCount();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`notifications:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'FriendRequest', filter: `receiverId=eq.${user.id}` }, () => {
        fetchCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  return <span>{count > 0 && count}</span>;
};
