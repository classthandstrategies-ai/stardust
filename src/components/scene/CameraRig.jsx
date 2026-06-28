import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Ambient camera drift.
 *
 * The viewer sits at the centre of the dome. Left alone, the view rotates
 * slowly (OrbitControls' autoRotate, ~one turn over a few minutes) with a
 * barely-there vertical sway — something to watch, not operate. The moment the
 * user drags, drift stops; a few seconds after they let go, it eases back in.
 * Honours prefers-reduced-motion by holding still.
 */
export default function CameraRig({ controlsRef, reducedMotion }) {
  const interacting = useRef(false);
  const idle = useRef(99);

  useEffect(() => {
    const c = controlsRef.current;
    if (!c) return;
    const onStart = () => {
      interacting.current = true;
    };
    const onEnd = () => {
      interacting.current = false;
      idle.current = 0;
    };
    c.addEventListener('start', onStart);
    c.addEventListener('end', onEnd);
    return () => {
      c.removeEventListener('start', onStart);
      c.removeEventListener('end', onEnd);
    };
  }, [controlsRef]);

  useFrame((state, dt) => {
    const c = controlsRef.current;
    if (!c) return;

    if (interacting.current || reducedMotion) {
      c.autoRotate = false;
      idle.current = 0;
      return;
    }

    idle.current += dt;
    const drifting = idle.current > 2.5; // resume a beat after the user stops
    c.autoRotate = drifting;
    c.autoRotateSpeed = 0.3; // ~3–4 minutes per revolution

    if (drifting) {
      // Gentle vertical sway by nudging the look target a hair up and down.
      c.target.y = 0.015 * Math.sin(state.clock.elapsedTime * 0.05);
    }
  });

  return null;
}
