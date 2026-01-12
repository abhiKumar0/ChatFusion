"use-client"

import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useDeleteConversation } from "@/lib/react-query/queries"

const TopRigthChatButton = ({conversationId}: {conversationId: string}) => {
    const router = useRouter();
    const {mutateAsync: deleteConversation} = useDeleteConversation();

    const handleLeaveConversation = () => {
        router.replace('/chat');
    }

    const handleClearChat = () => {
        deleteConversation({id: conversationId, deleteFor: 'SELF'});
    }

    const handleDeleteConversation = () => {
        deleteConversation({id: conversationId, deleteFor: 'ALL'});
    }

    return (
        <div>
            <Popover>
            <PopoverTrigger asChild>
                <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-accent active:scale-95 transition-all duration-150 cursor-pointer"
                >
                <MoreVertical className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                <div className="flex flex-col space-y-1">
                    <Button className="cursor-pointer" onClick={handleLeaveConversation} variant="outline">Leave Chat</Button>
                    <Button onClick={handleClearChat} className="cursor-pointer" variant="outline">Clear Chat</Button>
                    <Button className="cursor-pointer" variant="outline">Block User</Button>
                    <Button onClick={handleDeleteConversation} className="cursor-pointer" variant="destructive">Delete Chat</Button>
                </div>
            </PopoverContent>
            </Popover>
        </div>
    )
}


export default TopRigthChatButton