import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// The 3D scene pulls in Three.js and the R3F stack — by far the heaviest part of
// the bundle. Lazy-load it so the landing hero + form paint immediately while
// WebGL streams in behind the scrim.
const SkyScene = lazy(() => import('./components/scene/SkyScene.jsx'));
import InputForm from './components/ui/InputForm.jsx';
import InfoPanel from './components/ui/InfoPanel.jsx';
import SkyActions from './components/ui/SkyActions.jsx';

import { buildSky } from './astronomy/sky.js';
import { toUTCInstant, formatDateLabel, formatTimeLabel } from './lib/datetime.js';
import { saveSkyImage } from './lib/exportImage.js';

import starData from './data/stars.json';
import constellationData from './data/constellations.json';

const STARS = starData.stars;
const CONSTELLATIONS = constellationData.constellations;

// A real sky used as the landing backdrop: Royal Observatory, Greenwich at the
// stroke of the millennium (the reference case in KNOWLEDGE.md).
const DEMO = {
  date: new Date(Date.UTC(2000, 0, 1, 0, 0, 0)),
  latitude: 51.4779,
  longitude: -0.0015,
};

/** Track the user's reduced-motion preference, live. */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const glRef = useRef(null);

  const demoSky = useMemo(
    () =>
      buildSky({
        ...DEMO,
        starRecords: STARS,
        constellations: CONSTELLATIONS,
      }),
    []
  );

  // `generated` flips the UI from landing (form) to the immersive sky.
  const [generated, setGenerated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [sky, setSky] = useState(demoSky);
  const [meta, setMeta] = useState(null);
  const [formValues, setFormValues] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = useCallback((input) => {
    const { date: instant, approximate } = toUTCInstant({
      date: input.date,
      time: input.time,
      zone: input.zone,
      offset: input.offset,
    });

    const nextSky = buildSky({
      date: instant,
      latitude: input.latitude,
      longitude: input.longitude,
      starRecords: STARS,
      constellations: CONSTELLATIONS,
    });

    setSky(nextSky);
    setMeta({
      place: input.locationLabel,
      dateLabel: formatDateLabel(input.date),
      timeLabel: formatTimeLabel(input.time),
      summary: nextSky.summary,
      approximate,
    });
    setFormValues(input.values);
    setGenerated(true);
    setEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!glRef.current || !meta) return;
    setSaving(true);
    // Defer so the "Saving…" label paints before the (sync) canvas read.
    requestAnimationFrame(() => {
      try {
        saveSkyImage(
          glRef.current,
          {
            place: meta.place,
            when: `${meta.dateLabel} · ${meta.timeLabel}`,
            fact: meta.summary,
          },
          'stardust-sky.png'
        );
      } finally {
        setSaving(false);
      }
    });
  }, [meta]);

  const showForm = !generated || editing;

  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      {/* The sky is always present, full-bleed. It is the demo sky until the
          viewer reveals their own. Lazy — falls back to the void until loaded. */}
      <Suspense fallback={null}>
        <SkyScene sky={sky} reducedMotion={reducedMotion} onReady={(el) => (glRef.current = el)} />
      </Suspense>

      {/* Landing / edit overlay */}
      {showForm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          {/* Scrim so the form reads against the star field. */}
          <div
            className="absolute inset-0"
            style={{ background: 'color-mix(in srgb, var(--color-void) 62%, transparent)' }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-8 px-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="eyebrow text-smoke">Your sky, the moment you arrived</span>
              <h1
                className="text-bone"
                style={{
                  fontWeight: 200,
                  fontSize: 'clamp(56px, 12vw, 113px)',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.95,
                }}
              >
                Stardust
              </h1>
              <p className="text-ash" style={{ fontSize: 16, maxWidth: 440, lineHeight: 1.5 }}>
                The real night sky — every star, planet, and the Moon — exactly as it stood above
                the place and instant you were born.
              </p>
            </div>

            <div className="flex justify-center">
              <InputForm
                initialValues={formValues}
                onSubmit={handleGenerate}
                onCancel={editing ? () => setEditing(false) : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generated-state chrome: corner info + actions */}
      {generated && !editing && meta && (
        <>
          <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8">
            <InfoPanel {...meta} />
          </div>
          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-8">
            <SkyActions onSave={handleSave} onEdit={() => setEditing(true)} saving={saving} />
          </div>
        </>
      )}
    </div>
  );
}
