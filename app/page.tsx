"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Canvas } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, Mic, MicOff, Send, Plus, Save, Volume2, VolumeX, User, LogOut } from "lucide-react"
import VRMAvatar from "@/components/vrm-avatar"
import ChatHistory from "@/components/chat-history"
import ContentDisplay from "@/components/content-display"
import AvatarSelector from "@/components/avatar-selector"
import VoiceSelector from "@/components/voice-selector"
import { useChat } from "@/hooks/use-chat"
import { useSpeech } from "@/hooks/use-speech"
import { signOut } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("chat")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [userInput, setUserInput] = useState("")
  // Call all hooks at the top level, before any conditional returns
  const { messages, sendMessage, startNewChat, saveChat, downloadChatHistory } = useChat()
  const { speak, stopSpeaking, startListening, stopListening, transcript } = useSpeech()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedAvatar, setSelectedAvatar] = useState("peach")
  const [selectedVoice, setSelectedVoice] = useState("default")
  const [settings, setSettings] = useState({
    flowiseApiUrl: process.env.NEXT_PUBLIC_FLOWISE_API_URL || "",
    flowiseApiKey: process.env.NEXT_PUBLIC_FLOWISE_API_KEY || "",
  })
  
  // All useEffect hooks must be at the top level, before any conditional returns
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  
  // Handle speech recognition results
  useEffect(() => {
    if (transcript) {
      setUserInput(transcript)
    }
  }, [transcript])

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings((prevSettings) => ({
            ...prevSettings,
            flowiseApiUrl: data.flowiseApiUrl || prevSettings.flowiseApiUrl,
          }))
          
          // Update avatar and voice selection
          if (data.selectedAvatar) setSelectedAvatar(data.selectedAvatar)
          if (data.selectedVoice) setSelectedVoice(data.selectedVoice)
        }
      } catch (err) {
        console.error("Failed to load settings:", err)
      }
    }
    
    if (session?.user) {
      loadSettings()
    }
  }, [session])
  
  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h3 className="text-lg font-medium">Loading...</h3>
        </div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    await sendMessage(userInput)
    setUserInput("")

    // Get the latest assistant message to speak
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant") {
      setIsSpeaking(true)
      await speak(lastMessage.content, selectedVoice)
      setIsSpeaking(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
      setIsListening(false)
    } else {
      startListening()
      setIsListening(true)
    }
  }

  const toggleSpeaking = () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
    }
  }
  
  // Save user settings
  const saveSettings = async () => {
    try {
      // Save avatar and voice preferences
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedAvatar,
          selectedVoice,
          flowiseApiUrl: settings.flowiseApiUrl,
          flowiseApiKey: settings.flowiseApiKey,
        }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to save settings")
      }
      
      // Show success notification
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      })
    } catch (err) {
      console.error("Error saving settings:", err)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {/* 3D Avatar Section */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-full relative">
        <Canvas camera={{ position: [0, 1.5, 2], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <VRMAvatar
            modelPath={`/models/${selectedAvatar}.vrm`}
            isSpeaking={isSpeaking}
            expression={messages.length > 0 ? messages[messages.length - 1].content : ""}
          />
          <Environment preset="apartment" />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2}
            minDistance={1}
            maxDistance={4}
          />
        </Canvas>

        {/* Avatar Controls */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleListening}
            className={isListening ? "bg-red-500 text-white" : ""}
          >
            {isListening ? <MicOff /> : <Mic />}
          </Button>

          <Button variant="outline" size="icon" onClick={toggleSpeaking} disabled={!isSpeaking}>
            {isSpeaking ? <VolumeX /> : <Volume2 />}
          </Button>
        </div>
      </div>

      {/* Chat and Content Section */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col bg-white dark:bg-gray-800">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="flex items-center mr-4">
                <User className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{session?.user?.name || session?.user?.email}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-1 h-6 w-6" 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sign out"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={startNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
              <Button variant="outline" size="sm" onClick={saveChat}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={downloadChatHistory}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-120px)]">
            <div className="flex-1 overflow-y-auto p-4">
              <ChatHistory messages={messages} />
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="h-[calc(50vh-120px)] md:h-[calc(100vh-120px)] p-4 overflow-y-auto">
            <ContentDisplay messages={messages} />
          </TabsContent>

          <TabsContent value="settings" className="h-[calc(50vh-120px)] md:h-[calc(100vh-120px)] p-4 overflow-y-auto">
            <div className="grid gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Avatar Selection</h3>
                <AvatarSelector selectedAvatar={selectedAvatar} onSelectAvatar={setSelectedAvatar} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Voice Selection</h3>
                <VoiceSelector selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Flowise Connection</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Flowise API URL</label>
                      <input
                        type="text"
                        placeholder="https://your-flowise-instance.com/api/v1"
                        className="w-full p-2 border rounded-md mt-1"
                        value={settings?.flowiseApiUrl || ""}
                        onChange={(e) => setSettings({ ...settings, flowiseApiUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">API Key (if required)</label>
                      <input 
                        type="password" 
                        placeholder="Your API key" 
                        className="w-full p-2 border rounded-md mt-1"
                        value={settings?.flowiseApiKey || ""}
                        onChange={(e) => setSettings({ ...settings, flowiseApiKey: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button onClick={saveSettings}>Save Flowise Settings</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
