# Medical Overlay Renderer

A Remotion + React + TypeScript system for generating reusable, topic-independent visual overlays from structured scene data.

## Existing proof of concept

`MedicalBloodFlow` remains unchanged. It renders the validated 8-second, silent 1920×1080 medical overlay.

## Universal production architecture

The repository now has two layers:

- The existing `MedicalBloodFlow` POC remains a fixed legacy composition.
- `UniversalVisual` is a data-driven composition for arbitrary visual concepts.

The universal layer contains:

- `src/universal/scene.ts`: scene and batch manifest types. Topic meaning lives in data, not renderer code.
- `src/universal/validation.ts`: structural validation for scene IDs, objects, relationships, and durations.
- `src/universal/primitives.tsx`: reusable object and label primitives.
- `src/universal/mechanisms.tsx`: reusable visual behaviors such as flow, highlighting, measurement, comparison, sequence, progression, transformation, before/after, cause/effect, interaction, movement, and layers.
- `src/universal/UniversalScene.tsx`: generic scene composition that maps scene data into primitives and mechanisms.
- `schemas/scene.schema.json`: machine-readable scene contract.
- `manifests/batch-template.json`: empty starting manifest for a new long-form video.
- `scripts/render-batch.mjs`: deterministic batch renderer and output-manifest writer.

The renderer does not contain disease names, medical taxonomy, senior-health logic, anatomy-specific assumptions, or niche-specific scene components. Those concepts belong in the scene data supplied to `UniversalVisual`.

## Scene model

A scene contains `objects`, optional `relationships`, optional `mechanisms`, labels, timing, and arbitrary metadata. Objects can express position, size, shape, style, state, quantity, and movement. Relationships connect object IDs. Mechanisms add time-dependent visual behavior around those entities.

This gives new scene concepts a data-first path. A new behavior that is genuinely absent from the mechanism library is added once as a reusable mechanism. Individual topics then remain data-only.

## Batch rendering

Prepare one JSON manifest containing as many scenes as the video needs, typically 20–60 for a long-form production.

Example command:

```bash
npm run render:batch -- manifests/my-video.json
```

For each scene the batch runner:

1. validates scene identity at the manifest boundary;
2. writes deterministic props data;
3. renders `UniversalVisual` to `out/scenes/<videoId>/<sceneId>.mp4`;
4. records status and metadata in `out/batch-manifest.json`.

A successful output manifest maps each scene to its scene ID, source concept, duration, output filename, scene type, mechanism list, and rendering status.

The current GitHub Actions workflow is intentionally unchanged. Batch orchestration is local/runner-ready foundation work and is not yet wired into CI.

## Render commands

Existing POC:

```bash
npm run render
```

Universal batch:

```bash
npm run render:batch -- manifests/my-video.json
```

## Composition compatibility

`MedicalBloodFlow` retains its existing ID and implementation. `UniversalVisual` is a separate composition with the same 1920×1080 canvas and 30 FPS default. Its duration is calculated from each scene's `durationSeconds` input at render time.
