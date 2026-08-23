# Local overlay orchestrator

The orchestrator is the production-control layer between a daily project's external Visual Spec and the permanent Remotion engine.

The repository contains reusable rendering capabilities. Daily topics, transcripts, timings, concepts, visual types, parameters, and assets belong to the input project and are never baked into the engine.

## Input

Create one project folder per video containing a `visual-spec.json` that follows `schemas/visual-spec.schema.json`.

Each overlay supplies its own `visual_type` and `props`. The same engine can therefore receive a completely different topic and script tomorrow.

## Run

From the repository root:

```bash
python orchestrator/render.py path/to/visual-spec.json
```

Preview the queue without rendering:

```bash
python orchestrator/render.py path/to/visual-spec.json --dry-run
```

The queue validates timing, creates deterministic filenames containing exact timestamps, writes per-overlay render props, resumes completed renders, and produces a manifest.

## Architecture

```text
Daily project
  -> visual-spec.json
  -> Python orchestrator
  -> Remotion MedicalOverlay composition
  -> renderer registry
  -> organized overlay files + manifest
```

Add reusable renderer capabilities to `src/renderers/index.tsx`. Keep daily content in the project input.
