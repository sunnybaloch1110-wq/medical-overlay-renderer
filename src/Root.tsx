import React from 'react';
import { Composition } from 'remotion';
import { VIDEO } from './config/video';
import { BloodFlowOverlay } from './components/BloodFlowOverlay';
import { UniversalScene } from './universal/UniversalScene';
import type { SceneSpec } from './universal/scene';

const UNIVERSAL_DEFAULTS: SceneSpec = {
  schemaVersion: 1,
  id: 'preview',
  sourceConcept: 'generic visual concept',
  durationSeconds: 5,
  objects: [],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MedicalBloodFlow"
        component={BloodFlowOverlay}
        durationInFrames={VIDEO.durationInFrames}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={{}}
      />
      <Composition
        id="UniversalVisual"
        component={UniversalScene}
        durationInFrames={150}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        defaultProps={UNIVERSAL_DEFAULTS}
        calculateMetadata={({ props }) => {
          const fps = props.fps ?? VIDEO.fps;
          return {
            durationInFrames: Math.max(1, Math.ceil(props.durationSeconds * fps)),
            fps,
            width: VIDEO.width,
            height: VIDEO.height,
          };
        }}
      />
    </>
  );
};
