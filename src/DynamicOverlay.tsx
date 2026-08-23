import React from 'react';
import type { OverlayRenderProps } from './types';
import { resolveRenderer } from './renderers';

export const DynamicOverlay: React.FC<OverlayRenderProps> = (props) => {
  const Renderer = resolveRenderer(props.visualType ?? props.renderer ?? '');
  return <Renderer {...props} />;
};
