import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { MechanismSpec, SceneObject, SceneRelationship } from './scene';

const center = (object: SceneObject) => ({
  x: object.x + (object.width ?? 120) / 2,
  y: object.y + (object.height ?? 80) / 2,
});

const arrow = (x1: number, y1: number, x2: number, y2: number, color: string) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 14;
  const left = `${x2 - size * Math.cos(angle - Math.PI / 6)},${y2 - size * Math.sin(angle - Math.PI / 6)}`;
  const right = `${x2 - size * Math.cos(angle + Math.PI / 6)},${y2 - size * Math.sin(angle + Math.PI / 6)}`;
  return <polygon points={`${x2},${y2} ${left} ${right}`} fill={color} />;
};

export const MechanismOverlay: React.FC<{
  mechanisms: MechanismSpec[];
  objects: SceneObject[];
  relationships: SceneRelationship[];
}> = ({ mechanisms, objects, relationships }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const byId = new Map(objects.map((object) => [object.id, object]));
  const relById = new Map(relationships.map((relationship) => [relationship.id, relationship]));

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" pointerEvents="none">
        <defs>
          <filter id="universalGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {mechanisms.map((mechanism) => {
          const targets = (mechanism.targetIds ?? []).map((id) => byId.get(id)).filter(Boolean) as SceneObject[];
          const relations = (mechanism.relationshipIds ?? []).map((id) => relById.get(id)).filter(Boolean) as SceneRelationship[];
          const config = mechanism.config ?? {};
          const accent = String(config.color ?? '#72d6ff');

          if (mechanism.type === 'highlight') {
            return targets.map((target) => {
              const opacity = 0.35 + 0.35 * Math.sin((frame / fps) * Math.PI * 2);
              return <rect key={`${mechanism.id}-${target.id}`} x={target.x - 14} y={target.y - 14} width={(target.width ?? 120) + 28} height={(target.height ?? 80) + 28} rx={18} fill="none" stroke={accent} strokeWidth={6} opacity={opacity} filter="url(#universalGlow)" />;
            });
          }

          if (mechanism.type === 'flow' || mechanism.type === 'cause-effect' || mechanism.type === 'interaction') {
            return relations.map((relationship) => {
              const from = byId.get(relationship.from);
              const to = byId.get(relationship.to);
              if (!from || !to) return null;
              const a = center(from);
              const b = center(to);
              const progress = (frame % Math.max(1, Math.round(fps * 1.6))) / Math.max(1, fps * 1.6);
              const px = interpolate(progress, [0, 1], [a.x, b.x]);
              const py = interpolate(progress, [0, 1], [a.y, b.y]);
              const stroke = relationship.style?.stroke ?? accent;
              return (
                <g key={`${mechanism.id}-${relationship.id}`}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={mechanism.type === 'interaction' ? 4 : 5} strokeDasharray={mechanism.type === 'flow' ? '18 16' : undefined} opacity={0.8} />
                  {arrow(a.x, a.y, b.x, b.y, stroke)}
                  {mechanism.type === 'flow' && <circle cx={px} cy={py} r={10} fill={accent} filter="url(#universalGlow)" />}
                  {relationship.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 16} fill="#b9d1db" fontSize={20} textAnchor="middle">{relationship.label}</text>}
                </g>
              );
            });
          }

          if (mechanism.type === 'measurement') {
            if (targets.length < 2) return null;
            const a = center(targets[0]);
            const b = center(targets[1]);
            const distance = Math.round(Math.hypot(b.x - a.x, b.y - a.y));
            const label = String(config.label ?? distance);
            return (
              <g key={mechanism.id}>
                <line x1={a.x} y1={a.y + 70} x2={b.x} y2={b.y + 70} stroke={accent} strokeWidth={3} />
                {arrow(a.x, a.y + 70, a.x + 50, a.y + 70, accent)}
                {arrow(b.x, b.y + 70, b.x - 50, b.y + 70, accent)}
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 + 108} fill={accent} fontSize={22} textAnchor="middle">{label}</text>
              </g>
            );
          }

          if (mechanism.type === 'comparison') {
            const left = Number(config.leftValue ?? 1);
            const right = Number(config.rightValue ?? 1);
            const max = Math.max(1, left, right);
            const baseY = Number(config.baseY ?? 820);
            const scale = Number(config.scale ?? 180);
            return (
              <g key={mechanism.id}>
                <rect x={600} y={baseY - (left / max) * scale} width={180} height={(left / max) * scale} rx={12} fill={String(config.leftColor ?? '#5c8cff')} opacity={0.8} />
                <rect x={1040} y={baseY - (right / max) * scale} width={180} height={(right / max) * scale} rx={12} fill={String(config.rightColor ?? '#ff8f5c')} opacity={0.8} />
                <text x={690} y={baseY + 34} fill="#d8e5ea" fontSize={22} textAnchor="middle">{String(config.leftLabel ?? 'A')}</text>
                <text x={1130} y={baseY + 34} fill="#d8e5ea" fontSize={22} textAnchor="middle">{String(config.rightLabel ?? 'B')}</text>
              </g>
            );
          }

          if (mechanism.type === 'sequence' || mechanism.type === 'progression') {
            const count = Math.max(1, Number(config.count ?? targets.length ?? 4));
            const active = Math.floor((frame / Math.max(1, fps * Number(config.stepSeconds ?? 1))) % count);
            const startX = Number(config.startX ?? 660);
            const y = Number(config.y ?? 880);
            return (
              <g key={mechanism.id}>
                {Array.from({ length: count }, (_, index) => (
                  <g key={index}>
                    <circle cx={startX + index * 110} cy={y} r={index === active ? 18 : 10} fill={index === active ? accent : '#4a626c'} opacity={index === active ? 1 : 0.7} />
                    {index < count - 1 && <line x1={startX + index * 110 + 16} y1={y} x2={startX + index * 110 + 94} y2={y} stroke="#4a626c" strokeWidth={3} />}
                  </g>
                ))}
              </g>
            );
          }

          if (mechanism.type === 'transformation') {
            return targets.map((target) => {
              const phase = (frame / Math.max(1, fps * Number(config.durationSeconds ?? 2))) % 1;
              const scale = interpolate(phase, [0, 0.5, 1], [0.85, 1.08, 0.85]);
              return <rect key={`${mechanism.id}-${target.id}`} x={target.x - 18} y={target.y - 18} width={(target.width ?? 120) + 36} height={(target.height ?? 80) + 36} rx={24} fill="none" stroke={accent} strokeWidth={4} opacity={0.75} transform={`rotate(${phase * 20} ${target.x + (target.width ?? 120) / 2} ${target.y + (target.height ?? 80) / 2}) scale(${scale})`} />;
            });
          }

          if (mechanism.type === 'before-after') {
            const splitX = Number(config.splitX ?? 960);
            return (
              <g key={mechanism.id}>
                <line x1={splitX} y1={180} x2={splitX} y2={900} stroke="#3c5661" strokeWidth={3} strokeDasharray="12 12" />
                <text x={splitX / 2} y={150} fill="#9fb9c4" fontSize={24} textAnchor="middle">{String(config.beforeLabel ?? 'Before')}</text>
                <text x={splitX + (1920 - splitX) / 2} y={150} fill={accent} fontSize={24} textAnchor="middle">{String(config.afterLabel ?? 'After')}</text>
              </g>
            );
          }

          if (mechanism.type === 'layers') {
            const x = Number(config.x ?? 1280);
            const y = Number(config.y ?? 730);
            const count = Math.max(2, Number(config.count ?? 4));
            return (
              <g key={mechanism.id}>
                {Array.from({ length: count }, (_, index) => <rect key={index} x={x + index * 14} y={y - index * 18} width={180} height={60} rx={10} fill={index % 2 ? '#294652' : '#1b3541'} stroke={accent} strokeWidth={2} opacity={0.95} />)}
              </g>
            );
          }

          if (mechanism.type === 'movement') {
            return targets.map((target) => {
              const motion = target.motion;
              if (!motion) return null;
              const start = (motion.startSeconds ?? 0) * fps;
              const end = start + motion.durationSeconds * fps;
              const progress = interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const x = interpolate(progress, [0, 1], [motion.from.x, motion.to.x]);
              const y = interpolate(progress, [0, 1], [motion.from.y, motion.to.y]);
              return <circle key={`${mechanism.id}-${target.id}`} cx={x + (target.width ?? 120) / 2} cy={y + (target.height ?? 80) / 2} r={6} fill={accent} opacity={0.8} />;
            });
          }

          return null;
        })}
      </svg>
    </AbsoluteFill>
  );
};
