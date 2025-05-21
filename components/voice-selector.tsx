"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceOption {
  id: string
  name: string
  lang: string
}

interface VoiceSelectorProps {
  selectedVoice: string
  onSelectVoice: (voiceId: string) => void
}

export default function VoiceSelector({ selectedVoice, onSelectVoice }: VoiceSelectorProps) {
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load available voices from the browser
  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis
      const voices = synth.getVoices()

      if (voices.length > 0) {
        const voiceOptions: VoiceOption[] = voices.map((voice) => ({
          id: voice.voiceURI,
          name: voice.name,
          lang: voice.lang,
        }))

        // Add a default option
        voiceOptions.unshift({
          id: "default",
          name: "Default Voice",
          lang: "en-US",
        })

        setAvailableVoices(voiceOptions)
        setIsLoading(false)
      }
    }

    // Load voices immediately if available
    loadVoices()

    // Set up event listener for when voices are loaded
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Preview the selected voice
  const previewVoice = (voiceId: string) => {
    const synth = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance("This is a preview of the selected voice.")

    if (voiceId !== "default") {
      const voices = synth.getVoices()
      const selectedVoiceObj = voices.find((v) => v.voiceURI === voiceId)
      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj
      }
    }

    synth.speak(utterance)
  }

  if (isLoading) {
    return <div>Loading available voices...</div>
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedVoice} onValueChange={onSelectVoice} className="grid gap-4">
        {availableVoices.map((voice) => (
          <div key={voice.id} className="flex items-center">
            <RadioGroupItem value={voice.id} id={`voice-${voice.id}`} className="sr-only" />
            <Label htmlFor={`voice-${voice.id}`} className="flex-1 cursor-pointer">
              <Card
                className={cn("transition-all", selectedVoice === voice.id ? "ring-2 ring-primary" : "hover:bg-muted")}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-sm text-muted-foreground">{voice.lang}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault()
                      previewVoice(voice.id)
                    }}
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
