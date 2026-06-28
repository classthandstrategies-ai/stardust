import { useRef, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import StarField from './StarField.jsx';
import ConstellationLines from './ConstellationLines.jsx';
import HorizonHaze from './HorizonHaze.jsx';
import Moon from './Moon.jsx';
import Planets from './Planets.jsx';
import CameraRig from './CameraRig.jsx';

/**
 * The immersive sky. The viewer sits at the centre of the dome looking out;
 * OrbitControls (via CameraRig) provide the slow ambient drift and let the user
 * look around. A bloom pass gives the brightest stars, planets, and the Moon
 * their soft planetarium glow.
 */
export default function SkyScene({ sky, reducedMotion, onReady }) {
  const controlsRef = useRef();
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);

  // Hover shows a transient label; click pins one; clicking empty space clears.
  const handleFocus = useCallback((payload, kind) => {
    if (payload && payload.kind === 'hover') {
      setHovered(payload);
    } else if (payload === null && kind === 'hover') {
      setHovered(null);
    } else if (payload && payload.kind === 'pin') {
      setPinned((prev) => (prev && prev.name === payload.name ? null : payload));
    }
  }, []);

  const label = hovered || pinned;

  return (
    <Canvas
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      camera={{ fov: 70, near: 0.1, far: 1000, position: [0, 0, 0.1] }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color('#000000'), 1);
        onReady?.(gl.domElement);
      }}
      onPointerMissed={() => setPinned(null)}
    >
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={-0.28}
        minPolarAngle={0.2}
        maxPolarAngle={2.9}
        target={[0, 0, 0]}
      />
      <CameraRig controlsRef={controlsRef} reducedMotion={reducedMotion} />

      {/* Faint ambient fill — the scene is mostly self-lit/emissive. */}
      <ambientLight intensity={0.04} />

      <HorizonHaze />
      <ConstellationLines lines={sky.lines} />
      <StarField stars={sky.stars} reducedMotion={reducedMotion} />
      <Moon moon={sky.moon} sun={sky.sun} onFocus={handleFocus} />
      <Planets planets={sky.planets} onFocus={handleFocus} />

      {label && (
        <Html position={label.position} center zIndexRange={[40, 0]}>
          <div className="pointer-events-none -translate-y-1/2 select-none whitespace-nowrap">
            <div className="panel px-3 py-2">
              <div className="text-bone" style={{ fontSize: 13, fontWeight: 600 }}>
                {label.name}
              </div>
              <div className="text-smoke" style={{ fontSize: 11, maxWidth: 220 }}>
                {label.fact}
              </div>
            </div>
          </div>
        </Html>
      )}

      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>
    </Canvas>
  );
}
