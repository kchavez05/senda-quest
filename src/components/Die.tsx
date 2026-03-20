import React, { useRef, useState, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame, useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface DieProps {
  onSettle: (result: number) => void;
  sides?: number;
  index?: number;
  count?: number;
}

export default function Die({ onSettle, sides = 20, index = 0, count = 1 }: DieProps) {
  const { viewport } = useThree();
  
  const startX = (index - (count - 1) / 2) * 3;

  // A generic sphere physical rig works smoothly for all dice shapes
  const [ref, api] = useSphere(() => ({
    mass: 5,
    position: [startX, 5, 0],
    args: [1.5],
    angularDamping: 0.9,
    linearDamping: 0.5,
    material: { friction: 0.9, restitution: 0.1 }
  }));

  const geometryData = React.useMemo(() => {
    let geom;
    if (sides === 4) geom = new THREE.TetrahedronGeometry(1.5, 0);
    else if (sides === 8) geom = new THREE.OctahedronGeometry(1.5, 0);
    else geom = new THREE.IcosahedronGeometry(1.5, 0);

    const pos = geom.getAttribute('position');
    const tempFaces = [];
    for (let i = 0; i < pos.count; i += 3) {
      const vA = new THREE.Vector3().fromBufferAttribute(pos, i);
      const vB = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
      const vC = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
      const center = new THREE.Vector3().addVectors(vA, vB).add(vC).divideScalar(3);
      
      const normal = center.clone().normalize();
      
      const dummy = new THREE.Object3D();
      dummy.position.copy(center);
      dummy.lookAt(center.clone().add(normal));
      const quaternion = dummy.quaternion.clone();

      const textPos = center.clone().multiplyScalar(1.02);
      tempFaces.push({ position: textPos, quaternion, value: (i / 3) + 1 });
    }
    return { geom, tempFaces };
  }, [sides]);

  const [rolling, setRolling] = useState(false);
  const [settled, setSettle] = useState(false);
  
  const velocity = useRef([0, 0, 0]);
  const angularVelocity = useRef([0, 0, 0]);
  const rotation = useRef([0, 0, 0, 1]);
  const rollStartTime = useRef(0);
  
  useEffect(() => {
    // @ts-ignore
    const vSub = api.velocity.subscribe((v) => (velocity.current = v));
    // @ts-ignore
    const aSub = api.angularVelocity.subscribe((v) => (angularVelocity.current = v));
    // @ts-ignore
    const qSub = api.quaternion.subscribe((q) => (rotation.current = q));
    return () => {
      vSub();
      aSub();
      qSub();
    };
  }, [api]);

  const bind = useDrag(({ movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], active }) => {
    if (active && !rolling) {
      // Pick up the die! Suspend gravity and move it dynamically in the physical space relative to user drag
      const factorX = viewport.width / window.innerWidth;
      const factorZ = viewport.height / window.innerHeight;
      
      // Lock the die strictly relative to its staggered origin position while charging
      api.position.set(startX, 5, 0);
      api.velocity.set(0, 0, 0); // suspend gravity
      
      // Give it a subtle, chaotic kinetic spin in your hand based on drag direction
      api.angularVelocity.set(dx * vx * 10, 0, dy * vy * 10); 
    } else if (!active && !rolling) {
      setRolling(true);
      setSettle(false);
      rollStartTime.current = Date.now();
      
      // Calculate swipe force (screen space to world space approximation)
      const forceX = dx * vx * 35;
      const forceZ = dy * vy * 35;
      const forceY = (vx + vy) * 15 + 20; // pop it up into the air
      
      api.applyImpulse([forceX, forceY, forceZ], [0, -1, 0]);
      api.angularVelocity.set(
        Math.random() * 40 - 20, 
        Math.random() * 40 - 20, 
        Math.random() * 40 - 20
      );
    }
  });

  useFrame(() => {
    if (rolling && !settled) {
      const v = velocity.current;
      const av = angularVelocity.current;
      const speed = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
      const angleSpeed = Math.sqrt(av[0]**2 + av[1]**2 + av[2]**2);

      // Enforce a minimum 500ms duration so the physics engine has time to accelerate
      // 0.5 threshold to snap earlier
      if (Date.now() - rollStartTime.current > 600 && speed < 0.5 && angleSpeed < 0.5) {
        setSettle(true);
        
        const q = rotation.current;
        const currentRotation = new THREE.Quaternion(q[0], q[1], q[2], q[3]);

        // Generate an array of face normal vectors matching the loaded geometry
        const { geom } = geometryData;
        const positionAttribute = geom.getAttribute('position');
        const faceNormals = [];
        
        for (let i = 0; i < positionAttribute.count; i += 3) {
          const vA = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
          const vB = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1);
          const vC = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2);
          
          const faceCenter = new THREE.Vector3().addVectors(vA, vB).add(vC).divideScalar(3).normalize();
          faceNormals.push(faceCenter);
        }

        const upVector = new THREE.Vector3(0, 1, 0);

        let bestDot = -Infinity;
        let bestFaceIndex = 0;

        // Find which face normal is pointing closest to the global "UP" vector
        faceNormals.forEach((normal, i) => {
          const worldNormal = normal.clone().applyQuaternion(currentRotation);
          const dot = worldNormal.dot(upVector);
          if (dot > bestDot) {
            bestDot = dot;
            bestFaceIndex = i;
          }
        });

        // 1. Calculate rotation needed to snap the die flat
        const chosenNormal = faceNormals[bestFaceIndex].clone().applyQuaternion(currentRotation);
        const snapQuat = new THREE.Quaternion().setFromUnitVectors(chosenNormal, upVector);
        const finalQuat = snapQuat.multiply(currentRotation);
        
        // 2. Stop the physics and snap it flat seamlessly!
        api.velocity.set(0, 0, 0);
        api.angularVelocity.set(0, 0, 0);
        api.quaternion.set(finalQuat.x, finalQuat.y, finalQuat.z, finalQuat.w);

        // Map the physical index sequentially simulating the geometric face
        const mappedRoll = (bestFaceIndex % sides) + 1;
        setTimeout(() => {
          onSettle(mappedRoll);
        }, 1200);
      }
    }
  });

  return (
    // @ts-ignore
    <mesh ref={ref} {...bind()} castShadow receiveShadow>
      <primitive object={geometryData.geom} />
      <meshStandardMaterial 
        color="#2a2e33" 
        roughness={0.2} 
        metalness={0.8} 
        flatShading={true}
      />
      
      <lineSegments>
        <edgesGeometry args={[geometryData.geom]} />
        <lineBasicMaterial color="#ff4e00" linewidth={2} />
      </lineSegments>
      {geometryData.tempFaces.map((f, i) => (
        <Text
          key={i}
          position={f.position}
          quaternion={f.quaternion}
          fontSize={sides === 4 ? 0.6 : 0.8}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {(i % sides) + 1}
        </Text>
      ))}
    </mesh>
  );
}
