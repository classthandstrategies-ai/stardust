import { useEffect, useState } from 'react';
import { searchPlaces } from '../../lib/geocode.js';
import { offsetFromLongitude } from '../../lib/datetime.js';

/**
 * The one input surface. Date is required; time is optional (noon, flagged
 * approximate, if blank). Location is either a free Open-Meteo city search or
 * manual lat/long with a UTC offset — so the app works fully offline too.
 *
 * On submit, hands the parent a normalised descriptor:
 *   { date, time, latitude, longitude, zone?, offset, locationLabel, values }
 * where `values` is the raw form state so an "Edit" can re-seed this form.
 */
export default function InputForm({ initialValues, onSubmit, onCancel }) {
  const [values, setValues] = useState(
    initialValues || {
      date: '',
      time: '',
      mode: 'city', // 'city' | 'manual'
      place: null, // selected { label, latitude, longitude, timezone }
      query: '',
      lat: '',
      lon: '',
      offset: '0',
    }
  );

  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const set = (patch) => setValues((v) => ({ ...v, ...patch }));

  // Debounced city search. Cancels the previous request when the query changes.
  useEffect(() => {
    if (values.mode !== 'city') return;
    const q = values.query.trim();
    if (q.length < 2 || (values.place && values.place.label === q)) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        setResults(await searchPlaces(q, ctrl.signal));
        setError('');
      } catch (e) {
        if (e.name !== 'AbortError') setError('Search unavailable — try manual entry.');
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [values.query, values.mode, values.place]);

  const pickPlace = (place) => {
    set({ place, query: place.label });
    setResults([]);
  };

  const ready =
    values.date &&
    (values.mode === 'city' ? !!values.place : values.lat !== '' && values.lon !== '');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    try {
      if (values.mode === 'city') {
        const p = values.place;
        onSubmit({
          date: values.date,
          time: values.time,
          latitude: p.latitude,
          longitude: p.longitude,
          zone: p.timezone,
          offset: offsetFromLongitude(p.longitude),
          locationLabel: p.label,
          values,
        });
      } else {
        const lat = Number(values.lat);
        const lon = Number(values.lon);
        if (!Number.isFinite(lat) || lat < -90 || lat > 90)
          throw new Error('Latitude must be between −90 and 90.');
        if (!Number.isFinite(lon) || lon < -180 || lon > 180)
          throw new Error('Longitude must be between −180 and 180.');
        const offset = Number(values.offset) || 0;
        onSubmit({
          date: values.date,
          time: values.time,
          latitude: lat,
          longitude: lon,
          offset,
          locationLabel: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
          values,
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" style={{ width: 'min(92vw, 440px)' }}>
      <div className="flex flex-col gap-6 sm:flex-row">
        <label className="flex flex-1 flex-col gap-2">
          <span className="eyebrow text-smoke">Birth date</span>
          <input
            type="date"
            className="field"
            value={values.date}
            max="9999-12-31"
            onChange={(e) => set({ date: e.target.value })}
            required
          />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="eyebrow text-smoke">Birth time · optional</span>
          <input
            type="time"
            className="field"
            value={values.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </label>
      </div>

      {/* Location mode toggle */}
      <div className="flex items-center gap-3">
        <ModeTab active={values.mode === 'city'} onClick={() => set({ mode: 'city' })}>
          City
        </ModeTab>
        <ModeTab active={values.mode === 'manual'} onClick={() => set({ mode: 'manual' })}>
          Lat / Long
        </ModeTab>
      </div>

      {values.mode === 'city' ? (
        <div className="relative flex flex-col gap-2">
          <span className="eyebrow text-smoke">Birth place</span>
          <input
            type="text"
            className="field"
            placeholder="Search a city…"
            value={values.query}
            autoComplete="off"
            onChange={(e) => set({ query: e.target.value, place: null })}
          />
          {searching && (
            <span className="text-smoke" style={{ fontSize: 12 }}>
              Searching…
            </span>
          )}
          {results.length > 0 && (
            <ul className="panel absolute left-0 right-0 top-full z-10 mt-2 max-h-56 overflow-auto py-2">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => pickPlace(r)}
                    className="block w-full px-4 py-2 text-left text-ash hover:text-bone"
                    style={{ fontSize: 14 }}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {values.place && (
            <span className="text-smoke" style={{ fontSize: 12 }}>
              {values.place.latitude.toFixed(2)}°, {values.place.longitude.toFixed(2)}° ·{' '}
              {values.place.timezone}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex gap-6">
            <label className="flex flex-1 flex-col gap-2">
              <span className="eyebrow text-smoke">Latitude</span>
              <input
                type="number"
                step="any"
                className="field"
                placeholder="51.48"
                value={values.lat}
                onChange={(e) => {
                  const lon = values.lon;
                  set({
                    lat: e.target.value,
                    offset: lon !== '' ? String(offsetFromLongitude(Number(lon))) : values.offset,
                  });
                }}
              />
            </label>
            <label className="flex flex-1 flex-col gap-2">
              <span className="eyebrow text-smoke">Longitude</span>
              <input
                type="number"
                step="any"
                className="field"
                placeholder="-0.00"
                value={values.lon}
                onChange={(e) =>
                  set({
                    lon: e.target.value,
                    offset:
                      e.target.value !== ''
                        ? String(offsetFromLongitude(Number(e.target.value)))
                        : values.offset,
                  })
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="eyebrow text-smoke">UTC offset · hours</span>
            <input
              type="number"
              step="any"
              className="field"
              value={values.offset}
              onChange={(e) => set({ offset: e.target.value })}
            />
            <span className="text-smoke" style={{ fontSize: 12 }}>
              Estimated from longitude — adjust for the local time zone if known.
            </span>
          </label>
        </div>
      )}

      {error && (
        <p className="text-amber-spark" style={{ fontSize: 13 }} role="alert">
          {error}
        </p>
      )}

      <div className="mt-2 flex items-center gap-4">
        <button type="submit" className="btn-primary" disabled={!ready}>
          Reveal the sky
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function ModeTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="eyebrow"
      style={{
        color: active ? 'var(--color-bone)' : 'var(--color-smoke)',
        borderBottom: active ? '1px solid var(--color-plum-voltage)' : '1px solid transparent',
        paddingBottom: 4,
        transition: 'color 200ms ease, border-color 200ms ease',
      }}
    >
      {children}
    </button>
  );
}
