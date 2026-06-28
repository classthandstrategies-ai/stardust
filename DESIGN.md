# Stardust — Design Direction

> Particle cosmos on a void — the night sky as the only light.

Stardust follows the **"Particle cosmos on a void"** design system bundled with
this repo (`theme.css`, `variables.css`, `tokens.json`). That system already
describes exactly the world Stardust wants to live in: a pure black canvas, a
single saturated violet as the only authority colour, white type glowing against
the void, hairline borders, full-pill controls, and **no shadows, gradients, or
elevation** — depth comes from contrast and the particle field itself.

This document maps that token system onto Stardust's specific surfaces. The
tokens are the source of truth; when in doubt, defer to `tokens.json`.

---

## Mood

A planetarium at 2 a.m. rendered in the cosmos design language: an infinite black
field, thousands of glowing star particles clustering into real constellations, a
violet pulse reserved for the one thing you can act on. Calm, vast, slow. The sky
owns the screen; the UI is a quiet guest floating on the void.

## Colour (from tokens)

| Token                  | Value     | Use in Stardust                                             |
| ---------------------- | --------- | ----------------------------------------------------------- |
| `--color-void`         | `#000000` | The sky background and every surface. Pure black.           |
| `--color-bone`         | `#ffffff` | Brightest stars, primary text, the Moon, hairlines.         |
| `--color-ash`          | `#bdbdbd` | Secondary text, mid-bright stars.                           |
| `--color-smoke`        | `#9a9a9a` | Tertiary text, resting nav/labels, faint stars.             |
| `--color-plum-voltage` | `#8052ff` | The single action colour: primary CTA, focus, active state. |
| `--color-amber-spark`  | `#ffb829` | Warm-planet hint (Mars), outlined accents — never a CTA.    |
| `--color-lichen`       | `#15846e` | Constellation node / decorative accent only.                |

Star tints stay close to **bone**, nudged subtly cool/warm by spectral colour
index so the field reads as starlight, not confetti. Planets get the lightest of
colour hints (Venus → bone-white, Mars → amber-spark, Jupiter → pale). Violet is
**only** ever an interactive signal — it is never sprinkled into the starfield.

## Typography (from tokens)

- One typeface. The system names **Acronym**; its sanctioned substitute is
  **Inter** (used here), loaded across weights **200 / 400 / 600 / 700**.
- Weight **200** carries display/hero headlines — extreme thinness at 78–113px is
  the signature "etched in light" look (the landing title "Stardust").
- Weight **600–700** for nav, buttons, eyebrow kickers (uppercase, `+0.05em`).
- Weight **400** for body at 15–18px with slight positive tracking for legibility
  on black.
- Negative tracking (`-0.04em`) only at ≥48px; positive tracking at body and
  below. Type scale, line-heights, and tracking come straight from the tokens.

## Layout & chrome

- **Full-bleed black canvas.** The R3F sky fills the viewport edge to edge. No
  nested containers, no panels with fills heavier than a hairline.
- UI floats as a few translucent elements outlined with **1px bone at ~10–12%
  alpha**, corners at **24px radius** (the system's only radius). Pills for every
  interactive element.
- Landing: a centred text block — eyebrow kicker, thin display title, one line of
  body, and the single violet CTA — with the particle/star field behind it,
  owning ≥50% of the visual.
- Generated state: the form recedes; only a small info block (corner) and a
  couple of pill actions (Save, Edit) remain.
- **No shadows, no gradients, no elevation** on UI. Section rhythm via the 6px
  spacing scale (6/12/18/24/30/36/60…).

## Motion

- **Ambient drift:** continuous slow azimuthal rotation (~one turn over several
  minutes) plus a gentle altitude sway, eased so it never starts or stops
  abruptly.
- **Interaction yields:** dragging pauses the drift; after a few still seconds it
  eases back in.
- **Transitions:** fades/eases 300–800 ms. No bounces, no spins.
- Stars twinkle _very_ subtly. All motion respects `prefers-reduced-motion`
  (drift slows to near-still, twinkle off).

## The star field specifics

- Stars are the particle constellation the design system is built around —
  thousands of small glowing points, sized by **real apparent magnitude** on a
  perceptual curve; the few brightest clearly larger.
- Constellation lines are **thin and faint** (bone at very low alpha) — the
  skeleton, never the subject.
- The Moon shows its real phase terminator with a soft bone halo. Planets are
  slightly larger glowing points with the faintest colour hint.

## Reconciling "no glow" with a star field

The design system forbids glows/shadows **on UI surfaces** — that rule is kept
absolutely: every panel, button, and border is flat. The WebGL sky is the
exception by definition: starlight _is_ glow. Bloom is applied only to the
celestial bodies (a subtle additive bloom that makes genuinely bright stars and
planets bleed light, exactly as the design language's "particle cosmos" intends)
— never to chrome, text, or panels.

## Save / share image

The exported PNG keeps the language: full-bleed black star field with a small,
elegant caption block — place, date, one line of sky fact — in Inter, lower
corner, hairline-separated. A print, not a screenshot.

## Do / Don't (inherited)

**Do** keep Plum Voltage as the only filled action colour; set the title at
weight 200; use 24px pills everywhere; let the star field own the screen; let the
void breathe.

**Don't** add a second chromatic button; add UI shadows/gradients/elevation; put
violet into the starfield as decoration; set body type below 15px or with
negative tracking; use any radius below 24px on interactive elements.
