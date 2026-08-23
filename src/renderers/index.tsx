import React from 'react';
import { BloodFlowOverlay } from '../components/BloodFlowOverlay';
import type { OverlayRenderProps } from '../types';

export type RendererComponent = React.ComponentType<OverlayRenderProps>;

const REGISTRY: Record<string, RendererComponent> = {
  blood_flow: BloodFlowOverlay,
};

export function resolveRenderer(name: string): RendererComponent {
  const renderer = REGISTRY[name];
  if (!renderer) {
    throw new Error(`Unknown visual_type '${name}'. Register a renderer in src/renderers/index.tsx.`);
  }
  return renderer;
}

export function listRenderers(): string[] {
  return Object.keys(REGISTRY).sort();
}
