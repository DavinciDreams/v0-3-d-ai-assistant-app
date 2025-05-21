"use client"

import { useState, useCallback } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Send a message to the AI assistant
  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Add user message to the chat
      const userMessage: Message = {
        role: "user",
        content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])

      // TODO: Replace with actual Flowise API call
      // This is a mock response for demonstration
      const mockResponse = await new Promise<string>((resolve) => {
        setTimeout(() => {
          const responses = [
            "I understand what you're asking. Let me help you with that.",
            "That's an interesting question! Here's what I think...",
            "Based on my knowledge, I can provide the following information.",
            "I'd be happy to assist with your request.",
            "Let me analyze that for you and provide some insights.",
          ]
          resolve(responses[Math.floor(Math.random() * responses.length)])
        }, 1000)
      })

      // Add assistant response to the chat
      const assistantMessage: Message = {
        role: "assistant",
        content: mockResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      console.error("Error sending message:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  // Save the current chat
  const saveChat = useCallback(() => {
    try {
      const chatData = {
        messages,
        savedAt: new Date().toISOString(),
      }

      // Save to localStorage
      const savedChats = JSON.parse(localStorage.getItem("savedChats") || "[]")
      savedChats.push(chatData)
      localStorage.setItem("savedChats", JSON.stringify(savedChats))

      return true
    } catch (err) {
      console.error("Error saving chat:", err)
      return false
    }
  }, [messages])

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
  }
}
