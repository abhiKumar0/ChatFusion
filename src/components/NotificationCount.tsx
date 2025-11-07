import { useSocket } from "@/lib/SocketProvider";
import { useGetMe } from "@/lib/react-query/queries";
import { useEffect, useState } from "react";

export const NotificationCount = () => {
  const socket = useSocket();
  const { data: user } = useGetMe();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const res = await fetch(`/api/friend-requests/count?userId=${user.id}`);
      const data = await res.json();
      setCount(data.count);
    };

    fetchCount();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    socket.emit("join", user.id);

    socket.on("notification", () => {
      setCount((prev) => prev + 1);
    });

    return () => {
      socket.off("notification");
    };
  }, [socket, user]);

  return <span>{count > 0 && count}</span>;
};
