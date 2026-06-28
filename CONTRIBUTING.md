# Contributing to Stardust

Thanks for your interest — issues, fixes, and ideas are all welcome. Stardust
aims to be **accurate first and beautiful throughout**; please keep that spirit,
and keep the sky calm.

## Ground rules

- Be kind and constructive.
- Accuracy is non-negotiable: changes to the astronomy must keep
  `npm run verify` green (see [`KNOWLEDGE.md`](KNOWLEDGE.md) for the reference
  cases and tolerances).
- Stay within the design language in [`DESIGN.md`](DESIGN.md) for any UI change —
  one action colour (Plum Voltage), hairline panels, 24px pills, no shadows.

## Getting set up

```bash
git clone https://github.com/OWNER/stardust.git
cd stardust
npm install
npm run dev
```

You need **Node ≥ 18** and a WebGL2-capable browser. No API keys are required.

## Before you open a PR

Run the full local check — CI runs the same steps:

```bash
npm run verify        # astronomy checks must pass
npm run lint          # ESLint must be clean
npm run format:check  # Prettier formatting
npm run build         # production build must succeed
```

`npm run format` will auto-fix formatting.

## Filing issues

Please include:

- What you expected vs. what happened.
- For sky-accuracy reports: the exact **date, time, and location** used, and
  ideally an independent reference (an almanac or planetarium app) to compare
  against.
- Browser/OS and whether WebGL2 is available.

## Branching & PRs

- Branch from `main` using a short descriptive name, e.g. `fix/moon-terminator`
  or `feat/share-link`.
- Keep PRs focused; describe the change and how you verified it.
- Reference any related issue.

## Regenerating the star data

The bundled datasets in `src/data/` are generated and committed. If you need to
rebuild them:

```bash
npm run build:data
```

This is a one-off, offline-friendly step — the app itself needs no network at
build or run time.

Thank you for helping keep the night sky honest. ✦
