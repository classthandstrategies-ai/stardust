import { useMemo } from 'react';
import * as THREE from 'three';

const PLANET_DIST = 94;

/** A reusable soft white radial sprite, tinted per-planet via material color. */
function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

/** Apparent size from magnitude — brighter planets read larger. */
function planetSize(mag) {
  return THREE.MathUtils.clamp(1.7 - mag * 0.32, 0.7, 3.0);
}

function Planet({ planet, glow, onFocus }) {
  const pos = useMemo(
    () => new THREE.Vector3(...planet.position).normalize().multiplyScalar(PLANET_DIST),
    [planet.position]
  );
  const size = planetSize(planet.magnitude);
  const label = `${planet.fact}`;

  return (
    <group position={pos}>
      <sprite scale={[size * 7, size * 7, 1]}>
        <spriteMaterial
          map={glow}
          color={planet.color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          onFocus?.({ name: planet.name, fact: label, position: pos.toArray(), kind: 'hover' });
        }}
        onPointerOut={() => onFocus?.(null, 'hover')}
        onClick={(e) => {
          e.stopPropagation();
          onFocus?.({ name: planet.name, fact: label, position: pos.toArray(), kind: 'pin' });
        }}
      >
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial color={planet.color} toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Visible naked-eye planets, each placed at its real altitude/azimuth, sized by
 * apparent magnitude and colour-hinted (Mars warm, Venus bright, Jupiter pale).
 */
export default function Planets({ planets, onFocus }) {
  const glow = useGlowTexture();
  const visible = planets.filter((p) => p.visible && p.nakedEye);
  return (
    <group>
      {visible.map((p) => (
        <Planet key={p.name} planet={p} glow={glow} onFocus={onFocus} />
      ))}
    </group>
  );
}
