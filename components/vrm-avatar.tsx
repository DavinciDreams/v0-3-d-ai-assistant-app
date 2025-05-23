"use client"

import { useEffect, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { VRM, VRMLoaderPlugin } from "@pixiv/three-vrm"
import { Box, Sphere, Text } from "@react-three/drei"

interface VRMAvatarProps {
  modelPath: string
  isSpeaking: boolean
  expression: string
}

export default function VRMAvatar({ modelPath, isSpeaking, expression }: VRMAvatarProps) {
  const { scene } = useThree()
  const [vrm, setVrm] = useState<VRM | null>(null)
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
    console.log("🔄 VRM Loading: Attempting to load VRM model from:", modelPath)

    // Clean up previous VRM model if it exists
    if (vrm) {
      console.log("🧹 VRM Loading: Cleaning up previous VRM model")
      scene.remove(vrm.scene)
      setVrm(null)
    }

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
      
      // Install VRM loader plugin
      loader.register((parser: any) => {
        return new VRMLoaderPlugin(parser)
      })
      
      console.log("Valid model path detected, starting load...")

      loader.load(
        modelPath,
        (gltf: any) => {
          console.log("GLTF loaded successfully:", gltf)
          try {
            const vrmModel = gltf.userData.vrm
            if (vrmModel) {
              console.log("VRM processed successfully:", vrmModel)
              
              // Add to scene
              scene.add(vrmModel.scene)
              vrmModel.scene.position.set(0, 0, 0)
              vrmModel.scene.rotation.set(0, 0, 0) // Don't rotate - let's see the front
              vrmModel.scene.scale.set(1, 1, 1)

              setVrm(vrmModel)
              console.log("VRM avatar loaded and set up successfully")
            } else {
              console.error("No VRM data found in GLTF")
              setLoadError(true)
            }
          } catch (syncError) {
            console.error("Synchronous error in VRM processing:", syncError)
            setLoadError(true)
          }
        },
        (progress: any) => {
          const percent = (progress.loaded / progress.total) * 100
          console.log("Loading model...", Math.round(percent), "%")
        },
        (error: any) => {
          console.error("Error loading model:", error)
          console.error("Model path that failed:", modelPath)
          setLoadError(true)
        },
      )
    } else {
      // If we don't have a valid model path, set the error state
      console.error("Invalid model path:", modelPath)
      setLoadError(true)
    }

    return () => {
      // Cleanup is handled above in the effect
    }
  }, [modelPath, scene])

  // Apply animations in animation frame or animate fallback avatar
  useFrame((state) => {
    // If we have a VRM model, update it
    if (vrm) {
      const deltaTime = clock.current.getDelta()

      // Simple expression animations based on speaking state
      if (vrm.expressionManager && isSpeaking) {
        try {
          // Basic talking expression - mouth opening
          const talkingAmount = Math.sin(state.clock.getElapsedTime() * 10) * 0.3 + 0.3
          vrm.expressionManager.setValue('aa', Math.max(0, talkingAmount))
          
          // Occasional blinking
          if (Math.random() < 0.01) {
            vrm.expressionManager.setValue('blink', 1.0)
            setTimeout(() => {
              if (vrm && vrm.expressionManager) {
                vrm.expressionManager.setValue('blink', 0.0)
              }
            }, 150)
          }
        } catch (e) {
          // Ignore expression errors
          console.warn("Expression error:", e)
        }
      } else if (vrm.expressionManager) {
        // Reset expressions when not speaking
        try {
          vrm.expressionManager.setValue('aa', 0)
          // Occasional blinking when not speaking
          if (Math.random() < 0.005) {
            vrm.expressionManager.setValue('blink', 1.0)
            setTimeout(() => {
              if (vrm && vrm.expressionManager) {
                vrm.expressionManager.setValue('blink', 0.0)
              }
            }, 150)
          }
        } catch (e) {
          // Ignore expression errors
          console.warn("Expression error:", e)
        }
      }

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
