import React from 'react';
import { Message } from '@/types/types';

interface MessageBubbleProps {
  message: Message & { isOwn: boolean };
}

const MessageBubble = React.memo(({ message }: MessageBubbleProps) => {
  return (
    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${message.isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary'} rounded-2xl p-3 px-4`}>
        <p>{message.content}</p>
        <span className="text-xs opacity-70 block text-right mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
