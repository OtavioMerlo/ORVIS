import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/* ═══════════════ Crystal Core Component ═══════════════ */

interface CrystalCoreProps {
  audioData: React.MutableRefObject<Uint8Array | null>;
  isListening: boolean;
  color?: string;
  className?: string;
}

// Separate component for post-processing
function Effects() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer>(null!);

  useEffect(() => {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.8, // intensity
      0.3, // radius
      0.85 // threshold
    );
    bloomPass.threshold = 0.1;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const effectComposer = new EffectComposer(gl);
    effectComposer.addPass(renderScene);
    effectComposer.addPass(bloomPass);
    composer.current = effectComposer;
  }, [gl, scene, camera, size]);

  useFrame(() => {
    if (composer.current) {
      composer.current.render();
    }
  }, 1);

  return null;
}

const ParticleSystem = ({ intensityRef }: { intensityRef: React.MutableRefObject<number> }) => {
  const count = 2500;
  const pointsRef = useRef<THREE.Points>(null!);
  
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vels = [];
    for (let i = 0; i < count; i++) {
      const radius = 1.6 + Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.8;
      pos[i * 3 + 2] = Math.cos(phi) * radius;
      
      vels.push({
        speed: 0.002 + Math.random() * 0.008,
        angleH: theta,
        angleV: phi,
        radius: radius
      });
    }
    return [pos, vels];
  }, []);

  useFrame(() => {
    const intensity = intensityRef.current;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      v.angleH += v.speed * (0.5 + intensity);
      v.angleV += v.speed * 0.3;
      const rad = v.radius + intensity * 0.12;
      
      array[i * 3] = Math.sin(v.angleV) * Math.cos(v.angleH) * rad;
      array[i * 3 + 1] = Math.sin(v.angleV) * Math.sin(v.angleH) * rad * 0.8;
      array[i * 3 + 2] = Math.cos(v.angleV) * rad;
    }
    posAttr.needsUpdate = true;
    
    // @ts-ignore
    pointsRef.current.material.size = 0.022 + intensity * 0.045;
    // @ts-ignore
    pointsRef.current.material.color.setHSL(0.55 + intensity * 0.2, 1.0, 0.65);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial transparent blending={THREE.AdditiveBlending} />
    </points>
  );
};

const CrystalVisualizer = ({ audioData, isListening, color = '#00ccff' }: { audioData: React.MutableRefObject<Uint8Array | null>, isListening: boolean, color?: string }) => {
  const coreRef = useRef<THREE.Group>(null!);
  const crystalRef = useRef<THREE.Mesh>(null!);
  const wireRef = useRef<THREE.Mesh>(null!);
  const ringEquatorRef = useRef<THREE.Mesh>(null!);
  const ringDiagonalRef = useRef<THREE.Mesh>(null!);
  const outerRing1Ref = useRef<THREE.Mesh>(null!);
  const outerRing2Ref = useRef<THREE.Mesh>(null!);
  const colorLightRef = useRef<THREE.PointLight>(null!);
  const backLightRef = useRef<THREE.PointLight>(null!);
  const orbRefs = useRef<(THREE.Mesh | null)[]>([]);

  const intensities = useRef({
    avg: 0,
    bass: 0,
    treble: 0
  });

  // Convert hex to HSL for some effects
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const hsl = useMemo(() => {
    const h = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(h);
    return h;
  }, [baseColor]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    let avg = 0, bass = 0, treble = 0;

    if (audioData.current && isListening) {
      const data = audioData.current;
      const len = data.length;
      
      // Calculate intensities (simplified version of the user's logic)
      let sum = 0, bSum = 0, tSum = 0;
      const bLimit = Math.floor(len * 0.15);
      const tStart = Math.floor(len * 0.4);
      const tEnd = Math.floor(len * 0.8);

      for (let i = 0; i < len; i++) {
        sum += data[i];
        if (i < bLimit) bSum += data[i];
        if (i > tStart && i < tEnd) tSum += data[i];
      }
      
      avg = (sum / len) / 255;
      bass = (bSum / bLimit) / 255;
      treble = (tSum / (tEnd - tStart)) / 255;
    } else {
      // Idle breathing
      avg = 0.1 + Math.sin(t * 1.5) * 0.05;
      bass = 0.15 + Math.sin(t * 1.2) * 0.08;
      treble = 0.1 + Math.cos(t * 2) * 0.04;
    }

    // Smoothing
    intensities.current.avg += (avg - intensities.current.avg) * 0.2;
    intensities.current.bass += (bass - intensities.current.bass) * 0.2;
    intensities.current.treble += (treble - intensities.current.treble) * 0.2;

    const intensity = intensities.current.avg;
    const b = intensities.current.bass;
    const tr = intensities.current.treble;

    // Apply transforms
    const scaleCore = 1 + intensity * 0.2;
    crystalRef.current.scale.setScalar(scaleCore);
    wireRef.current.scale.setScalar(scaleCore * 1.02);

    // Emissive reaction
    // @ts-ignore
    crystalRef.current.material.emissiveIntensity = 0.35 + intensity * 1.5;
    // @ts-ignore
    ringEquatorRef.current.material.emissiveIntensity = 0.5 + intensity * 1.2;
    // @ts-ignore
    outerRing1Ref.current.material.emissiveIntensity = 0.3 + intensity * 0.8;

    // Rings
    ringEquatorRef.current.scale.setScalar(1 + intensity * 0.1);
    ringDiagonalRef.current.scale.setScalar(1 + intensity * 0.08);
    outerRing1Ref.current.scale.setScalar(1 + b * 0.15);
    outerRing2Ref.current.scale.setScalar(1 + tr * 0.15);

    ringEquatorRef.current.rotation.z += 0.01 + intensity * 0.05;
    ringDiagonalRef.current.rotation.y += 0.007 + intensity * 0.04;
    outerRing1Ref.current.rotation.z += 0.008 + b * 0.04;
    outerRing2Ref.current.rotation.x += 0.006 + tr * 0.03;

    // Orbs
    orbRefs.current.forEach((orb) => {
      if (orb) {
        orb.scale.setScalar(0.09 + intensity * 0.12);
        // @ts-ignore
        orb.material.color.setHSL(hsl.h + intensity * 0.2, 1.0, 0.6);
        // @ts-ignore
        orb.material.emissiveIntensity = 0.4 + intensity * 1.2;
      }
    });

    // Lights
    if (colorLightRef.current) {
      colorLightRef.current.color.setHSL(hsl.h + intensity * 0.2, 1.0, 0.6);
      colorLightRef.current.intensity = 0.6 + intensity * 2.0;
    }
    if (backLightRef.current) {
      backLightRef.current.intensity = 0.4 + tr * 1.5;
    }

    // Group floating
    coreRef.current.position.y = Math.sin(t * 2) * 0.05 + b * 0.1;
  });

  const orbElements = useMemo(() => {
    const orbs = [];
    for (let index = 0; index < 8; index++) {
      const angle = (index / 8) * Math.PI * 2;
      const radius = 1.25;
      orbs.push(
        <mesh 
          key={index} 
          ref={(el) => (orbRefs.current[index] = el)}
          position={[Math.cos(angle) * radius, Math.sin(angle) * 0.6, Math.sin(angle) * radius]}
        >
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ff44aa" emissive="#ff2288" emissiveIntensity={0.6} />
        </mesh>
      );
    }
    return orbs;
  }, []);

  const intensityRef = useRef(0);
  useFrame(() => { intensityRef.current = intensities.current.avg; });

  return (
    <group>
      <group ref={coreRef}>
        {/* Crystal Core */}
        <mesh ref={crystalRef} castShadow>
          <icosahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.35} 
            metalness={0.85} 
            roughness={0.25} 
          />
        </mesh>

        {/* Wireframe Overlay */}
        <mesh ref={wireRef}>
          <icosahedronGeometry args={[0.65, 0]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
        </mesh>

        {/* Inner Rings */}
        <mesh ref={ringEquatorRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.035, 64, 200]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.9} />
        </mesh>

        <mesh ref={ringDiagonalRef} rotation={[Math.PI / 3, 0, Math.PI / 3]}>
          <torusGeometry args={[0.92, 0.035, 64, 200]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.9} />
        </mesh>

        {/* Orbs */}
        {orbElements}
      </group>

      {/* Outer Rings */}
      <mesh ref={outerRing1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.025, 64, 200]} />
        <meshStandardMaterial color="#88aaff" emissive="#3388ff" emissiveIntensity={0.4} transparent opacity={0.7} />
      </mesh>

      <mesh ref={outerRing2Ref} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.45, 0.025, 64, 200]} />
        <meshStandardMaterial color="#88aaff" emissive="#3388ff" emissiveIntensity={0.4} transparent opacity={0.7} />
      </mesh>

      {/* Dynamic Particles */}
      <ParticleSystem intensityRef={intensityRef} />

      {/* Static Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      {/* Lights */}
      <pointLight ref={colorLightRef} position={[1, 1.5, 1]} intensity={0.8} color="#00aaff" />
      <pointLight ref={backLightRef} position={[0, 1, -2.5]} intensity={0.6} color="#ff44aa" />
      <pointLight position={[-1, 1, 2]} intensity={0.5} color="#2266ff" />
      <directionalLight position={[2, 3, 2]} intensity={1.2} />
      <ambientLight intensity={0.2} />
    </group>
  );
};

const CrystalCore: React.FC<CrystalCoreProps> = ({ audioData, isListening, color, className }) => {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [3, 2, 5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: '#010518' }}
      >
        <fogExp2 attach="fog" args={['#010518', 0.012]} />
        
        <CrystalVisualizer audioData={audioData} isListening={isListening} color={color} />
        <OrbitControls enableDamping dampingFactor={0.06} rotateSpeed={1.2} />
        
        <Effects />
      </Canvas>
    </div>
  );
};

export default CrystalCore;
