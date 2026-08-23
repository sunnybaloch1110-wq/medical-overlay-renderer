export type SceneElement = {
  type: 'text' | 'rect' | 'circle' | 'line' | 'path' | 'image';
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  r?: number;
  x2?: number;
  y2?: number;
  d?: string;
  src?: string;
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontWeight?: number | string;
  anchor?: 'start' | 'middle' | 'end';
  rotation?: number;
  scale?: number;
  animation?: {
    from?: { opacity?: number; x?: number; y?: number; scale?: number; rotation?: number };
    to?: { opacity?: number; x?: number; y?: number; scale?: number; rotation?: number };
    start?: number;
    end?: number;
  };
};

export type SceneSpec = {
  background?: string;
  elements: SceneElement[];
};

export type OverlayRenderProps = {
  durationInSeconds: number;
  id?: string;
  concept?: string;
  transcript?: string;
  scene?: SceneSpec;
};
