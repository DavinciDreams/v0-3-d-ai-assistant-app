import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

interface ChatHistoryProps {
  messages: Message[]
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium">Welcome to your AI Assistant</h3>
          <p className="text-muted-foreground">Start a conversation to interact with your 3D AI assistant.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={cn("flex items-start gap-4 p-4 rounded-lg", message.role === "assistant" ? "bg-muted" : "")}
        >
          <Avatar>
            {message.role === "assistant" ? (
              <AvatarImage src="/avatar-assistant.png" alt="AI" />
            ) : (
              <AvatarImage src="/avatar-user.png" alt="User" />
            )}
            <AvatarFallback>{message.role === "assistant" ? "AI" : "You"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{message.role === "assistant" ? "AI Assistant" : "You"}</h4>
              {message.timestamp && (
                <span className="text-xs text-muted-foreground">{message.timestamp.toLocaleTimeString()}</span>
              )}
            </div>
            <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
