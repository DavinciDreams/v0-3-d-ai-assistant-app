"use client"

import { useEffect, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { VRM } from "@pixiv/three-vrm"
import { Box, Sphere, Text } from "@react-three/drei"

// Define the BlendShapePresetName enum since it's no longer exported directly
enum BlendShapePresetName {
  A = "a",
  Angry = "angry",
  Blink = "blink",
  BlinkL = "blink_l",
  BlinkR = "blink_r",
  E = "e",
  Fun = "fun",
  I = "i",
  Joy = "joy",
  Lookdown = "lookdown",
  Lookleft = "lookleft",
  Lookright = "lookright",
  Lookup = "lookup",
  Neutral = "neutral",
  O = "o",
  Sorrow = "sorrow",
  U = "u",
}

interface VRMAvatarProps {
  modelPath: string
  isSpeaking: boolean
  expression: string
}

export default function VRMAvatar({ modelPath, isSpeaking, expression }: VRMAvatarProps) {
  const { scene } = useThree()
  const [vrm, setVrm] = useState<VRM | null>(null)
  const [blendShapeWeights, setBlendShapeWeights] = useState<Record<string, number>>({})
  const [loadError, setLoadError] = useState<boolean>(false)
  const clock = useRef(new THREE.Clock())

  // Animation properties for the fallback avatar
  const [headBobPosition, setHeadBobPosition] = useState(0)
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0)
  const [blinkState, setBlinkState] = useState(0)

  // Load the VRM model
  useEffect(() => {
    // Reset error state when trying to load a new model
    setLoadError(false)

    // Only attempt to load if we have a valid model path
    if (
      modelPath === "/models/peach.vrm" ||
      modelPath === "/models/Billy.vrm" ||
      modelPath === "/models/default.vrm" ||
      modelPath === "/models/anime.vrm" ||
      modelPath === "/models/realistic.vrm" ||
      modelPath === "/models/stylized.vrm"
    ) {
      const loader = new GLTFLoader()

      loader.load(
        modelPath,
        (gltf) => {
          VRM.from(gltf)
            .then((vrm) => {
              // Clean up previous VRM model if it exists
              if (vrm) {
                scene.add(vrm.scene)
                vrm.scene.position.set(0, 0, 0)
                vrm.scene.rotation.set(0, Math.PI, 0) // Face the camera
                vrm.scene.scale.set(1, 1, 1)

                // Initialize blend shape weights
                const initialWeights: Record<string, number> = {}
                if (vrm.blendShapeProxy) {
                  Object.values(BlendShapePresetName).forEach((presetName) => {
                    initialWeights[presetName] = 0.0
                  })
                }

                setBlendShapeWeights(initialWeights)
                setVrm(vrm)
              }
            })
            .catch((error) => {
              console.error("Error processing VRM:", error)
              setLoadError(true)
            })
        },
        (progress) => console.log("Loading model...", (progress.loaded / progress.total) * 100, "%"),
        (error) => {
          console.error("Error loading model:", error)
          setLoadError(true)
        },
      )
    } else {
      // If we don't have a valid model path, set the error state
      setLoadError(true)
    }

    return () => {
      if (vrm) {
        scene.remove(vrm.scene)
        vrm.dispose()
      }
    }
  }, [modelPath, scene])

  // Handle facial expressions based on speaking state and message content
  useEffect(() => {
    if (!vrm || !vrm.blendShapeProxy) return

    const newWeights = { ...blendShapeWeights }

    // Reset all expressions
    Object.keys(newWeights).forEach((key) => {
      newWeights[key] = 0.0
    })

    // Set expressions based on speaking state and message content
    if (isSpeaking) {
      // Basic talking expression
      newWeights[BlendShapePresetName.A] = Math.random() * 0.5 + 0.2

      // Analyze expression from the message content
      if (expression) {
        if (expression.includes("?")) {
          newWeights[BlendShapePresetName.Angry] = 0.3
        } else if (expression.includes("!")) {
          newWeights[BlendShapePresetName.Angry] = 0.2
        } else if (/happy|glad|joy|smile/i.test(expression)) {
          newWeights[BlendShapePresetName.Joy] = 0.5
        } else if (/sad|sorry|unfortunate/i.test(expression)) {
          newWeights[BlendShapePresetName.Sorrow] = 0.5
        }
      }
    } else {
      // Idle expression - occasional blinking
      if (Math.random() < 0.01) {
        newWeights[BlendShapePresetName.Blink] = 1.0
      }

      // Subtle mouth movements
      if (Math.random() < 0.05) {
        newWeights[BlendShapePresetName.A] = Math.random() * 0.1
      }
    }

    setBlendShapeWeights(newWeights)
  }, [vrm, isSpeaking, expression, blendShapeWeights])

  // Apply blend shape weights in animation frame or animate fallback avatar
  useFrame((state) => {
    // If we have a VRM model, update its blend shapes
    if (vrm && vrm.blendShapeProxy) {
      const deltaTime = clock.current.getDelta()

      // Apply all blend shape weights
      Object.entries(blendShapeWeights).forEach(([presetName, weight]) => {
        vrm.blendShapeProxy?.setValue(presetName as BlendShapePresetName, weight)
      })

      // Update VRM
      vrm.update(deltaTime)
    }
    // If we're showing the fallback avatar, animate it
    else if (loadError) {
      // Simple head bobbing animation
      const t = state.clock.getElapsedTime()
      setHeadBobPosition(Math.sin(t * 0.5) * 0.05)

      // Mouth animation when speaking
      if (isSpeaking) {
        setMouthOpenAmount(Math.abs(Math.sin(t * 10) * 0.2) + 0.1)
      } else {
        setMouthOpenAmount(0)
      }

      // Blinking animation
      if (Math.random() < 0.005) {
        setBlinkState(1)
      } else if (blinkState > 0) {
        setBlinkState(Math.max(0, blinkState - 0.1))
      }
    }
  })

  // If there was an error loading the VRM model, show a fallback avatar
  if (loadError) {
    return (
      <group position={[0, 0, 0]}>
        {/* Head */}
        <Sphere position={[0, 1.6 + headBobPosition, 0]} args={[0.5, 32, 32]}>
          <meshStandardMaterial color="#f5d0c5" />
        </Sphere>

        {/* Eyes */}
        <Sphere position={[-0.2, 1.7 + headBobPosition, 0.4]} args={[0.08, 16, 16]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>
        <Sphere position={[0.2, 1.7 + headBobPosition, 0.4]} args={[0.08, 16, 16]}>
          <meshStandardMaterial color="#ffffff" />
        </Sphere>

        {/* Pupils - scale down when blinking */}
        <Sphere position={[-0.2, 1.7 + headBobPosition, 0.48]} args={[0.04, 16, 16]} scale={[1, 1 - blinkState, 1]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>
        <Sphere position={[0.2, 1.7 + headBobPosition, 0.48]} args={[0.04, 16, 16]} scale={[1, 1 - blinkState, 1]}>
          <meshStandardMaterial color="#000000" />
        </Sphere>

        {/* Mouth - scales based on speaking */}
        <Box position={[0, 1.4 + headBobPosition, 0.4]} args={[0.3, mouthOpenAmount + 0.02, 0.1]}>
          <meshStandardMaterial color="#c53030" />
        </Box>

        {/* Body */}
        <Box position={[0, 0.8, 0]} args={[0.7, 1, 0.3]}>
          <meshStandardMaterial color="#3182ce" />
        </Box>

        {/* Information text */}
        <Text
          position={[0, 2.3 + headBobPosition, 0]}
          fontSize={0.15}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          AI Assistant
        </Text>

        <Text position={[0, -0.2, 0]} fontSize={0.1} color="#000000" anchorX="center" anchorY="middle" maxWidth={2}>
          VRM model not found. Using fallback avatar.
        </Text>
      </group>
    )
  }

  // If the VRM model is loaded correctly, we don't need to render anything here
  // as the model is added directly to the scene
  return null
}
