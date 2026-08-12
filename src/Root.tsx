import React from 'react';
import { Composition } from 'remotion';
import { VIDEO } from './config/video';
import { BloodFlowOverlay } from './components/BloodFlowOverlay';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MedicalBloodFlow"
      component={BloodFlowOverlay}
      durationInFrames={VIDEO.durationInFrames}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
      defaultProps={{}}
    />
  );
};
