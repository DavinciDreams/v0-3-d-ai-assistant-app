import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { encrypt } from "@/lib/encrypt"
import { authOptions } from "../auth/[...nextauth]/route"

const prisma = new PrismaClient()

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const settings = await prisma.settings.findUnique({
    where: { userId: session.user.id },
  })
  
  if (!settings) {
    return NextResponse.json({
      selectedAvatar: "default",
      selectedVoice: "default",
      flowiseApiUrl: "",
      // Do not return API key to frontend
    })
  }
  
  return NextResponse.json({
    selectedAvatar: settings.selectedAvatar,
    selectedVoice: settings.selectedVoice,
    flowiseApiUrl: settings.flowiseApiUrl,
    // Do not return API key to frontend
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const data = await request.json()
  
  // Validate data
  const { selectedAvatar, selectedVoice, flowiseApiUrl, flowiseApiKey } = data
  
  // Encrypt API key if provided
  const encryptedApiKey = flowiseApiKey ? encrypt(flowiseApiKey) : undefined
  
  const settings = await prisma.settings.upsert({
    where: { userId: session.user.id },
    update: {
      selectedAvatar,
      selectedVoice,
      flowiseApiUrl,
      ...(encryptedApiKey && { flowiseApiKey: encryptedApiKey }),
    },
    create: {
      userId: session.user.id,
      selectedAvatar,
      selectedVoice,
      flowiseApiUrl: flowiseApiUrl || "",
      flowiseApiKey: encryptedApiKey || "",
    },
  })
  
  return NextResponse.json({
    selectedAvatar: settings.selectedAvatar,
    selectedVoice: settings.selectedVoice,
    flowiseApiUrl: settings.flowiseApiUrl,
    // Do not return API key to frontend
  })
}
