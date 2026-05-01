import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Nebulae() {
  const count = 40;
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 50;
      const y = (Math.random() - 0.5) * 50;
      const z = (Math.random() - 0.5) * 50;
      const size = Math.random() * 5 + 2;
      const color = new THREE.Color(
        Math.random() > 0.5 ? '#7C3AED' : '#00f3ff'
      ).multiplyScalar(0.5);
      temp.push({ x, y, z, size, color });
    }
    return temp;
  }, []);

  return (
    <group>
      {particles.map((p, i) => (
        <Float key={i} speed={1.5} rotationIntensity={2} floatIntensity={2}>
          <Sphere args={[p.size, 16, 16]} position={[p.x, p.y, p.z]}>
            <meshBasicMaterial
              color={p.color}
              transparent
              opacity={0.03}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

function MovingStars() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.01;
    }
  });

  return (
    <group ref={ref}>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
    </group>
  );
}

function CentralDebris() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={ref}>
      <mesh position={[10, 5, -15]} rotation={[1, 1, 1]}>
        <torusKnotGeometry args={[2, 0.5, 128, 16]} />
        <MeshDistortMaterial
          color="#7C3AED"
          speed={2}
          distort={0.4}
          radius={1}
          emissive="#4411aa"
          emissiveIntensity={0.5}
          transparent
          opacity={0.15}
        />
      </mesh>
    </group>
  );
}

const SpaceBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#0F0F23]">
      <React.Suspense fallback={<div className="w-full h-full bg-[#0F0F23]" />}>
        <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
          <color attach="background" args={['#0F0F23']} />
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#00f3ff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7C3AED" />
          
          <MovingStars />
          <Nebulae />
          <CentralDebris />
          
          <fog attach="fog" args={['#0F0F23', 10, 60]} />
        </Canvas>
      </React.Suspense>
    </div>
  );
};

export default SpaceBackground;
