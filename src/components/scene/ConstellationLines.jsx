import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Constellation figures — thin, faint line segments connecting the real star
 * patterns. Drawn deliberately quiet (low opacity bone) so they read as the
 * sky's skeleton, never its subject (see DESIGN.md).
 */
export default function ConstellationLines({ lines }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(lines, 3));
    return geo;
  }, [lines]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      {/* Bone (white) at very low alpha — violet is reserved for the action
          colour and is kept out of the starfield (see DESIGN.md). */}
      <lineBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
    </lineSegments>
  );
}
