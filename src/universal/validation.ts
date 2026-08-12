import type { BatchManifest, SceneSpec } from './scene';

const fail = (message: string): never => {
  throw new Error(`Scene validation failed: ${message}`);
};

export function validateScene(scene: SceneSpec): SceneSpec {
  if (scene.schemaVersion !== 1) fail(`unsupported schemaVersion: ${scene.schemaVersion}`);
  if (!scene.id.trim()) fail('id is required');
  if (!scene.sourceConcept.trim()) fail(`${scene.id}: sourceConcept is required`);
  if (!Number.isFinite(scene.durationSeconds) || scene.durationSeconds <= 0) fail(`${scene.id}: durationSeconds must be > 0`);
  if (scene.fps !== undefined && (!Number.isFinite(scene.fps) || scene.fps <= 0)) fail(`${scene.id}: fps must be > 0`);

  const ids = new Set<string>();
  for (const object of scene.objects) {
    if (ids.has(object.id)) fail(`${scene.id}: duplicate object id '${object.id}'`);
    ids.add(object.id);
  }

  const relationships = scene.relationships ?? [];
  for (const relationship of relationships) {
    if (!ids.has(relationship.from)) fail(`${scene.id}: relationship '${relationship.id}' references missing '${relationship.from}'`);
    if (!ids.has(relationship.to)) fail(`${scene.id}: relationship '${relationship.id}' references missing '${relationship.to}'`);
    if (relationship.path && relationship.path.points.length < 2) fail(`${scene.id}: relationship '${relationship.id}' path requires at least 2 points`);
  }

  const relationshipIds = new Set(relationships.map((relationship) => relationship.id));
  for (const mechanism of scene.mechanisms ?? []) {
    for (const targetId of mechanism.targetIds ?? []) {
      if (!ids.has(targetId)) fail(`${scene.id}: mechanism '${mechanism.id}' references missing object '${targetId}'`);
    }
    for (const relationshipId of mechanism.relationshipIds ?? []) {
      if (!relationshipIds.has(relationshipId)) fail(`${scene.id}: mechanism '${mechanism.id}' references missing relationship '${relationshipId}'`);
    }
  }

  return scene;
}

export function validateBatchManifest(manifest: BatchManifest): BatchManifest {
  if (manifest.schemaVersion !== 1) fail(`unsupported batch schemaVersion: ${manifest.schemaVersion}`);
  if (!manifest.videoId.trim()) fail('videoId is required');
  if (manifest.scenes.length === 0) fail('scenes must contain at least one scene');

  const ids = new Set<string>();
  for (const scene of manifest.scenes) {
    if (ids.has(scene.id)) fail(`duplicate scene id '${scene.id}'`);
    ids.add(scene.id);
    validateScene(scene);
  }
  return manifest;
}
