# Medical Overlay Renderer

A generic Remotion + React + TypeScript rendering engine for externally supplied, timestamped visual specifications.

The repository is the permanent execution system. A video's topic, title, script, transcript, timing, visual reasoning, scene design, text, geometry, assets, and animation instructions are supplied as external project input.

## Architecture

```text
external transcript + timing + visual specification
                         ↓
                 Python orchestrator
                         ↓
              timeline validation
                         ↓
                 Remotion renderer
                         ↓
              timestamped overlays
                         ↓
             manifest + render state
```

The renderer is content-agnostic. It does not select a medical concept or prescribe a visual template. The external Visual Spec describes the scene using generic primitives and animation parameters.

## Local setup

```bash
npm install
npm run start
```

Validate and render a Visual Spec:

```bash
python orchestrator/render.py examples/visual-spec.sample.json --project-dir example-output
```

Dry-run the queue:

```bash
python orchestrator/render.py examples/visual-spec.sample.json --dry-run
```

## Output

Each project receives timestamped overlay files, render properties, a manifest, and resumable render state. Example:

```text
V001__00m00s000-00m04s000__example-scene.mp4
```

The render state allows completed overlays to be skipped when a later run resumes.

## GitHub Actions

The manual workflow accepts an external Visual Spec path and renders it with the same generic engine used locally.

## Design principle

The engine remains stable while each video supplies fresh creative input. Reusable rendering primitives provide execution capability; they do not determine what the video should depict.
