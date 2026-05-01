import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════ Audio-reactive Sphere Mesh ═══════════════ */
interface SphereProps {
  audioData: React.MutableRefObject<Uint8Array | null>;
  isListening: boolean;
}

function ReactivesSphere({ audioData, isListening }: SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const smoothBass = useRef(0);
  const smoothMid = useRef(0);
  const smoothPeak = useRef(0);

  useEffect(() => {
    if (meshRef.current) {
      const geo = meshRef.current.geometry as THREE.SphereGeometry;
      originalPositions.current = new Float32Array(geo.attributes.position.array);
    }
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mesh = meshRef.current;
    const ring = ringRef.current;
    const inner = innerRef.current;
    if (!mesh || !originalPositions.current) return;

    let bass = 0, mid = 0, peak = 0;

    if (audioData.current && isListening) {
      const data = audioData.current;
      for (let i = 0; i < 10; i++) bass += data[i];
      bass /= (10 * 255);
      for (let i = 10; i < 30; i++) mid += data[i];
      mid /= (20 * 255);
      for (let i = 0; i < 30; i++) peak = Math.max(peak, data[i]);
      peak /= 255;
    } else {
      // Synthetic idle breathing
      bass = 0.15 + Math.sin(t * 1.5) * 0.08;
      mid = 0.1 + Math.sin(t * 2.1) * 0.05;
      peak = 0.2 + Math.sin(t * 1.8) * 0.1;
    }

    smoothBass.current += (bass - smoothBass.current) * 0.12;
    smoothMid.current += (mid - smoothMid.current) * 0.12;
    smoothPeak.current += (peak - smoothPeak.current) * 0.15;

    const fb = smoothBass.current;
    const fm = smoothMid.current;
    const fp = smoothPeak.current;

    // Vertex deformation
    const positions = (mesh.geometry as THREE.SphereGeometry).attributes.position.array as Float32Array;
    const orig = originalPositions.current;

    for (let i = 0; i < positions.length / 3; i++) {
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      const ox = orig[ix], oy = orig[iy], oz = orig[iz];
      let len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      if (len < 0.001) len = 1;
      const nx = ox / len, ny = oy / len, nz = oz / len;
      const theta = Math.atan2(ny, nx);
      const phi = Math.acos(nz);

      let pulse = 1 + fb * 0.25;
      let waveX = 1 + fm * 0.12 * Math.sin(theta * 4 + t * 6);
      let waveY = 1 + fm * 0.12 * Math.cos(phi * 6 + t * 5);
      let beatEffect = 1 + fp * 0.18 * Math.abs(Math.sin(theta * 2 + t * 12));

      let scale = Math.min(Math.max(pulse * waveX * waveY * beatEffect, 0.85), 1.35);

      positions[ix] = nx * scale;
      positions[iy] = ny * scale;
      positions[iz] = nz * scale;
    }
    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    mesh.rotation.y += 0.003 + fb * 0.012;
    mesh.rotation.x += 0.002 + fm * 0.008;

    // Ring
    if (ring) {
      ring.rotation.z += 0.008;
      const rs = 1 + fb * 0.15;
      ring.scale.set(rs, rs, rs);
    }

    // Inner glow
    if (inner) {
      const ig = 0.08 + fp * 0.12;
      (inner.material as THREE.MeshPhongMaterial).opacity = ig;
    }
  });

  return (
    <group>
      {/* Main wireframe sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          color="#00f3ff"
          wireframe
          emissive="#004466"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.95, 48, 48]} />
        <meshPhongMaterial
          color="#0088ff"
          transparent
          opacity={0.1}
          emissive="#004466"
        />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.012, 32, 200]} />
        <meshStandardMaterial color="#00f3ff" emissive="#0066aa" emissiveIntensity={0.5} />
      </mesh>

      {/* Second ring */}
      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[1.5, 0.006, 16, 150]} />
        <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={0.3} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ═══════════════ Star Particles ═══════════════ */
function StarField() {
  const count = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 20;
    }
    return pos;
  }, []);

  return (
    <Points positions={positions} stride={3}>
      <PointMaterial
        color="#88aaff"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </Points>
  );
}

/* ═══════════════ Grid Floor ═══════════════ */
function GridFloor() {
  return (
    <gridHelper
      args={[8, 24, '#00f3ff', '#1a2a4a']}
      position={[0, -1.5, 0]}
      // @ts-ignore
      material-transparent={true}
      // @ts-ignore
      material-opacity={0.08}
    />
  );
}

/* ═══════════════ Main Sphere3D Component ═══════════════ */
interface Sphere3DProps {
  audioData: React.MutableRefObject<Uint8Array | null>;
  isListening: boolean;
  className?: string;
}

const Sphere3D: React.FC<Sphere3DProps> = ({ audioData, isListening, className }) => {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.5, 3.8], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#000000', 5, 30]} />
        
        {/* Lights */}
        <ambientLight intensity={0.15} color="#111122" />
        <pointLight position={[2, 2, 2]} intensity={0.6} color="#00aaff" />
        <pointLight position={[-2, -1, -2]} intensity={0.3} color="#ff44aa" />
        <directionalLight position={[1, 2, 1]} intensity={0.4} />

        <ReactivesSphere audioData={audioData} isListening={isListening} />
        <StarField />
        <GridFloor />
      </Canvas>
    </div>
  );
};

export default Sphere3D;
