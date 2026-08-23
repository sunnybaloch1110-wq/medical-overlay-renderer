# Local overlay orchestrator

The orchestrator is the production-control layer between a timestamped Visual Spec and Remotion.

It validates timing, creates deterministic overlay filenames, renders overlays one at a time, records state, and writes a manifest. It is intentionally resumable: completed overlays are skipped on the next run.

## Input

Create a project folder containing `visual-spec.json` using `schemas/visual-spec.schema.json`.

## Run

From the repository root:

```bash
python orchestrator/render.py path/to/visual-spec.json
```

Optional:

```bash
python orchestrator/render.py path/to/visual-spec.json --project-dir path/to/project --dry-run
```

The renderer command is currently configured for the existing `MedicalBloodFlow` composition. The next renderer step will make the composition dynamic by renderer name and props.
