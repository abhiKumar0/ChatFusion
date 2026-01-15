import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { User } from "@/types/types"
import { useCreateConversation } from "@/lib/react-query/queries"
import { useRouter } from "next/navigation"
import { usePresenceStore } from "@/store/usePresenceStore"


const FriendSection = ({ friend }: { friend: User }) => {
    const { onlineUsers } = usePresenceStore();

    const router = useRouter();
    const { mutateAsync: createConvoMutate } = useCreateConversation();

    const handleCreateConvo = async () => {
        try {
            const conversation = await createConvoMutate({
                recipientId: friend.id
            });
            // The API response structure for createConversation usually returns the conversation object 
            // directly or inside a data property. Based on api.ts: response.data.
            // If response.data IS the conversation, then conversation.id is correct.
            // If response.data has { conversation: ... }, we need to check.
            // Looking at api.ts: return response.data;
            // Let's assume response.data contains the conversation object or "conversation" field.
            // If I look at useGetConversationById => response.data.conversation.
            // Let's assume createConversation returns the conversation object directly or similar.
            // Safest is to check result structure if I can't verify now.
            // But usually standard is: return conversation.

            // Adjusting based on typical usage. API says "return response.data". 
            // If it returns { id: "...", ... } we are good.
            if (conversation && conversation.id) {
                router.push(`/chat/${conversation.id}`);
            } else if (conversation && conversation.conversation && conversation.conversation.id) {
                router.push(`/chat/${conversation.conversation.id}`);
            }
        } catch (error) {
            console.error("Failed to create/get conversation", error);
        }
    }

    const handleViewProfile = () => {
        router.push(`/${friend.username}`);
    }

    return (
        <Card key={friend.id} className="group hover:shadow-lg transition-all duration-300 border-muted-foreground/10 hover:border-primary/20">
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar className="h-14 w-14 border-2 border-background">
                            <AvatarImage src={friend.avatar} />
                            <AvatarFallback>{friend.fullName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${(onlineUsers.has(friend.id)) ? 'bg-green-500' :
                                (friend.status?.toLowerCase() === 'away') ? 'bg-yellow-500' : 'bg-gray-400'
                                }`}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                            {friend.fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                            @{friend.username}
                        </p>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <Button className="w-full gap-2 text-xs cursor-pointer" variant="secondary" size="sm" onClick={handleCreateConvo}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                    </Button>
                    <Button className="w-full gap-2 text-xs cursor-pointer" variant="outline" size="sm" onClick={handleViewProfile}>
                        View
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default FriendSection
