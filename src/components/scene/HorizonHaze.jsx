import * as THREE from 'three';

/**
 * A whisper of horizon. The viewer sits at the centre of the dome; these two
 * inward-facing spheres add (1) a soft darkening below the horizon so the
 * ground reads without a hard line, and (2) a barely-there glow band right at
 * the horizon — the faint air-glow of a truly dark sky. Both are part of the
 * sky, not UI chrome, so a touch of glow here is in keeping with DESIGN.md.
 */
const groundVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const groundFrag = /* glsl */ `
  varying vec3 vDir;
  void main() {
    // vDir.y is sin(altitude); fade in below the horizon.
    float below = smoothstep(0.02, -0.22, vDir.y);
    gl_FragColor = vec4(vec3(0.006, 0.006, 0.024), below * 0.92);
  }
`;

const glowFrag = /* glsl */ `
  varying vec3 vDir;
  void main() {
    float band = exp(-pow(vDir.y * 7.0, 2.0)) * 0.10;
    gl_FragColor = vec4(vec3(0.10, 0.09, 0.20) * band, band);
  }
`;

export default function HorizonHaze() {
  return (
    <group>
      {/* Ground darkening — overlays below-horizon sky. */}
      <mesh renderOrder={2}>
        <sphereGeometry args={[99, 32, 32]} />
        <shaderMaterial
          vertexShader={groundVert}
          fragmentShader={groundFrag}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      {/* Horizon air-glow — additive, very faint. */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[98, 32, 32]} />
        <shaderMaterial
          vertexShader={groundVert}
          fragmentShader={glowFrag}
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
