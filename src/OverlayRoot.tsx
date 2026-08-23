import React from 'react';
import { Composition } from 'remotion';
import { VIDEO } from './config/video';
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
    id="MedicalBloodFlow"
    component={BloodFlowOverlay}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
    defaultProps={{durationInSeconds: VIDEO.durationInSeconds}}
    calculateMetadata={({props}) => ({
      durationInFrames: Math.max(1, Math.round(props.durationInSeconds * VIDEO.fps)),
    })}
  />
);
