"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatId, setChatId] = useState<string | null>(null)
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // Load settings on mount
  const [settings, setSettings] = useState({
    flowiseApiUrl: "",
    flowiseApiKey: "",
  })
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings({
            flowiseApiUrl: data.flowiseApiUrl || "",
            flowiseApiKey: "", // API key is not returned from backend
          })
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      }
    }
    
    if (session?.user) {
      loadSettings()
    }
  }, [session])
  
  // Load chat history if chatId is provided
  useEffect(() => {
    const loadChat = async () => {
      if (!chatId) return
      
      try {
        const res = await fetch(`/api/chats/${chatId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })))
        }
      } catch (err) {
        console.error("Failed to load chat history:", err)
      }
    }
    
    if (session?.user && chatId) {
      loadChat()
    }
  }, [chatId, session])
  
  // Send message to AI
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the chat",
        variant: "destructive",
      })
      return
    }
    
    if (!settings.flowiseApiUrl) {
      // Fallback to mock data if no Flowise API URL is configured
      try {
        setIsLoading(true)
        setError(null)
        
        // Add user message
        const userMessage: Message = {
          role: "user",
          content,
          timestamp: new Date(),
        }
        
        setMessages((prev) => [...prev, userMessage])
        
        // Mock response with a delay
        const mockResponse = await new Promise<string>((resolve) => {
          setTimeout(() => {
            const responses = [
              "I understand what you're asking. Let me help you with that.",
              "That's an interesting question! Here's what I think...",
              "Based on my knowledge, I can provide the following information.",
              "I'd be happy to assist with your request.",
              "Let me analyze that for you and provide some insights.",
              "Please set up your Flowise API in settings for full functionality.",
            ]
            resolve(responses[Math.floor(Math.random() * responses.length)])
          }, 1000)
        })
        
        // Add assistant response
        const assistantMessage: Message = {
          role: "assistant",
          content: mockResponse,
          timestamp: new Date(),
        }
        
        setMessages((prev) => [...prev, assistantMessage])
        
        toast({
          title: "Using Mock Data",
          description: "Please set up your Flowise API URL in settings for real AI responses",
        })
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Add user message
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, userMessage])

      // Create or update chat in database
      const saveMessageRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: userMessage,
        }),
      })
      
      if (!saveMessageRes.ok) {
        throw new Error("Failed to save message")
      }
      
      const saveData = await saveMessageRes.json()
      if (!chatId && saveData.chatId) {
        setChatId(saveData.chatId)
      }
      
      // Send to Flowise API
      const flowiseRes = await fetch(settings.flowiseApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.flowiseApiKey && { "Authorization": `Bearer ${settings.flowiseApiKey}` }),
        },
        body: JSON.stringify({ message: content }),
      })
      
      if (!flowiseRes.ok) {
        throw new Error("Failed to get response from AI")
      }
      
      const flowiseData = await flowiseRes.json()
      
      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: flowiseData.response || "Sorry, I couldn't process that request.",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
      
      // Save assistant message
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: saveData.chatId || chatId,
          message: assistantMessage,
        }),
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [settings, chatId, toast, session])
  
  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([])
    setChatId(null)
    setError(null)
  }, [])
  
  // Save the current chat (create a title)
  const saveChat = useCallback(async (title?: string) => {
    if (!session?.user) return false
    
    try {
      if (!chatId) return false
      
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || `Chat ${new Date().toLocaleString()}` }),
      })
      
      return true
    } catch (err) {
      console.error("Error saving chat:", err)
      return false
    }
  }, [chatId, session])

  // Download chat history as JSON
  const downloadChatHistory = useCallback(() => {
    try {
      const chatData = {
        messages,
        exportedAt: new Date().toISOString(),
      }

      const dataStr = JSON.stringify(chatData, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportName = `chat-history-${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportName)
      linkElement.click()

      return true
    } catch (err) {
      console.error("Error downloading chat history:", err)
      return false
    }
  }, [messages])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    startNewChat,
    saveChat,
    downloadChatHistory,
    chatId,
  }
}
