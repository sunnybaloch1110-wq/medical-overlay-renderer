import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { OverlayRenderProps, SceneElement } from './types';

const animatedValue = (
  value: number | undefined,
  from: number | undefined,
  to: number | undefined,
  start: number,
  end: number,
  frame: number,
  fallback: number,
) => {
  if (from === undefined && to === undefined) return value ?? fallback;
  return interpolate(frame, [start, Math.max(start + 1, end)], [from ?? fallback, to ?? value ?? fallback], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
};

const SceneElementView: React.FC<{ element: SceneElement; frame: number; fps: number }> = ({ element, frame, fps }) => {
  const animation = element.animation;
  const start = (animation?.start ?? 0) * fps;
  const end = (animation?.end ?? 1) * fps;
  const x = animatedValue(element.x, animation?.from?.x, animation?.to?.x, start, end, frame, 0);
  const y = animatedValue(element.y, animation?.from?.y, animation?.to?.y, start, end, frame, 0);
  const opacity = animatedValue(element.opacity, animation?.from?.opacity, animation?.to?.opacity, start, end, frame, 1);
  const scale = animatedValue(element.scale, animation?.from?.scale, animation?.to?.scale, start, end, frame, 1);
  const rotation = animatedValue(element.rotation, animation?.from?.rotation, animation?.to?.rotation, start, end, frame, 0);
  const transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
  const common = { opacity, transform, transformOrigin: 'center center' };

  switch (element.type) {
    case 'text':
      return <text x={0} y={0} fill={element.fill ?? '#ffffff'} fontSize={element.fontSize ?? 48} fontWeight={element.fontWeight ?? 400} textAnchor={element.anchor ?? 'start'} style={common}>{element.text ?? ''}</text>;
    case 'rect':
      return <rect x={0} y={0} width={element.width ?? 0} height={element.height ?? 0} rx={element.r ?? 0} fill={element.fill ?? 'transparent'} stroke={element.stroke} strokeWidth={element.strokeWidth} style={common} />;
    case 'circle':
      return <circle cx={0} cy={0} r={element.r ?? 0} fill={element.fill ?? 'transparent'} stroke={element.stroke} strokeWidth={element.strokeWidth} style={common} />;
    case 'line':
      return <line x1={0} y1={0} x2={element.x2 ?? 0} y2={element.y2 ?? 0} stroke={element.stroke ?? '#ffffff'} strokeWidth={element.strokeWidth ?? 2} style={common} />;
    case 'path':
      return <path d={element.d ?? ''} fill={element.fill ?? 'none'} stroke={element.stroke} strokeWidth={element.strokeWidth} style={common} />;
    case 'image':
      return element.src ? <Img src={element.src} style={{ position: 'absolute', left: x, top: y, width: element.width, height: element.height, opacity, transform: `rotate(${rotation}deg) scale(${scale})`, transformOrigin: 'center center' }} /> : null;
    default:
      return null;
  }
};

export const DynamicOverlay: React.FC<OverlayRenderProps> = ({ durationInSeconds, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elements = scene?.elements ?? [];

  return (
    <AbsoluteFill style={{ backgroundColor: scene?.background ?? 'transparent' }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ overflow: 'visible' }}>
        {elements.map((element, index) => <SceneElementView key={element.id ?? index} element={element} frame={frame} fps={fps} />)}
      </svg>
    </AbsoluteFill>
  );
};
