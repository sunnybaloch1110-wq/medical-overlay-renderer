export const SCENE_SCHEMA_VERSION = 1 as const;

export type SceneShape = 'rect' | 'circle' | 'ellipse' | 'line' | 'text';
export type MechanismType =
  | 'movement'
  | 'flow'
  | 'highlight'
  | 'measurement'
  | 'comparison'
  | 'sequence'
  | 'progression'
  | 'transformation'
  | 'before-after'
  | 'cause-effect'
  | 'interaction'
  | 'layers';

export type Point = { x: number; y: number };
export type SceneStyle = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  rx?: number;
};

export type MotionSpec = {
  from: Point;
  to: Point;
  startSeconds?: number;
  durationSeconds: number;
};

export type SceneObject = {
  id: string;
  shape: SceneShape;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  style?: SceneStyle;
  layer?: number;
  state?: string;
  quantity?: number;
  motion?: MotionSpec;
};

export type SceneRelationship = {
  id: string;
  from: string;
  to: string;
  label?: string;
  direction?: 'forward' | 'backward' | 'bidirectional';
  style?: SceneStyle;
};

export type MechanismSpec = {
  id: string;
  type: MechanismType;
  targetIds?: string[];
  relationshipIds?: string[];
  config?: Record<string, unknown>;
};

export type SceneSpec = {
  schemaVersion: 1;
  id: string;
  sourceConcept: string;
  durationSeconds: number;
  fps?: number;
  background?: string;
  title?: string;
  objects: SceneObject[];
  relationships?: SceneRelationship[];
  mechanisms?: MechanismSpec[];
  labels?: Array<{ text: string; x: number; y: number; style?: SceneStyle }>;
  metadata?: Record<string, unknown>;
};

export type BatchManifest = {
  schemaVersion: 1;
  videoId: string;
  scenes: SceneSpec[];
};
