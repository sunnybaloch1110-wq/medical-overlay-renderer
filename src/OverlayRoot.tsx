import React from 'react';
import { Composition } from 'remotion';
import { VIDEO_DEFAULTS } from './config/video';
import { resolveRenderer } from './renderers';
import type { OverlayRenderProps } from './types';

export const OverlayRoot: React.FC = () => (
  <Composition<OverlayRenderProps>
    id="MedicalOverlay"
    component={resolveRenderer('blood_flow')}
    durationInFrames={1}
    fps={VIDEO_DEFAULTS.fps}
    width={VIDEO_DEFAULTS.width}
    height={VIDEO_DEFAULTS.height}
    defaultProps={{ durationInSeconds: 1, visualType: 'blood_flow' }}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(props.durationInSeconds * VIDEO_DEFAULTS.fps)),
      fps: VIDEO_DEFAULTS.fps,
      width: VIDEO_DEFAULTS.width,
      height: VIDEO_DEFAULTS.height,
    })}
    resolveMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(props.durationInSeconds * VIDEO_DEFAULTS.fps)),
      fps: VIDEO_DEFAULTS.fps,
      width: VIDEO_DEFAULTS.width,
      height: VIDEO_DEFAULTS.height,
    })}
  />
);
