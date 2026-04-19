import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, PerspectiveCamera, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { TAROT_CARDS, SPREAD_CONFIGS } from '../constants/tarotData';
import type { SpreadType, ThreeCardMode } from '../constants/tarotData';

interface CardProps {
  index: number;
  basePosition: [number, number, number];
  baseRotation: [number, number, number];
  deckRotation: { x: number; y: number };
  isHovered: boolean;
  isSelected: boolean;
  gameState: string;
  imageUrl: string;
  targetPos: { x: number; y: number; z: number; rotation?: [number, number, number] } | null;
}

const SelectedParticles = ({ isSelected, index }: { isSelected: boolean, index: number }) => {
  const count = 250; // Denser for a solid border look
  const pointsRef = useRef<THREE.Points>(null);
  
  const [particles] = useState(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Logic to place particles ONLY on the perimeter
      const side = Math.random();
      let x = 0, y = 0;
      const margin = 0.05; // Distance from actual edge
      
      if (side < 0.25) { // Top edge
        x = (Math.random() - 0.5) * 1.1;
        y = 0.8 + margin;
      } else if (side < 0.5) { // Bottom edge
        x = (Math.random() - 0.5) * 1.1;
        y = -0.8 - margin;
      } else if (side < 0.75) { // Left edge
        x = -0.5 - margin;
        y = (Math.random() - 0.5) * 1.7;
      } else { // Right edge
        x = 0.5 + margin;
        y = (Math.random() - 0.5) * 1.7;
      }
      
      p[i * 3] = x;
      p[i * 3 + 1] = y;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return p;
  });

  useFrame((state) => {
    if (!pointsRef.current || !isSelected) return;
    const t = state.clock.getElapsedTime();
    const attr = pointsRef.current.geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Micro-vibration only
      attr.array[i3] += Math.sin(t * 15 + i) * 0.002;
      attr.array[i3 + 1] += Math.cos(t * 15 + i) * 0.002;
    }
    attr.needsUpdate = true;
    
    const hue = (t * 0.4 + index * 0.1) % 1;
    (pointsRef.current.material as THREE.PointsMaterial).color.setHSL(hue, 1.0, 0.6);
  });

  if (!isSelected) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particles} itemSize={3} args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        size={0.06} 
        transparent 
        opacity={1.0} 
        blending={THREE.AdditiveBlending} 
        sizeAttenuation 
      />
    </points>
  );
};

const Card = ({ basePosition, baseRotation, deckRotation, isHovered, isSelected, gameState, imageUrl, targetPos, index }: CardProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    new THREE.TextureLoader().load(imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
  }, [imageUrl]);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (gameState === 'SHUFFLING') {
      const time = state.clock.getElapsedTime();
      const shufflePos = new THREE.Vector3(
        Math.sin(time * 5 + index) * 5,
        Math.cos(time * 3 + index) * 3,
        Math.sin(time * 2 + index) * 2
      );
      groupRef.current.position.lerp(shufflePos, 0.05);
      groupRef.current.rotation.x += 0.1;
      groupRef.current.rotation.y += 0.15;
      return;
    }

    if (isSelected && targetPos) return;

    if (!isSelected) {
      const pos = new THREE.Vector3(...basePosition);
      const euler = new THREE.Euler(
        deckRotation.x + Math.sin(deckRotation.y * 0.3 + index) * 0.1,
        deckRotation.y,
        0,
        'XYZ'
      );
      
      pos.applyEuler(euler);
      const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...baseRotation));
      const groupQuat = new THREE.Quaternion().setFromEuler(euler);
      quaternion.premultiply(groupQuat);

      if (isHovered && gameState === 'DRAWING') {
          const outward = pos.clone().normalize().multiplyScalar(2.0);
          pos.add(outward);
      }

      groupRef.current.position.lerp(pos, 0.1);
      groupRef.current.quaternion.slerp(quaternion, 0.1);

      const targetScale = isHovered ? 1.6 : (isSelected ? 0.6 : 0.9); 
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });
useEffect(() => {
  if (isSelected && groupRef.current && targetPos) {
    // Fly to Storage Slot
    gsap.to(groupRef.current.position, { 
      x: targetPos.x, y: targetPos.y, z: targetPos.z, 
      duration: 2.0, ease: "power4.out" 
    }); 
    const targetRot = targetPos.rotation || [0.4, 0, 0];
    gsap.to(groupRef.current.rotation, {
      x: targetRot[0], y: targetRot[1], z: targetRot[2],
      duration: 2.0, ease: "power4.out"
    });

    // ONLY reveal face when the overall game state reaches 'RESULT'
    if (meshRef.current) {
      if (gameState === 'RESULT') {
        gsap.to(meshRef.current.rotation, { y: Math.PI, duration: 1.5, ease: "power2.inOut", delay: 0.5 });
      } else {
        // Keep face down while in tray during drawing
        gsap.to(meshRef.current.rotation, { y: 0, duration: 0.5 });
      }
    }
  } else if (!isSelected && groupRef.current && meshRef.current) {
    // RESET: Ensure card flips back to face-down (back side up) when returned to deck
    gsap.to(meshRef.current.rotation, { y: 0, duration: 1.0, ease: "power2.out" });
  }
}, [isSelected, targetPos, gameState]);

  return (
    <group ref={groupRef}>
      <group ref={meshRef}>
        <SelectedParticles isSelected={isSelected} index={index} />
        <mesh castShadow>
          <boxGeometry args={[1, 1.793, 0.08]} />
          <meshStandardMaterial color="#0a1a12" roughness={0.6} metalness={0.2} />
          <mesh position={[0, 0, 0.041]}>
            <planeGeometry args={[0.96, 1.753]} />
            <meshStandardMaterial color="#061611" emissive="#34d399" emissiveIntensity={isHovered ? 2.0 : 0.4} />
            <Text position={[0, 0, 0.01]} fontSize={0.15} color="#fde68a" anchorX="center" anchorY="middle">✧</Text>
          </mesh>
          <mesh position={[0, 0, -0.041]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.96, 1.753]} />
            <meshStandardMaterial map={texture} color="#ffffff" transparent opacity={texture ? 1 : 0.5} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
};

const ForestSpiritHand = ({ landmarks, isPaused }: { landmarks: any, isPaused: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wingLRef = useRef<THREE.Mesh>(null);
  const wingRRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current || !landmarks) return;
    const t = state.clock.getElapsedTime();

    // 1. Follow the Index Tip (Point 8) but scaled way down
    const pt = landmarks[8];
    const targetX = -(pt.x - 0.5) * 12;
    const yOffset = isPaused ? Math.sin(t * 10) * 0.2 : 0;
    const targetY = -(pt.y - 0.5) * 10 + yOffset;
    const targetZ = 13 - pt.z * 8;

    groupRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.2);

    // 2. Flapping Animation
    const flapSpeed = isPaused ? 2 : 8;
    const flapAngle = Math.sin(t * flapSpeed) * 0.5;
    if (wingLRef.current) wingLRef.current.rotation.z = Math.PI / 4 + flapAngle;
    if (wingRRef.current) wingRRef.current.rotation.z = -Math.PI / 4 - flapAngle;

    // 3. Rotation based on movement
    groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.1;
  });

  const spiritColor = isPaused ? "#fbcfe8" : "#fde68a";

  return (
    <group ref={groupRef} scale={0.4}> {/* Significantly smaller */}
      {/* Sprite Core */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
            color={spiritColor} 
            emissive={spiritColor} 
            emissiveIntensity={isPaused ? 15 : 5} 
            transparent 
            opacity={0.9} 
        />
      </mesh>
      
      {/* Decorative "Wings" / Spirit Wisps */}
      <group position={[0, 0, -0.1]}>
        <mesh ref={wingLRef} position={[-0.4, 0, 0]}>
            <planeGeometry args={[1, 0.6]} />
            <meshStandardMaterial color={spiritColor} transparent opacity={0.4} emissive={spiritColor} emissiveIntensity={2} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={wingRRef} position={[0.4, 0, 0]}>
            <planeGeometry args={[1, 0.6]} />
            <meshStandardMaterial color={spiritColor} transparent opacity={0.4} emissive={spiritColor} emissiveIntensity={2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Halo */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.02, 8, 32]} />
        <meshStandardMaterial color={spiritColor} emissive={spiritColor} emissiveIntensity={10} transparent opacity={0.5} />
      </mesh>

      <pointLight intensity={isPaused ? 20 : 10} distance={5} color={spiritColor} />
    </group>
  );
};

const Fireflies = ({ count = 70 }) => {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 35;
      p[i * 3 + 1] = (Math.random() - 0.5) * 30;
      p[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return p;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        ref.current.geometry.attributes.position.array[i3 + 1] += Math.sin(time + i) * 0.015;
        ref.current.geometry.attributes.position.array[i3] += Math.cos(time + i) * 0.015;
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" count={points.length / 3} array={points} itemSize={3} args={[points, 3]} /></bufferGeometry>
      <pointsMaterial size={0.2} color="#fde68a" transparent opacity={0.8} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
};

export const Experience = ({ handData, selectedCards, onSelect, gameState, spreadType, threeCardMode }: { 
    handData: any, 
    selectedCards: number[], 
    onSelect: (index: number) => void,
    gameState: string,
    spreadType: SpreadType,
    threeCardMode: ThreeCardMode
}) => {
  const [deckRotation, setDeckRotation] = useState({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const lastPinchTime = useRef<number>(0);
  const { mouse } = useThree();

  const currentSpread = SPREAD_CONFIGS[spreadType];
  const targetPositions = currentSpread.getPositions(threeCardMode);

  const cardsData = useMemo(() => {
    const data = [];
    const N = TAROT_CARDS.length;
    const radius = 9.5; 
    for (let i = 0; i < N; i++) {
      const theta = 2 * Math.PI * i / ((1 + Math.sqrt(5)) / 2);
      const phi = Math.acos(1 - 2 * (i + 0.5) / N);
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      const dummy = new THREE.Object3D();
      dummy.position.set(x, y, z);
      dummy.lookAt(0, 0, 0); 
      dummy.rotateY(Math.PI); 
      data.push({
        basePosition: [x, y, z] as [number, number, number],
        baseRotation: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z] as [number, number, number]
      });
    }
    return data;
  }, []);

  useFrame(() => {
    let inputX = mouse.x;
    let inputY = mouse.y;
    let isPinching = false;
    let fistDetected = false;

    if (handData && handData.landmarks && handData.landmarks[0]) {
      const landmarks = handData.landmarks[0];
      const palm = landmarks[0];
      inputX = -(landmarks[8].x - 0.5) * 2;
      inputY = -(landmarks[8].y - 0.5) * 2;
      
      // Basic pinch detection (Index + Thumb)
      const pinchDist = Math.sqrt(Math.pow(landmarks[8].x - landmarks[4].x, 2) + Math.pow(landmarks[8].y - landmarks[4].y, 2));
      
      // Fist detection: All fingers close to palm
      const fingerDists = [8, 12, 16, 20, 4].map(t => Math.sqrt(Math.pow(landmarks[t].x - palm.x, 2) + Math.pow(landmarks[t].y - palm.y, 2)));
      fistDetected = fingerDists.every(d => d < 0.28); // Robust threshold

      // Open hand pinch: Index/Thumb touching AND middle/ring/pinky extended
      const otherFingersExtended = [12, 16, 20].every(t => Math.sqrt(Math.pow(landmarks[t].x - palm.x, 2) + Math.pow(landmarks[t].y - palm.y, 2)) > 0.35);
      isPinching = pinchDist < 0.06 && otherFingersExtended;
    }

    setIsPaused(fistDetected);

    // Rotation logic
    if (!fistDetected && gameState === 'DRAWING') {
      const deadzone = 0.12; 

      const MAX_SPEED = 0.12; // Slightly increased top speed
      const ACCELERATION = 0.015; // 7.5x increase for faster spin-up

      // Vertical input -> Rotation around X axis
      if (Math.abs(inputY) > deadzone) {
          const desiredX = -(inputY - Math.sign(inputY) * deadzone) * 0.1;
          rotationVelocity.current.x = THREE.MathUtils.lerp(rotationVelocity.current.x, desiredX, ACCELERATION);
      } else {
          rotationVelocity.current.x = THREE.MathUtils.lerp(rotationVelocity.current.x, 0, 0.05);
      }

      // Horizontal input -> Rotation around Y axis
      if (Math.abs(inputX) > deadzone) {
          const desiredY = (inputX - Math.sign(inputX) * deadzone) * 0.1;
          rotationVelocity.current.y = THREE.MathUtils.lerp(rotationVelocity.current.y, desiredY, ACCELERATION);
      } else {
          rotationVelocity.current.y = THREE.MathUtils.lerp(rotationVelocity.current.y, 0, 0.05);
      }

      // Clamp speed
      rotationVelocity.current.x = THREE.MathUtils.clamp(rotationVelocity.current.x, -MAX_SPEED, MAX_SPEED);
      rotationVelocity.current.y = THREE.MathUtils.clamp(rotationVelocity.current.y, -MAX_SPEED, MAX_SPEED);
      
      setDeckRotation(prev => ({ 
        x: prev.x + rotationVelocity.current.x, 
        y: prev.y + rotationVelocity.current.y 
      }));
    } else if (fistDetected) {
      // ABSOLUTE STOP: When fist is detected, kill all velocity immediately and do not update rotation
      rotationVelocity.current.x = 0;
      rotationVelocity.current.y = 0;
      // Note: We don't call setDeckRotation here, so it remains perfectly still even if hand moves
    } else {
      // Natural dampening when not drawing (but not a fist)
      rotationVelocity.current.x *= 0.95;
      rotationVelocity.current.y *= 0.95;
      setDeckRotation(prev => ({ 
        x: prev.x + rotationVelocity.current.x, 
        y: prev.y + rotationVelocity.current.y 
      }));
    }

    // Selection
    if (gameState === 'DRAWING' && selectedCards.length < currentSpread.cardCount && !fistDetected) {
      let closestIdx = null;
      let minDistance = Infinity;
      const euler = new THREE.Euler(deckRotation.x, deckRotation.y, 0, 'XYZ');
      // Aligned with ForestSpiritHand follow logic: -(pt.x - 0.5) * 12, -(pt.y - 0.5) * 10
      const pointerPos = new THREE.Vector3(inputX * 6, inputY * 5, 12);

      cardsData.forEach((card, i) => {
         if (selectedCards.includes(i)) return;
         const pos = new THREE.Vector3(...card.basePosition).applyEuler(euler);
         const dist = pos.distanceTo(pointerPos);
         if (dist < minDistance && pos.z > 0.5) { 
             minDistance = dist;
             closestIdx = i;
         }
      });
      if (minDistance < 4.0 && closestIdx !== null) { 
          setHoveredIndex(closestIdx);
          if (isPinching) {
            const now = Date.now();
            if (now - lastPinchTime.current > 1000) { 
                lastPinchTime.current = now;
                onSelect(closestIdx);
            }
          }
      } else { setHoveredIndex(null); }
    } else { setHoveredIndex(null); }
  });

  useEffect(() => {
    const handleClick = () => {
      if (gameState === 'DRAWING' && hoveredIndex !== null && !selectedCards.includes(hoveredIndex) && !isPaused) onSelect(hoveredIndex);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [hoveredIndex, selectedCards, onSelect, gameState, isPaused]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 28]} />
      <ambientLight intensity={0.6} color="#a7f3d0" />
      <pointLight position={[0, 0, 5]} intensity={8} color="#fde68a" distance={35} />
      <directionalLight position={[10, 10, 15]} intensity={1.5} color="#34d399" />
      <directionalLight position={[-10, -10, 15]} intensity={1.0} color="#fbcfe8" />

      <group>
        {TAROT_CARDS.map((card, i) => {
          const selectIdx = selectedCards.indexOf(i);
          return (
            <Card key={i} index={i} basePosition={cardsData[i].basePosition} baseRotation={cardsData[i].baseRotation}
                deckRotation={deckRotation} isHovered={hoveredIndex === i} isSelected={selectIdx !== -1} 
                gameState={gameState} imageUrl={card.image} 
                targetPos={selectIdx !== -1 ? targetPositions[selectIdx] : null} />
          );
        })}
      </group>

      {/* Visual Storage Tray at the bottom - Optimized for visibility */}
      <mesh position={[0, -5.8, 12]} rotation={[-Math.PI / 2.3, 0, 0]}>
        <planeGeometry args={[25, 4]} />
        <meshStandardMaterial color="#061611" transparent opacity={0.4} emissive="#34d399" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, -5.8, 12.1]} rotation={[-Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[11, 11.05, 64]} />
        <meshStandardMaterial color="#fde68a" transparent opacity={0.2} emissive="#fde68a" emissiveIntensity={1} />
      </mesh>

      <Fireflies count={80} />
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[4, 2]} />
            <meshStandardMaterial color="#061611" emissive="#34d399" emissiveIntensity={1.5} wireframe />
        </mesh>
      </Float>

      {handData?.landmarks?.[0] && <ForestSpiritHand landmarks={handData.landmarks[0]} isPaused={isPaused} />}
      <fog attach="fog" args={['#061611', 15, 50]} />
    </>
  );
};
