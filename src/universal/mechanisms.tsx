import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type {
  ComparisonConfig,
  FlowConfig,
  MechanismSpec,
  ProgressionConfig,
  SceneObject,
  SceneRelationship,
  SequenceConfig,
} from './scene';

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

const pathPoints = (relationship: SceneRelationship, objects: Map<string, SceneObject>) => {
  if (relationship.path?.points && relationship.path.points.length >= 2) return relationship.path.points;
  const from = objects.get(relationship.from);
  const to = objects.get(relationship.to);
  if (!from || !to) return [];
  return [center(from), center(to)];
};

const polylineLength = (points: { x: number; y: number }[]) => points.slice(1).reduce((sum, point, index) => {
  const previous = points[index];
  return sum + Math.hypot(point.x - previous.x, point.y - previous.y);
}, 0);

const pointAlongPolyline = (points: { x: number; y: number }[], progress: number) => {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const total = polylineLength(points);
  if (!total) return points[0];
  let distance = Math.min(1, Math.max(0, progress)) * total;
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const segment = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance <= segment) {
      const t = segment === 0 ? 0 : distance / segment;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    distance -= segment;
  }
  return points[points.length - 1];
};

const anchorPosition = (object: SceneObject, anchor: ComparisonConfig['anchor'], gap: number) => {
  const width = object.width ?? 120;
  const height = object.height ?? 80;
  const c = center(object);
  switch (anchor) {
    case 'top': return { x: c.x, y: object.y - gap };
    case 'left': return { x: object.x - gap, y: c.y };
    case 'right': return { x: object.x + width + gap, y: c.y };
    case 'bottom':
    default: return { x: c.x, y: object.y + height + gap };
  }
};

const sequenceGeometry = (targets: SceneObject[]) => targets.map((target) => center(target));

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
              const points = pathPoints(relationship, byId);
              if (points.length < 2) return null;
              const progress = (frame % Math.max(1, Math.round(fps * Number((config as FlowConfig).cycleSeconds ?? 1.6)))) / Math.max(1, fps * Number((config as FlowConfig).cycleSeconds ?? 1.6));
              const particle = pointAlongPolyline(points, relationship.direction === 'backward' ? 1 - progress : progress);
              const stroke = relationship.style?.stroke ?? accent;
              return (
                <g key={`${mechanism.id}-${relationship.id}`}>
                  <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={stroke} strokeWidth={mechanism.type === 'interaction' ? 4 : 5} strokeDasharray={mechanism.type === 'flow' ? '18 16' : undefined} opacity={0.8} />
                  {arrow(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y, stroke)}
                  {mechanism.type === 'flow' && <circle cx={particle.x} cy={particle.y} r={Number((config as FlowConfig).particleRadius ?? 10)} fill={accent} filter="url(#universalGlow)" />}
                  {relationship.label && <text x={particle.x} y={particle.y - 18} fill="#b9d1db" fontSize={20} textAnchor="middle">{relationship.label}</text>}
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
            if (targets.length < 2) return null;
            const comparison = config as ComparisonConfig;
            const anchor = comparison.anchor ?? 'bottom';
            const gap = Number(comparison.gap ?? 48);
            const barWidth = Number(comparison.barWidth ?? 120);
            const maxBarExtent = Number(comparison.maxBarExtent ?? 220);
            const values = comparison.values ?? {};
            const getValue = (target: SceneObject) => comparison.valueMode === 'config' ? Number(values[target.id] ?? 0) : Number(target.quantity ?? values[target.id] ?? 0);
            const valueA = getValue(targets[0]);
            const valueB = getValue(targets[1]);
            const maxValue = Math.max(1, valueA, valueB);
            const baseA = anchorPosition(targets[0], anchor, gap);
            const baseB = anchorPosition(targets[1], anchor, gap);
            const vertical = anchor === 'top' || anchor === 'bottom';
            const extentA = (valueA / maxValue) * maxBarExtent;
            const extentB = (valueB / maxValue) * maxBarExtent;
            const colorA = String(comparison.leftColor ?? '#5c8cff');
            const colorB = String(comparison.rightColor ?? '#ff8f5c');
            return (
              <g key={mechanism.id}>
                {vertical ? (
                  <>
                    <rect x={baseA.x - barWidth / 2} y={anchor === 'bottom' ? baseA.y : baseA.y - extentA} width={barWidth} height={extentA} rx={12} fill={colorA} opacity={0.8} />
                    <rect x={baseB.x - barWidth / 2} y={anchor === 'bottom' ? baseB.y : baseB.y - extentB} width={barWidth} height={extentB} rx={12} fill={colorB} opacity={0.8} />
                  </>
                ) : (
                  <>
                    <rect x={anchor === 'right' ? baseA.x : baseA.x - extentA} y={baseA.y - barWidth / 2} width={extentA} height={barWidth} rx={12} fill={colorA} opacity={0.8} />
                    <rect x={anchor === 'right' ? baseB.x : baseB.x - extentB} y={baseB.y - barWidth / 2} width={extentB} height={barWidth} rx={12} fill={colorB} opacity={0.8} />
                  </>
                )}
                <text x={vertical ? baseA.x : baseA.x + (anchor === 'right' ? 20 : -20)} y={vertical ? baseA.y + (anchor === 'bottom' ? 30 : -16) : baseA.y + 8} fill="#d8e5ea" fontSize={22} textAnchor={vertical ? 'middle' : anchor === 'right' ? 'start' : 'end'}>{String(comparison.leftLabel ?? targets[0].state ?? targets[0].id)} {comparison.labelSuffix ?? ''}</text>
                <text x={vertical ? baseB.x : baseB.x + (anchor === 'right' ? 20 : -20)} y={vertical ? baseB.y + (anchor === 'bottom' ? 30 : -16) : baseB.y + 8} fill="#d8e5ea" fontSize={22} textAnchor={vertical ? 'middle' : anchor === 'right' ? 'start' : 'end'}>{String(comparison.rightLabel ?? targets[1].state ?? targets[1].id)} {comparison.labelSuffix ?? ''}</text>
              </g>
            );
          }

          if (mechanism.type === 'sequence' || mechanism.type === 'progression') {
            if (targets.length === 0) return null;
            const sequence = config as SequenceConfig;
            const progression = config as ProgressionConfig;
            const stepSeconds = Math.max(0.1, Number(sequence.stepSeconds ?? 1));
            const cycle = Math.max(1, fps * stepSeconds * targets.length);
            const continuous = (frame % cycle) / Math.max(1, fps * stepSeconds);
            const activeIndex = Math.min(targets.length - 1, Math.floor(continuous));
            const blend = Math.min(1, Math.max(0, continuous - activeIndex));
            const points = sequenceGeometry(targets);
            const activeColor = String(sequence.color ?? accent);
            const inactiveColor = String(sequence.inactiveColor ?? '#4a626c');
            const connectorColor = String(sequence.connectorColor ?? '#4a626c');
            return (
              <g key={mechanism.id}>
                <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={connectorColor} strokeWidth={3} opacity={0.7} />
                {targets.map((target, index) => {
                  const point = points[index];
                  const isActive = index === activeIndex;
                  const isPast = index < activeIndex;
                  const scale = mechanism.type === 'progression' ? 1 + ((isActive ? 1 - blend : isPast ? 0.16 : 0) * Number(progression.completionScale ?? 0.18)) : 1;
                  const radius = 24 * scale;
                  const stateText = target.state ?? target.text ?? target.id;
                  return (
                    <g key={`${mechanism.id}-${target.id}`}>
                      <circle cx={point.x} cy={point.y} r={radius} fill={isActive ? activeColor : inactiveColor} opacity={isActive || isPast ? 1 : 0.6} />
                      {index < targets.length - 1 && <line x1={point.x + radius + 8} y1={point.y} x2={points[index + 1].x - radius - 8} y2={points[index + 1].y} stroke={connectorColor} strokeWidth={3} opacity={0.7} />}
                      {(isActive || isPast) && sequence.showStateLabel !== false && <text x={point.x} y={point.y - radius - 18} fill="#d8e5ea" fontSize={18} textAnchor="middle">{stateText}</text>}
                    </g>
                  );
                })}
                {mechanism.type === 'progression' && points[activeIndex + 1] && (
                  <circle
                    cx={interpolate(blend, [0, 1], [points[activeIndex].x, points[activeIndex + 1].x])}
                    cy={interpolate(blend, [0, 1], [points[activeIndex].y, points[activeIndex + 1].y])}
                    r={8}
                    fill={activeColor}
                    filter="url(#universalGlow)"
                  />
                )}
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
