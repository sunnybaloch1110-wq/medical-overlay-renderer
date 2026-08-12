# Medical Overlay Renderer

A Remotion + React + TypeScript proof of concept for reusable medical-education visualization overlays.

## Proof of concept

`MedicalBloodFlow` renders an 8-second, silent 1920×1080 visualization of blood moving through an artery with a narrowed section. The artery, blood particles, highlight ring, labels, and callouts are generated from code. No external copyrighted visual or audio assets are required.

## Architecture

- `src/config/video.ts` contains output dimensions, FPS, duration, and shared visual constants.
- `src/components/BloodFlowOverlay.tsx` contains the reusable visual scene.
- `src/Root.tsx` defines the Remotion composition and binds the scene to render settings.
- `src/index.ts` is the Remotion entry point.
- `remotion.config.ts` contains renderer-level defaults.

The visual component is kept independent of composition registration so additional medical scenes can reuse the same rendering setup.

## Install

```bash
npm install
```

## Run Remotion Studio

```bash
npm run start
```

## Render the proof of concept

```bash
npm run render
```

Equivalent direct Remotion command:

```bash
npx remotion render src/index.ts MedicalBloodFlow out/medical-blood-flow.mp4
```

## Configuration

Output: 1920×1080

Frame rate: 30 FPS

Duration: 240 frames / 8 seconds

Audio: none

Composition ID: `MedicalBloodFlow`

## Design notes

The scene uses SVG and procedural animation for the artery and blood-flow particles. The narrowed region is highlighted with an animated gold outline and a compact explanatory callout. The scene is intended as an overlay-style medical visualization that can later be composited with presenter footage, narration, diagrams, or other educational layers.
