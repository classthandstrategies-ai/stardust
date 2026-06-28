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
      <lineBasicMaterial color="#aeb8e8" transparent opacity={0.14} depthWrite={false} />
    </lineSegments>
  );
}
