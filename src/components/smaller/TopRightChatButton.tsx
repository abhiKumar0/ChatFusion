"use client"

import { MoreVertical } from "lucide-react"
import { Button } from "../ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useDeleteConversation } from "@/lib/react-query/queries"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const TopRigthChatButton = ({ conversationId }: { conversationId: string }) => {
    const router = useRouter();
    const { mutateAsync: deleteConversation } = useDeleteConversation();
    const queryClient = useQueryClient();

    const [isClearOpen, setIsClearOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const handleLeaveConversation = () => {
        router.replace('/chat');
    }

    const confirmClearChat = () => {
        deleteConversation(
            { id: conversationId, deleteFor: 'SELF' },
            {
                onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                    // Provide visual feedback or simply close
                    setIsClearOpen(false);
                    // Reload conversation as requested (refetch messages)
                },
                onError: (error) => {
                    console.error("Failed to clear chat", error);
                }
            }
        );
    }

    const confirmDeleteConversation = () => {
        deleteConversation(
            { id: conversationId, deleteFor: 'ALL' },
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    router.replace('/chat');
                },
                onError: (error) => {
                    console.error("Failed to delete chat", error);
                }
            }
        );
    }

    return (
        <>
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
                        <Button onClick={() => setIsClearOpen(true)} className="cursor-pointer" variant="outline">Clear Chat</Button>
                        <Button className="cursor-pointer" variant="outline">Block User</Button>
                        <Button onClick={() => setIsDeleteOpen(true)} className="cursor-pointer" variant="destructive">Delete Chat</Button>
                    </div>
                </PopoverContent>
            </Popover>

            <AlertDialog open={isClearOpen} onOpenChange={setIsClearOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear the conversation history for you. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmClearChat}>Yes, Clear</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the conversation for everyone. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}


export default TopRigthChatButton