"use client"

import { useState, useCallback, useEffect } from "react"
import EasySpeech from 'easy-speech';

// Extend the Window interface for speech recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeech() {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize EasySpeech
  useEffect(() => {
    EasySpeech.init({ maxTimeout: 5000, interval: 250 })
      .then(() => console.log('EasySpeech initialized'))
      .catch(e => setError(`EasySpeech initialization error: ${e}`));
  }, []);

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

  // Start listening for speech with enhanced error handling and reconnection logic
  const startListening = useCallback(() => {
    setTranscript("")
    setError(null)

    const recognitionInstance = recognition()
    if (!recognitionInstance) return

    let reconnectionAttempts = 0;
    const maxReconnectionAttempts = 3;

    recognitionInstance.onstart = () => {
      setIsListening(true)
    }

    recognitionInstance.onresult = (event: Event) => {
      let interimTranscript = ""
      let finalTranscript = ""

      // Type assertion to access SpeechRecognitionEvent properties
      const speechEvent = event as any;

      for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
        const transcript = speechEvent.results[i][0].transcript
        if (speechEvent.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognitionInstance.onerror = (event: any) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
    }

    recognitionInstance.onend = () => {
      // Auto reconnect logic if recognition stopped unexpectedly
      if (isListening && reconnectionAttempts < maxReconnectionAttempts) {
        reconnectionAttempts++;
        try {
          recognitionInstance.start();
        } catch (err) {
          setError(`Failed to reconnect: ${err instanceof Error ? err.message : String(err)}`);
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    }

    try {
      recognitionInstance.start()
    } catch (err) {
      setError("Error starting speech recognition.")
      console.error("Speech recognition error:", err)
    }

    return recognitionInstance
  }, [recognition, isListening])

  // Stop listening for speech
  const stopListening = useCallback(() => {
    const recognitionInstance = recognition()
    if (recognitionInstance) {
      recognitionInstance.stop()
    }
    setIsListening(false)
  }, [recognition])

  // Speak text using EasySpeech
  const speak = useCallback(async (text: string, voiceId = "default") => {
    try {
      setIsSpeaking(true);
      
      const voices = EasySpeech.voices();
      let voice = voices.find(v => v.voiceURI === voiceId);
      
      if (!voice && voiceId !== "default") {
        console.warn(`Voice ${voiceId} not found, using default`);
        voice = voices[0];
      }

      await EasySpeech.speak({
        text,
        voice,
        pitch: 1,
        rate: 1,
        volume: 1,
        // You can add callbacks for events
        boundary: (event) => console.log('Boundary reached:', event),
        end: () => setIsSpeaking(false),
        error: (err) => {
          setError(`Speech synthesis error: ${err}`);
          setIsSpeaking(false);
        }
      });
      
      return Promise.resolve();
    } catch (err) {
      setError(`Speech synthesis error: ${err instanceof Error ? err.message : String(err)}`);
      setIsSpeaking(false);
      return Promise.reject(err);
    }
  }, [])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    EasySpeech.cancel();
    setIsSpeaking(false);
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      EasySpeech.cancel();
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
