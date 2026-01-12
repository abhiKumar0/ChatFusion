import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { User } from "@/types/types"
import { useCreateConversation } from "@/lib/react-query/queries"


const FriendSection = ({ friend }: { friend: User }) => {

    const {mutate: createConvoMutate} = useCreateConversation();

    const handleCreateConvo = () => {
        createConvoMutate({
            recipientId: friend.id
        })
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
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${(friend.status?.toLowerCase() === 'online') ? 'bg-green-500' :
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
                    <Button className="w-full gap-2 text-xs cursor-pointer" variant="outline" size="sm">
                        View
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default FriendSection
