'use client';

import React from "react";
// import { useGetFriends } from "@/lib/react-query/queries"; // You may need to implement this query


const FriendList = () => {
    const friends: any[] = [];
//   const { data: friends, isLoading, error } = useGetFriends();

//   if (isLoading) return <div>Loading friends...</div>;
//   if (error) return <div>Error loading friends.</div>;

  return (
    <div className="w-80 border-r border-border hidden lg:flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-semibold">Friends</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {friends && friends?.map(friend => (
          <div key={friend.id} className="p-2 hover:bg-accent rounded">
            <span>{friend.fullName || friend.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendList;