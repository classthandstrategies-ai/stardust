import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Interactive hit-targets for the brightest named stars.
 *
 * The star field itself is a single GPU point cloud — its points aren't
 * individually pickable. So for the handful of famous, naked-eye-bright stars
 * that were above the horizon (Sirius, Vega, Arcturus…) we drop an invisible
 * sphere at each one's dome position, wired to the same hover/click focus the
 * Moon and planets use. The points stay the visible stars; these are just the
 * (transparent) targets that let you name them.
 */
function StarTarget({ star, onFocus }) {
  const pos = useMemo(() => new THREE.Vector3(...star.position), [star.position]);

  return (
    <mesh
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        onFocus?.({ name: star.name, fact: star.fact, position: star.position, kind: 'hover' });
      }}
      onPointerOut={() => onFocus?.(null, 'hover')}
      onClick={(e) => {
        e.stopPropagation();
        onFocus?.({ name: star.name, fact: star.fact, position: star.position, kind: 'pin' });
      }}
    >
      {/* A few degrees wide at the dome radius — comfortable to hover, invisible. */}
      <sphereGeometry args={[2.4, 12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function StarLabels({ stars, onFocus }) {
  const named = stars.named || [];
  return (
    <group>
      {named.map((s) => (
        <StarTarget key={s.name} star={s} onFocus={onFocus} />
      ))}
    </group>
  );
}
