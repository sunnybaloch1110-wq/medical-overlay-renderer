#!/usr/bin/env python3
"""Resumable renderer for external, timestamped Remotion visual specifications."""
from __future__ import annotations
import argparse, json, re, subprocess, sys, time
from pathlib import Path

FPS_DEFAULT, WIDTH_DEFAULT, HEIGHT_DEFAULT = 30, 1920, 1080
COMPOSITION = "MedicalOverlay"
SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")

def load_spec(path: Path) -> dict:
    try: data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc: raise SystemExit(f"Cannot read visual spec: {exc}")
    if not isinstance(data, dict) or not isinstance(data.get("overlays"), list):
        raise SystemExit("visual-spec.json must contain an 'overlays' array")
    return data

def timestamp(seconds: float) -> str:
    ms = round(seconds * 1000); minutes, ms = divmod(ms, 60000); secs, ms = divmod(ms, 1000)
    return f"{minutes:02d}m{secs:02d}s{ms:03d}"

def slug(text: str) -> str:
    return SAFE_NAME.sub("-", text.strip().lower()).strip("-")[:80] or "visual"

def validate(spec: dict) -> list[str]:
    errors, previous_end, seen_ids = [], None, set()
    for index, item in enumerate(spec["overlays"], 1):
        oid, start, end = item.get("id"), item.get("start"), item.get("end")
        if not isinstance(oid, str) or not oid: errors.append(f"overlay {index}: missing id")
        elif oid in seen_ids: errors.append(f"{oid}: duplicate id")
        else: seen_ids.add(oid)
        if not isinstance(start, (int, float)) or not isinstance(end, (int, float)):
            errors.append(f"{oid or index}: start/end must be numbers"); continue
        if start < 0: errors.append(f"{oid}: start is negative")
        if end <= start: errors.append(f"{oid}: end must be greater than start")
        if previous_end is not None and start < previous_end - 1e-6: errors.append(f"{oid}: overlaps previous overlay at {start:.3f}s")
        previous_end = end
        if not isinstance(item.get("concept"), str) or not item["concept"].strip(): errors.append(f"{oid}: missing concept")
        if not isinstance(item.get("scene"), dict) or not isinstance(item["scene"].get("elements"), list): errors.append(f"{oid}: missing scene.elements")
    return errors

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("visual_spec", type=Path); parser.add_argument("--project-dir", type=Path)
    parser.add_argument("--dry-run", action="store_true"); parser.add_argument("--concurrency", type=int, default=1)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]; spec_path = args.visual_spec.resolve(); project_dir = (args.project_dir or spec_path.parent).resolve()
    spec = load_spec(spec_path); errors = validate(spec)
    if errors:
        print("TIMELINE VALIDATION FAILED"); [print(f"  - {e}") for e in errors]; return 2
    fps, width, height = float(spec.get("fps", FPS_DEFAULT)), int(spec.get("width", WIDTH_DEFAULT)), int(spec.get("height", HEIGHT_DEFAULT))
    overlays_dir, props_dir, report_dir = project_dir / "overlays", project_dir / "render-props", project_dir / "reports"
    for directory in (overlays_dir, props_dir, report_dir): directory.mkdir(parents=True, exist_ok=True)
    state_path, manifest_path = report_dir / "render-state.json", project_dir / "manifest.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}; manifest = []
    for item in spec["overlays"]:
        oid, start, end = item["id"], float(item["start"]), float(item["end"]); duration = end - start
        filename = f"{oid}__{timestamp(start)}-{timestamp(end)}__{slug(item['concept'])}.mp4"; output = overlays_dir / filename; props_path = props_dir / f"{oid}.json"
        props = {"durationInSeconds": duration, "id": oid, "concept": item["concept"], "transcript": item.get("transcript", ""), "scene": item["scene"]}
        props_path.write_text(json.dumps(props, indent=2, ensure_ascii=False), encoding="utf-8")
        record = {"id": oid, "start": start, "end": end, "duration": duration, "concept": item["concept"], "transcript": item.get("transcript", ""), "file": str(output.relative_to(project_dir)), "status": "pending"}
        if output.exists() and state.get(oid, {}).get("status") == "completed": record["status"] = "completed"; manifest.append(record); continue
        if args.dry_run: record["status"] = "queued"; manifest.append(record); continue
        command = ["npx", "remotion", "render", "src/index.ts", COMPOSITION, str(output), "--props", str(props_path), "--concurrency", str(max(1, args.concurrency))]
        print(f"[{oid}] {start:.3f}s → {end:.3f}s | {duration:.3f}s | {slug(item['concept'])}"); state[oid] = {"status": "rendering", "output": str(output), "started_at": time.time()}; state_path.write_text(json.dumps(state, indent=2), encoding="utf-8")
        started = time.perf_counter()
        try: subprocess.run(command, cwd=repo, check=True)
        except subprocess.CalledProcessError as exc: record["status"] = "failed"; record["error"] = f"Remotion exited with code {exc.returncode}"; state[oid] = {"status": "failed", "output": str(output), "exit_code": exc.returncode}
        else: elapsed = time.perf_counter() - started; record["status"] = "completed"; record["render_seconds"] = round(elapsed, 3); state[oid] = {"status": "completed", "output": str(output), "render_seconds": round(elapsed, 3)}
        state_path.write_text(json.dumps(state, indent=2), encoding="utf-8"); manifest.append(record)
    manifest_path.write_text(json.dumps({"video_id": spec.get("video_id", project_dir.name), "fps": fps, "width": width, "height": height, "overlays": manifest}, indent=2, ensure_ascii=False), encoding="utf-8")
    completed, failed = sum(x["status"] == "completed" for x in manifest), sum(x["status"] == "failed" for x in manifest)
    print(f"DONE: {completed} completed, {failed} failed"); return 1 if failed else 0
if __name__ == "__main__": sys.exit(main())
