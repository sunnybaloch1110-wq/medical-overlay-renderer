import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { OverlayRenderProps } from '../OverlayRoot';

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const num = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** Generic parameter-driven 2D explainer renderer. It is deliberately content-agnostic. */
export const GenericCanvasOverlay: React.FC<OverlayRenderProps> = ({ concept, transcript, props = {} }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const duration = Math.max(0.001, props.durationInSeconds as number || 1);
  const progress = frame / Math.max(1, duration * fps - 1);
  const reveal = interpolate(progress, [0, 0.12, 0.88, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const title = text(props.title, concept || 'Medical visualization');
  const subtitle = text(props.subtitle, transcript || '');
  const label = text(props.label, '');
  const accent = text(props.accent, '#f4c95d');
  const background = text(props.background, '#071018');
  const primary = text(props.primary, '#e9f3f7');
  const secondary = text(props.secondary, '#8faab5');
  const x1 = num(props.x1, width * 0.22);
  const x2 = num(props.x2, width * 0.78);
  const y = num(props.y, height * 0.52);
  const lineProgress = interpolate(progress, [0.08, 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: background, opacity: reveal, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="genericGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={width} height={height} fill={background} />
        <text x={width * 0.08} y={height * 0.12} fill={primary} fontSize={42} fontWeight="700">{title}</text>
        {subtitle && <text x={width * 0.08} y={height * 0.17} fill={secondary} fontSize={22}>{subtitle.slice(0, 120)}</text>}
        <line x1={x1} y1={y} x2={x1 + (x2 - x1) * lineProgress} y2={y} stroke={accent} strokeWidth={8} strokeLinecap="round" />
        <circle cx={x1 + (x2 - x1) * lineProgress} cy={y} r={18} fill={accent} filter="url(#genericGlow)" />
        {label && <text x={width * 0.08} y={height * 0.86} fill={accent} fontSize={28} fontWeight="700">{label}</text>}
      </svg>
    </AbsoluteFill>
  );
};
