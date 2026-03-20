import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane } from '@react-three/cannon';
import * as THREE from 'three';
import Die from './Die';

function InvisibleWall({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  usePlane(() => ({ position, rotation, material: { restitution: 0.1 } }));
  return null; // Invisible
}

function Floor() {
  usePlane(() => ({ position: [0, -5, 0], rotation: [-Math.PI / 2, 0, 0], material: { restitution: 0.1, friction: 1.0 } }));
  return (
    <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial opacity={0.3} color="#ff4e00" />
    </mesh>
  );
}

interface DiceRollerProps {
  onSettle: (result: number) => void;
  count?: number;
  sides?: number;
}

export default function DiceRoller({ onSettle, count = 1, sides = 20 }: DiceRollerProps) {
  const [results, setResults] = React.useState<number[]>([]);
  const hasSettled = React.useRef(false);

  const handleSingleSettle = (val: number) => {
    setResults(prev => {
      const newResults = [...prev, val];
      if (newResults.length === count && !hasSettled.current) {
        hasSettled.current = true;
        const total = newResults.reduce((a, b) => a + b, 0);
        onSettle(total);
      }
      return newResults;
    });
  };
  return (
    <div className="fixed inset-0 z-50 pointer-events-auto bg-black/60 backdrop-blur-sm touch-none">
      <div className="absolute top-10 left-0 right-0 text-center pointer-events-none">
        <h2 className="text-2xl text-white font-bold tracking-widest uppercase animate-pulse">
          Swipe to Roll
        </h2>
      </div>
      
      <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 10, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize-width={1024} 
          shadow-mapSize-height={1024} 
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff4e00" />

        <Physics gravity={[0, -40, 0]} defaultContactMaterial={{ restitution: 0.1, friction: 0.9 }}>
          {/* Invisible boundaries to keep the die on screen */}
          <Floor />
          <InvisibleWall position={[0, 0, -12]} rotation={[0, 0, 0]} /> {/* Top */}
          <InvisibleWall position={[0, 0, 12]} rotation={[0, -Math.PI, 0]} /> {/* Bottom */}
          <InvisibleWall position={[-8, 0, 0]} rotation={[0, Math.PI / 2, 0]} /> {/* Left */}
          <InvisibleWall position={[8, 0, 0]} rotation={[0, -Math.PI / 2, 0]} /> {/* Right */}
          <InvisibleWall position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]} /> {/* Ceiling */}

          {Array.from({ length: count }).map((_, i) => (
            <Die key={i} index={i} count={count} sides={sides} onSettle={handleSingleSettle} />
          ))}
        </Physics>
      </Canvas>
    </div>
  );
}
