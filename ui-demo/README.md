# STAIJA Tier 2 UI demo

The screen-by-screen walkthrough: 45s, 1920×1080@30fps, composition id
`StaijaUIDemo`. Split out on 2026-07-19 from a combined project that used to
also hold the Tier 3 trailer, which now lives at `../trailer/`. Beat structure
is in `STORYBOARD.md`.

## Build

```console
npm i
```

## Preview and render

```console
npm run dev
npm run render
```

The render lands at `out/staija-ui-demo.mp4` (gitignored). The pre-split final
render was backed up to `~/Documents/staija-tier2-ui-demo-BACKUP.mp4` before
this project was split out.

## Music

`public/audio.mp3` is Kevin MacLeod's "Wholesome" (CC BY 4.0) — the credit
line in `public/CREDITS.md` must ship with any publish. It's a separate trim
of the same source track used by the Tier 3 trailer
(`../trailer/scratch/wholesome.mp3`).
