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
export type RelationshipPath = {
  kind: 'polyline';
  points: Point[];
};
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
  path?: RelationshipPath;
  style?: SceneStyle;
};

export type FlowConfig = {
  color?: string;
  particleRadius?: number;
  cycleSeconds?: number;
};

export type ComparisonConfig = {
  valueMode?: 'quantity' | 'config';
  values?: Record<string, number>;
  anchor?: 'top' | 'bottom' | 'left' | 'right';
  gap?: number;
  barWidth?: number;
  maxBarExtent?: number;
  color?: string;
  leftColor?: string;
  rightColor?: string;
  leftLabel?: string;
  rightLabel?: string;
  labelSuffix?: string;
};

export type SequenceConfig = {
  stepSeconds?: number;
  color?: string;
  inactiveColor?: string;
  connectorColor?: string;
  showStateLabel?: boolean;
};

export type ProgressionConfig = SequenceConfig & {
  completionScale?: number;
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
