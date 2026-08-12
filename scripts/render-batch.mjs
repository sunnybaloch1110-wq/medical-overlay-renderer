import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: npm run render:batch -- <manifest.json>');

const manifest = JSON.parse(fs.readFileSync(path.resolve(repoRoot, inputPath), 'utf8'));
if (manifest.schemaVersion !== 1) throw new Error('Unsupported batch schemaVersion.');
if (!manifest.videoId) throw new Error('Batch manifest requires videoId.');
if (!Array.isArray(manifest.scenes) || manifest.scenes.length === 0) throw new Error('Batch manifest requires at least one scene.');

const ids = new Set();
for (const scene of manifest.scenes) {
  if (!scene.id || ids.has(scene.id)) throw new Error(`Invalid or duplicate scene id: ${scene.id}`);
  ids.add(scene.id);
}

const outputDir = path.join(repoRoot, 'out', 'scenes', manifest.videoId);
const tempDir = path.join(repoRoot, 'out', '.batch-props');
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const safeId = (id) => id.replace(/[^a-zA-Z0-9._-]+/g, '_');
const records = [];
const writeOutputManifest = () => fs.writeFileSync(
  path.join(repoRoot, 'out', 'batch-manifest.json'),
  JSON.stringify({
    schemaVersion: 1,
    videoId: manifest.videoId,
    completedAt: new Date().toISOString(),
    scenes: records,
  }, null, 2),
);

try {
  for (const scene of manifest.scenes) {
    const stem = safeId(scene.id);
    const outputFile = path.join(outputDir, `${stem}.mp4`);
    const propsFile = path.join(tempDir, `${stem}.json`);
    fs.writeFileSync(propsFile, JSON.stringify(scene, null, 2));

    const record = {
      sceneId: scene.id,
      sourceConcept: scene.sourceConcept,
      duration: scene.durationSeconds,
      outputFilename: path.relative(repoRoot, outputFile).replaceAll(path.sep, '/'),
      sceneType: scene.title ?? 'untyped',
      mechanisms: (scene.mechanisms ?? []).map((mechanism) => mechanism.type),
      status: 'pending',
    };
    records.push(record);
    writeOutputManifest();

    try {
      execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', [
        'remotion', 'render', 'src/index.ts', 'UniversalVisual', outputFile,
        `--props=${propsFile}`,
      ], { cwd: repoRoot, stdio: 'inherit' });
      record.status = 'rendered';
    } catch (error) {
      record.status = 'failed';
      writeOutputManifest();
      throw error;
    }
    writeOutputManifest();
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Batch render complete: ${records.length} scene(s).`);
