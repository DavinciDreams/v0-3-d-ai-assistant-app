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

  // Animation states for VRM avatars
  const animationState = useRef({
    breathingTime: 0,
    blinkTime: 0,
    lastBlinkTime: 0,
    nextBlinkTime: Math.random() * 3 + 2, // Random between 2-5 seconds
    lookDirection: new THREE.Vector3(0, 0, 1),
    lookChangeTime: 0,
    nextLookChangeTime: Math.random() * 5 + 3, // Random between 3-8 seconds
    idleMovementTime: 0,
    speakingTime: 0
  })

  // Animation properties for the fallback avatar
  const [headBobPosition, setHeadBobPosition] = useState(0)
  const [mouthOpenAmount, setMouthOpenAmount] = useState(0)
  const [blinkState, setBlinkState] = useState(0)

  // Animation state for VRM avatars
  const [idleAnimationTime, setIdleAnimationTime] = useState(0)
  const [blinkTimer, setBlinkTimer] = useState(0)
  const [nextBlinkTime, setNextBlinkTime] = useState(Math.random() * 3 + 2) // Random blink interval
  const [lookDirection, setLookDirection] = useState({ x: 0, y: 0 })
  const [lookTimer, setLookTimer] = useState(0)

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
              vrmModel.scene.position.set(0, -0.8, 0); // Lowered from -0.5 to -0.8
              vrmModel.scene.rotation.set(0, Math.PI, 0); // Rotate 180 degrees to face forward
              vrmModel.scene.scale.set(1, 1, 1)

              setVrm(vrmModel)
              console.log("VRM avatar loaded and set up successfully")

              // Adjust arm bones to a relaxed position after loading
              if (vrmModel.humanoid) {
                const leftUpperArm = vrmModel.humanoid.getNormalizedBoneNode('leftUpperArm');
                const rightUpperArm = vrmModel.humanoid.getNormalizedBoneNode('rightUpperArm');
                const leftLowerArm = vrmModel.humanoid.getNormalizedBoneNode('leftLowerArm');
                const rightLowerArm = vrmModel.humanoid.getNormalizedBoneNode('rightLowerArm');

                if (leftUpperArm && rightUpperArm) {
                  leftUpperArm.rotation.x = -0.4; // Slight downward rotation
                  rightUpperArm.rotation.x = -0.4;
                }

                if (leftLowerArm && rightLowerArm) {
                  leftLowerArm.rotation.x = 0.2; // Slight inward bend
                  rightLowerArm.rotation.x = 0.2;
                }
              }
            } else {
              console.error("No VRM data found in GLTF")
              setLoadError(true)
            }
          } catch (syncError) {
            console.error("Error in VRM processing:", syncError)
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
    const deltaTime = clock.current.getDelta()
    const elapsedTime = state.clock.getElapsedTime()

    // If we have a VRM model, update it
    if (vrm) {
      // Update animation timers
      setIdleAnimationTime(elapsedTime)
      setBlinkTimer(prev => prev + deltaTime)
      setLookTimer(prev => prev + deltaTime)

      // === BREATHING ANIMATION ===
      // Subtle chest/body breathing movement
      if (vrm.scene) {
        const breathingIntensity = 0.005
        const breathingSpeed = 1.2
        const breathingOffset = Math.sin(elapsedTime * breathingSpeed) * breathingIntensity
        vrm.scene.scale.setY(1 + breathingOffset)
      }

      // === HEAD MOVEMENT ANIMATION ===
      // Subtle head nodding and swaying
      if (vrm.humanoid && vrm.humanoid.getNormalizedBoneNode('head')) {
        const headBone = vrm.humanoid.getNormalizedBoneNode('head')
        if (headBone) {
          // Gentle head sway
          const headSwayX = Math.sin(elapsedTime * 0.3) * 0.02
          const headSwayY = Math.sin(elapsedTime * 0.5) * 0.015
          const headSwayZ = Math.cos(elapsedTime * 0.4) * 0.01
          
          headBone.rotation.x = headSwayX
          headBone.rotation.y = headSwayY
          headBone.rotation.z = headSwayZ
        }
      }

      // === EYE LOOK DIRECTION ===
      // Change look direction occasionally
      if (lookTimer > 3 + Math.random() * 4) {
        setLookDirection({
          x: (Math.random() - 0.5) * 0.3,
          y: (Math.random() - 0.5) * 0.2
        })
        setLookTimer(0)
      }

      // Apply smooth eye movement
      if (vrm.lookAt && vrm.lookAt.target) {
        const targetX = lookDirection.x
        const targetY = lookDirection.y
        vrm.lookAt.target.position.x = THREE.MathUtils.lerp(vrm.lookAt.target.position.x, targetX, deltaTime * 2)
        vrm.lookAt.target.position.y = THREE.MathUtils.lerp(vrm.lookAt.target.position.y, targetY, deltaTime * 2)
        vrm.lookAt.target.position.z = 1
      }

      // === BLINKING ANIMATION ===
      if (blinkTimer >= nextBlinkTime) {
        if (vrm.expressionManager) {
          // Start blink
          vrm.expressionManager.setValue('blink', 1.0)
          setTimeout(() => {
            if (vrm && vrm.expressionManager) {
              vrm.expressionManager.setValue('blink', 0.0)
            }
          }, 120 + Math.random() * 80) // Blink duration 120-200ms
        }
        // Set next blink time (2-6 seconds)
        setNextBlinkTime(2 + Math.random() * 4)
        setBlinkTimer(0)
      }

      // === SPEAKING ANIMATIONS ===
      if (vrm.expressionManager && isSpeaking) {
        try {
          // Enhanced talking expression with multiple visemes
          const talkingBase = Math.sin(elapsedTime * 8) * 0.4 + 0.4
          const talkingVariation = Math.sin(elapsedTime * 12) * 0.2
          const finalTalkingAmount = Math.max(0, talkingBase + talkingVariation)
          
          // Alternate between different mouth shapes for more natural speech
          const visemeIndex = Math.floor(elapsedTime * 4) % 4
          switch (visemeIndex) {
            case 0:
              vrm.expressionManager.setValue('aa', finalTalkingAmount * 0.8)
              vrm.expressionManager.setValue('oh', finalTalkingAmount * 0.2)
              break
            case 1:
              vrm.expressionManager.setValue('oh', finalTalkingAmount * 0.7)
              vrm.expressionManager.setValue('aa', finalTalkingAmount * 0.3)
              break
            case 2:
              vrm.expressionManager.setValue('ih', finalTalkingAmount * 0.6)
              vrm.expressionManager.setValue('aa', finalTalkingAmount * 0.4)
              break
            case 3:
              vrm.expressionManager.setValue('ou', finalTalkingAmount * 0.5)
              vrm.expressionManager.setValue('aa', finalTalkingAmount * 0.5)
              break
          }

          // Add slight head movement when speaking
          if (vrm.humanoid && vrm.humanoid.getNormalizedBoneNode('head')) {
            const headBone = vrm.humanoid.getNormalizedBoneNode('head')
            if (headBone) {
              const speakingMovement = Math.sin(elapsedTime * 6) * 0.03
              headBone.rotation.x += speakingMovement
            }
          }
        } catch (e) {
          // Fallback to simple aa expression if other visemes don't exist
          try {
            const simpleTalking = Math.sin(elapsedTime * 10) * 0.3 + 0.3
            vrm.expressionManager.setValue('aa', Math.max(0, simpleTalking))
          } catch (fallbackError) {
            console.warn("Expression error:", e)
          }
        }
      } else if (vrm.expressionManager) {
        // Reset all mouth expressions when not speaking
        try {
          const expressionsToReset = ['aa', 'oh', 'ih', 'ou', 'ee']
          expressionsToReset.forEach(expr => {
            try {
              vrm.expressionManager?.setValue(expr, 0)
            } catch (e) {
              // Ignore if expression doesn't exist
            }
          })
        } catch (e) {
          // Ignore expression errors
        }
      }

      // === SUBTLE BODY ANIMATIONS ===
      // Shoulder breathing
      if (vrm.humanoid) {
        const leftShoulder = vrm.humanoid.getNormalizedBoneNode('leftShoulder')
        const rightShoulder = vrm.humanoid.getNormalizedBoneNode('rightShoulder')
        
        if (leftShoulder && rightShoulder) {
          const shoulderBreathing = Math.sin(elapsedTime * 1.2) * 0.008
          leftShoulder.rotation.z = shoulderBreathing
          rightShoulder.rotation.z = -shoulderBreathing
        }
      }

      // === RELAXED ARM POSE ===
      // Adjust arm bones to a relaxed position
      if (vrm.humanoid) {
        const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
        const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
        const leftLowerArm = vrm.humanoid.getNormalizedBoneNode('leftLowerArm');
        const rightLowerArm = vrm.humanoid.getNormalizedBoneNode('rightLowerArm');

        if (leftUpperArm && rightUpperArm) {
          leftUpperArm.rotation.x = -0.2; // Slight downward rotation
          rightUpperArm.rotation.x = -0.2;
        }

        if (leftLowerArm && rightLowerArm) {
          leftLowerArm.rotation.x = 0.1; // Slight inward bend
          rightLowerArm.rotation.x = 0.1;
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
