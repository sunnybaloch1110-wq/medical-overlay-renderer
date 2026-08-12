import React, { useMemo } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SceneSpec } from './scene';
import { ObjectPrimitive, LabelPrimitive } from './primitives';
import { MechanismOverlay } from './mechanisms';
import { validateScene } from './validation';

export const UniversalScene: React.FC<SceneSpec> = (scene) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const validatedScene = useMemo(() => validateScene(scene), [scene]);
  const reveal = interpolate(frame, [0, Math.min(fps, 30)], [0, 1], { easing: Easing.out(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const objects = [...validatedScene.objects].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));

  return (
    <AbsoluteFill style={{ backgroundColor: validatedScene.background ?? '#071018', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" role="img" aria-label={validatedScene.sourceConcept}>
        <rect width="1920" height="1080" fill={validatedScene.background ?? '#071018'} />
        <g opacity={reveal}>
          {objects.map((object) => <ObjectPrimitive key={object.id} object={object} />)}
          {validatedScene.labels?.map((label, index) => <LabelPrimitive key={`${label.text}-${index}`} {...label} />)}
          {validatedScene.title && <text x={96} y={92} fill="#e9f3f7" fontSize={38} fontWeight={700}>{validatedScene.title}</text>}
        </g>
      </svg>
      <MechanismOverlay mechanisms={validatedScene.mechanisms ?? []} objects={validatedScene.objects} relationships={validatedScene.relationships ?? []} />
    </AbsoluteFill>
  );
};
