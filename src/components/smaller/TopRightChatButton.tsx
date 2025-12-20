"use-client"

import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const TopRigthChatButton = () => {
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
                    <Button variant="outline">Leave Conversation</Button>
                    <Button variant="outline">Report User</Button>
                    <Button variant="outline">Block User</Button>
                    <Button variant="destructive">Clear Conversation</Button>
                </div>
            </PopoverContent>
            </Popover>
        </div>
    )
}


export default TopRigthChatButton