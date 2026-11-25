/**
 * Carousel paging. Positions are "slots": slot n is drawn at n steps along the
 * track. A non-looping carousel has one slot per item. A looping one has
 * endless slots, each showing item (slot mod count), and only draws the slots
 * in view plus one either side, so it never repeats work or has an end to hit.
 */
export interface CarouselModel {
  count: number;
  /** Slots the view is divided into; sets each item's size. Fewer items leave the end slots empty. */
  slots: number;
  /** Items in view at once, never more than there are. */
  visible: number;
  looping: boolean;
  /** Last index a non-looping carousel can scroll to. */
  maxIndex: number;
}

export const MAX_VISIBLE = 12;

export function carouselModel(count: number, visibleCount: number | undefined, infinite: boolean | undefined): CarouselModel {
  const slots = Math.max(1, Math.min(MAX_VISIBLE, Math.round(visibleCount ?? 3)));
  const visible = Math.min(slots, Math.max(1, count));
  // Looping only makes sense when there's something out of view to loop to.
  const looping = Boolean(infinite) && count > visible;
  return { count, slots, visible, looping, maxIndex: Math.max(0, count - visible) };
}

/** Pull a saved index back into range after items or settings change. */
export function clampIndex(index: number, model: CarouselModel): number {
  return model.looping ? index : Math.min(model.maxIndex, Math.max(0, index));
}

export function canStep(index: number, delta: number, model: CarouselModel): boolean {
  if (model.looping) return true;
  return clampIndex(index + delta, model) !== clampIndex(index, model);
}

export function stepIndex(index: number, delta: number, model: CarouselModel): number {
  return clampIndex(index + delta, model);
}

/** Which item a slot shows. */
export function itemAt(slot: number, model: CarouselModel): number {
  if (model.count === 0) return 0;
  return ((slot % model.count) + model.count) % model.count;
}

/** Slots to draw for the current index. */
export function slotsToRender(index: number, model: CarouselModel): number[] {
  if (model.count === 0) return [];
  if (!model.looping) return Array.from({ length: model.count }, (_, i) => i);
  return Array.from({ length: model.visible + 2 }, (_, i) => index - 1 + i);
}
