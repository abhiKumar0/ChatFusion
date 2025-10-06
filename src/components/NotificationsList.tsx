import React from "react";
import { useGetFriendRequests, useRespondToFriendRequest } from "@/lib/react-query/queries";
import { Check, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

const NotificationsList = () => {
  const { data: notifications, isLoading, error } = useGetFriendRequests();
  const respondMutation = useRespondToFriendRequest();

  if (isLoading) return <div>Loading notifications...</div>;
  if (error) return <div>Error loading notifications.</div>;

  const handleRespond = (id: string, status: "ACCEPTED" | "REJECTED") => {
    respondMutation.mutate({ friendRequestId: id, status });
  };
  console.log(notifications)

  return (
    <div className=" border-r border-border hidden lg:flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Notifications</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {notifications?.map(n => (
          <div
            key={n.id}
            className="flex items-center justify-between bg-card p-3 rounded shadow hover:bg-accent transition"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-12 w-12">
                  <AvatarImage src={n.sender?.avatar} />
                  <AvatarFallback>{n.sender.username[0] || "A"}</AvatarFallback>
              </Avatar>
              <div className="ml-4">
                <p className="font-medium">{n.sender?.username}</p>
                <p className="text-sm text-muted-foreground">sent you a friend request</p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white"
                title="Accept"
                onClick={() => handleRespond(n.id, "ACCEPTED")}
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
                title="Reject"
                onClick={() => handleRespond(n.id, "REJECTED")}
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsList;