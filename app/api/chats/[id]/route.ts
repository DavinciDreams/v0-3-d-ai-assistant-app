import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "../../auth/[...nextauth]/route"

const prisma = new PrismaClient()

// Get a specific chat
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: params.id,
        userId: session.user.id, // Ensure the chat belongs to the user
      },
      include: {
        messages: {
          orderBy: {
            timestamp: "asc",
          },
        },
      },
    })
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }
    
    return NextResponse.json(chat)
  } catch (error) {
    console.error("Error fetching chat:", error)
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    )
  }
}

// Update a chat (title)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const { title } = await request.json()
    
    const chat = await prisma.chat.findUnique({
      where: {
        id: params.id,
      },
    })
    
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }
    
    const updatedChat = await prisma.chat.update({
      where: {
        id: params.id,
      },
      data: {
        title,
      },
    })
    
    return NextResponse.json(updatedChat)
  } catch (error) {
    console.error("Error updating chat:", error)
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    )
  }
}

// Delete a chat
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: params.id,
      },
    })
    
    if (!chat || chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }
    
    await prisma.chat.delete({
      where: {
        id: params.id,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting chat:", error)
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    )
  }
}
