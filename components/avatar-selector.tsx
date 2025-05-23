"use client"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AvatarOption {
  id: string
  name: string
  thumbnail: string
}

interface AvatarSelectorProps {
  selectedAvatar: string
  onSelectAvatar: (avatarId: string) => void
}

export default function AvatarSelector({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) {
  // Sample avatar options - in a real app, these would come from your available models
  const avatarOptions: AvatarOption[] = [
    {
      id: "peach",
      name: "Peach Avatar",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "Billy",
      name: "Billy Avatar",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "anime",
      name: "Anime Style",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
    {
      id: "realistic",
      name: "Realistic",
      thumbnail: "/placeholder.svg?height=100&width=100",
    },
  ]

  return (
    <RadioGroup value={selectedAvatar} onValueChange={onSelectAvatar} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {avatarOptions.map((avatar) => (
        <div key={avatar.id}>
          <RadioGroupItem value={avatar.id} id={`avatar-${avatar.id}`} className="sr-only" />
          <Label htmlFor={`avatar-${avatar.id}`} className="cursor-pointer">
            <Card
              className={cn(
                "overflow-hidden transition-all",
                selectedAvatar === avatar.id ? "ring-2 ring-primary" : "hover:bg-muted",
              )}
            >
              <CardContent className="p-2">
                <div className="aspect-square overflow-hidden rounded-md mb-2">
                  <img
                    src={avatar.thumbnail || "/placeholder.svg"}
                    alt={avatar.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center text-sm font-medium">{avatar.name}</div>
              </CardContent>
            </Card>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
