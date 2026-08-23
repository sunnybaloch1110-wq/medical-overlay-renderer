import { BloodFlowOverlay } from '../components/BloodFlowOverlay';
import { GenericCanvasOverlay } from './GenericCanvasOverlay';
import type { RendererComponent } from './index';

export const RENDERER_REGISTRY: Record<string, RendererComponent> = {
  blood_flow: BloodFlowOverlay,
  generic_2d: GenericCanvasOverlay,
};

export function resolveRenderer(name: string): RendererComponent {
  const renderer = RENDERER_REGISTRY[name];
  if (!renderer) throw new Error(`Unknown visual_type '${name}'. Available: ${Object.keys(RENDERER_REGISTRY).join(', ')}`);
  return renderer;
}
