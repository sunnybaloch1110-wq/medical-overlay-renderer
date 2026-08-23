export type OverlayRenderProps = {
  durationInSeconds: number;
  id?: string;
  concept?: string;
  transcript?: string;
  visualType?: string;
  renderer?: string;
  props?: Record<string, unknown>;
};
