/**
 * InfoPanel — the quiet corner plaque on a generated sky.
 *
 * States the exact instant and place the sky was computed for, a one-line
 * factual summary of what was notable, and (when the birth time was unknown) an
 * honest "approximate" note. Floats as a hairline panel; never competes with
 * the star field.
 */
export default function InfoPanel({ place, dateLabel, timeLabel, summary, approximate }) {
  return (
    <div className="panel" style={{ width: 'min(86vw, 360px)', padding: 18 }}>
      <div className="eyebrow text-smoke" style={{ marginBottom: 8 }}>
        Your sky
      </div>
      <div className="text-bone" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>
        {place}
      </div>
      <div className="text-ash" style={{ fontSize: 14, marginTop: 4 }}>
        {dateLabel} · {timeLabel}
      </div>
      <div
        className="text-smoke"
        style={{
          fontSize: 13,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid color-mix(in srgb, var(--color-bone) 12%, transparent)',
          lineHeight: 1.45,
        }}
      >
        {summary}
      </div>
      {approximate && (
        <div className="text-smoke" style={{ fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>
          No exact time given — shown as a typical evening (10pm), so the sky’s orientation is
          approximate.
        </div>
      )}
    </div>
  );
}
