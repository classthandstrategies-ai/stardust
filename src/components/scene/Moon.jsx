import { useMemo } from 'react';
import * as THREE from 'three';

/** Soft radial-gradient sprite texture for the Moon's halo. */
function useHaloTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(232,236,255,0.5)');
    g.addColorStop(0.35, 'rgba(200,210,255,0.16)');
    g.addColorStop(1, 'rgba(200,210,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

const MOON_DIST = 90; // just inside the star sphere (radius 100)
const MOON_SIZE = 2.6;

/**
 * The Moon, placed at its real altitude/azimuth and lit by a directional light
 * coming from the Sun's true direction — so the illuminated fraction and the
 * orientation of the terminator are physically correct for the night in
 * question. Below the horizon it simply isn't drawn.
 */
export default function Moon({ moon, sun, onFocus }) {
  const halo = useHaloTexture();

  const { moonPos, sunPos } = useMemo(() => {
    const m = new THREE.Vector3(...moon.position).normalize().multiplyScalar(MOON_DIST);
    const s = new THREE.Vector3(...sun.position).normalize().multiplyScalar(100);
    return { moonPos: m, sunPos: s };
  }, [moon.position, sun.position]);

  if (!moon.visible) return null;

  const label = `${moon.phaseName} · ${Math.round(moon.illumination * 100)}% illuminated`;

  return (
    <group>
      {/* Light from the Sun's direction; only the Moon uses a lit material, so
          this directional light effectively lights the Moon alone. */}
      <directionalLight position={sunPos} intensity={2.4} color="#fff8ec" />

      <group position={moonPos}>
        {/* Halo — billboarded, additive, so bloom gives it a soft glow. */}
        <sprite scale={[MOON_SIZE * 4, MOON_SIZE * 4, 1]}>
          <spriteMaterial
            map={halo}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>

        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            onFocus?.({ name: 'Moon', fact: label, position: moonPos.toArray(), kind: 'hover' });
          }}
          onPointerOut={() => onFocus?.(null, 'hover')}
          onClick={(e) => {
            e.stopPropagation();
            onFocus?.({ name: 'Moon', fact: label, position: moonPos.toArray(), kind: 'pin' });
          }}
        >
          <sphereGeometry args={[MOON_SIZE, 48, 48]} />
          {/* Earthshine: a faint emissive lifts the dark limb off pure black. */}
          <meshStandardMaterial color="#d9ddf2" roughness={1} metalness={0} emissive="#10131f" />
        </mesh>
      </group>
    </group>
  );
}
