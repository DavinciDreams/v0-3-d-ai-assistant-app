import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { chatId, message } = await request.json()
  
  if (!message || !message.role || !message.content) {
    return NextResponse.json({ error: "Invalid message data" }, { status: 400 })
  }
  
  try {
    // If chatId is provided, add the message to that chat
    if (chatId) {
      // Verify the chat belongs to the user
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
      })
      
      if (!chat || chat.userId !== session.user.id) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }
      
      const savedMessage = await prisma.message.create({
        data: {
          role: message.role,
          content: message.content,
          timestamp: message.timestamp || new Date(),
          chatId,
        },
      })
      
      return NextResponse.json({
        message: savedMessage,
        chatId,
      })
    }
    
    // If no chatId, create a new chat
    const newChat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        messages: {
          create: {
            role: message.role,
            content: message.content,
            timestamp: message.timestamp || new Date(),
          },
        },
      },
      include: {
        messages: true,
      },
    })
    
    return NextResponse.json({
      message: newChat.messages[0],
      chatId: newChat.id,
    })
  } catch (error) {
    console.error("Error saving message:", error)
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    )
  }
}
