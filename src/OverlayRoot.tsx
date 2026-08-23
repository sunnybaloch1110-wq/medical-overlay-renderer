import React from 'react';
import { Composition } from 'remotion';
import { VIDEO_DEFAULTS } from './config/video';
import { BloodFlowOverlay } from './components/BloodFlowOverlay';

export type OverlayRenderProps = {
  durationInSeconds: number;
  id?: string;
  concept?: string;
  transcript?: string;
  renderer?: string;
  props?: Record<string, unknown>;
};

export const OverlayRoot: React.FC = () => (
  <Composition<OverlayRenderProps>
    id="MedicalOverlay"
    component={BloodFlowOverlay}
    durationInFrames={1}
    fps={VIDEO_DEFAULTS.fps}
    width={VIDEO_DEFAULTS.width}
    height={VIDEO_DEFAULTS.height}
    defaultProps={{ durationInSeconds: 1 }}
    calculateMetadata={({ props }) => ({
      durationInFrames: Math.max(1, Math.round(props.durationInSeconds * VIDEO_DEFAULTS.fps)),
      fps: VIDEO_DEFAULTS.fps,
      width: VIDEO_DEFAULTS.width,
      height: VIDEO_DEFAULTS.height,
    })}
  />
);
