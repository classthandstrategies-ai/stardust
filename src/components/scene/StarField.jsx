import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { bvToRGB } from '../../lib/colors.js';

/**
 * The star field — a single GPU point cloud of the whole catalogue.
 *
 * Each star's on-screen size and brightness come from its real apparent
 * magnitude; its tint from the B–V colour index. A soft circular falloff in the
 * fragment shader gives every point a gentle glow, which the scene's bloom pass
 * then blooms for the brightest stars. A barely-there twinkle modulates
 * brightness unless the user prefers reduced motion.
 */
const vertexShader = /* glsl */ `
  attribute float aMag;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uTwinkle;
  uniform float uPixelRatio;
  uniform float uSizeScale;
  varying vec3 vColor;
  varying float vBright;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    // Brighter (lower magnitude) → larger point. ~8.5 spans Sirius..mag 6.
    float bright = clamp(6.8 - aMag, 0.4, 8.5);
    float twinkle = 1.0 - uTwinkle * 0.18 * (0.5 + 0.5 * sin(uTime * 2.0 + aPhase));
    float size = (1.0 + bright * 0.95) * uSizeScale * uPixelRatio * twinkle;
    gl_PointSize = size * (300.0 / -mv.z);

    // Fade stars out at and below the horizon (position.y = radius·sin(alt)) so
    // below-horizon stars never bleed through the ground when you orbit down.
    // The taper just above the horizon also reads as real atmospheric extinction.
    float horizonFade = smoothstep(-1.0, 5.0, position.y);

    vColor = aColor;
    vBright = clamp(bright / 8.5, 0.12, 1.0) * twinkle * horizonFade;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBright;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 2.2);
    // Bright cores wash toward white, like a saturated star on the retina.
    vec3 col = mix(vColor, vec3(1.0), glow * 0.5);
    gl_FragColor = vec4(col, glow * vBright);
  }
`;

export default function StarField({ stars, reducedMotion }) {
  const materialRef = useRef();

  // Build geometry attributes once per sky.
  const { positions, mags, colors, phases } = useMemo(() => {
    const n = stars.count;
    const colors = new Float32Array(n * 3);
    const phases = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const [r, g, b] = bvToRGB(stars.colorIndices[i]);
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
      // Deterministic per-star twinkle phase (no Math.random — stable across renders).
      phases[i] = (i * 12.9898) % (Math.PI * 2);
    }
    return { positions: stars.positions, mags: stars.magnitudes, colors, phases };
  }, [stars]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTwinkle: { value: reducedMotion ? 0 : 1 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSizeScale: { value: 1.0 },
    }),
    [reducedMotion]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aMag" args={[mags, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
