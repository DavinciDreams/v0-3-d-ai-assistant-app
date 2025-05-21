"use client"

import { useState, useCallback, useEffect } from "react"

export function useSpeech() {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize speech recognition
  const recognition = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setError("Speech recognition is not supported in this browser.")
      return null
    }

    // Use the appropriate constructor
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognitionInstance = new SpeechRecognition()

    recognitionInstance.continuous = true
    recognitionInstance.interimResults = true
    recognitionInstance.lang = "en-US"

    return recognitionInstance
  }, [])

  // Start listening for speech
  const startListening = useCallback(() => {
    setTranscript("")
    setError(null)

    const recognitionInstance = recognition()
    if (!recognitionInstance) return

    recognitionInstance.onstart = () => {
      setIsListening(true)
    }

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionInstance.onend = () => {
      setIsListening(false)
    }

    try {
      recognitionInstance.start()
    } catch (err) {
      setError("Error starting speech recognition.")
      console.error("Speech recognition error:", err)
    }

    return recognitionInstance
  }, [recognition])

  // Stop listening for speech
  const stopListening = useCallback(() => {
    const recognitionInstance = recognition()
    if (recognitionInstance) {
      recognitionInstance.stop()
    }
    setIsListening(false)
  }, [recognition])

  // Speak text using speech synthesis
  const speak = useCallback(async (text: string, voiceId = "default") => {
    if (!("speechSynthesis" in window)) {
      setError("Speech synthesis is not supported in this browser.")
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Set the voice if specified
    if (voiceId !== "default") {
      const voices = window.speechSynthesis.getVoices()
      const selectedVoice = voices.find((voice) => voice.voiceURI === voiceId)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    // Set up event handlers
    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
    }

    utterance.onerror = (event) => {
      setError(`Speech synthesis error: ${event.error}`)
      setIsSpeaking(false)
    }

    // Speak the text
    window.speechSynthesis.speak(utterance)

    // Return a promise that resolves when speech is complete
    return new Promise<void>((resolve, reject) => {
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }

      utterance.onerror = (event) => {
        setError(`Speech synthesis error: ${event.error}`)
        setIsSpeaking(false)
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }
    })
  }, [])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    transcript,
    isListening,
    isSpeaking,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
