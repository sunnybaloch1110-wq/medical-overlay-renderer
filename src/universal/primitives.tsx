import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneObject, SceneStyle } from './scene';

const style = (value: SceneStyle | undefined, fallback: SceneStyle = {}): React.CSSProperties => ({
  fill: value?.fill ?? fallback.fill,
  stroke: value?.stroke ?? fallback.stroke,
  strokeWidth: value?.strokeWidth ?? fallback.strokeWidth,
  opacity: value?.opacity ?? fallback.opacity,
});

const animatedPosition = (object: SceneObject, frame: number, fps: number) => {
  if (!object.motion) return { x: object.x, y: object.y };
  const start = (object.motion.startSeconds ?? 0) * fps;
  const end = start + object.motion.durationSeconds * fps;
  const progress = interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return {
    x: interpolate(progress, [0, 1], [object.motion.from.x, object.motion.to.x]),
    y: interpolate(progress, [0, 1], [object.motion.from.y, object.motion.to.y]),
  };
};

export const ObjectPrimitive: React.FC<{ object: SceneObject }> = ({ object }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const position = animatedPosition(object, frame, fps);
  const common = style(object.style, { fill: '#17303d', stroke: '#5c7d89', strokeWidth: 3, opacity: 1 });

  if (object.shape === 'circle') {
    return <circle cx={position.x} cy={position.y} r={object.radius ?? 24} {...common} />;
  }
  if (object.shape === 'ellipse') {
    return <ellipse cx={position.x} cy={position.y} rx={(object.width ?? 80) / 2} ry={(object.height ?? 50) / 2} {...common} />;
  }
  if (object.shape === 'line') {
    const x2 = position.x + (object.width ?? 160);
    const y2 = position.y + (object.height ?? 0);
    return <line x1={position.x} y1={position.y} x2={x2} y2={y2} {...common} />;
  }
  if (object.shape === 'text') {
    return (
      <text x={position.x} y={position.y} fill={object.style?.color ?? object.style?.fill ?? '#e9f3f7'} fontSize={object.style?.fontSize ?? 28} fontWeight={object.style?.fontWeight ?? 500} opacity={object.style?.opacity ?? 1}>
        {object.text ?? object.id}
      </text>
    );
  }
  return <rect x={position.x} y={position.y} width={object.width ?? 120} height={object.height ?? 80} rx={object.style?.rx ?? 14} {...common} />;
};

export const LabelPrimitive: React.FC<{ text: string; x: number; y: number; style?: SceneStyle }> = ({ text, x, y, style: value }) => (
  <text x={x} y={y} fill={value?.color ?? value?.fill ?? '#e9f3f7'} fontSize={value?.fontSize ?? 22} fontWeight={value?.fontWeight ?? 400} opacity={value?.opacity ?? 1}>
    {text}
  </text>
);
