/**
 * datetime.js — civil birth time → a precise UTC instant.
 *
 * The astronomy pipeline (see sky.js / KNOWLEDGE.md) needs a single UTC `Date`.
 * Getting there correctly means honouring the *local* civil time at the birth
 * place, including the historical DST rules for that zone. Luxon does this via
 * the host IANA tz database; for manual lat/long entry (no city → no IANA zone)
 * we fall back to a fixed UTC offset the user supplies.
 */

import { DateTime } from 'luxon';

/**
 * A reasonable default UTC offset (whole hours) for a longitude, used to seed
 * the manual-entry offset field. Real political offsets vary, so this is only a
 * starting guess the user can correct.
 */
export function offsetFromLongitude(longitudeDeg) {
  return Math.max(-12, Math.min(14, Math.round(longitudeDeg / 15)));
}

/** Format a numeric UTC offset (hours, may be fractional) as `UTC+5:30`. */
export function formatOffset(offsetHours) {
  const sign = offsetHours < 0 ? '-' : '+';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

/**
 * Build a UTC instant from civil inputs.
 *
 * @param {Object} opts
 * @param {string} opts.date        `YYYY-MM-DD` (required).
 * @param {string} [opts.time]      `HH:mm`; if absent, defaults to noon and the
 *                                  result is flagged approximate.
 * @param {string} [opts.zone]      IANA zone (e.g. `Europe/London`) for city mode.
 * @param {number} [opts.offset]    UTC offset in hours for manual mode (used when
 *                                  no `zone` is given).
 * @returns {{ date: Date, approximate: boolean }}
 */
export function toUTCInstant({ date, time, zone, offset = 0 }) {
  const [year, month, day] = date.split('-').map(Number);
  const approximate = !time;
  const [hour, minute] = (time || '12:00').split(':').map(Number);

  const z = zone || formatOffset(offset);
  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: z });

  if (!dt.isValid) {
    throw new Error(`Invalid date/time: ${dt.invalidReason} — ${dt.invalidExplanation}`);
  }

  return { date: dt.toUTC().toJSDate(), approximate };
}

/** Human-readable date label, e.g. "1 January 2000". */
export function formatDateLabel(date) {
  const [year, month, day] = date.split('-').map(Number);
  return DateTime.fromObject({ year, month, day }).toFormat('d LLLL yyyy');
}

/** Human-readable time label, or an explicit "(time unknown)" note. */
export function formatTimeLabel(time) {
  if (!time) return 'time unknown';
  return DateTime.fromFormat(time, 'HH:mm').toFormat('h:mm a').toLowerCase();
}
