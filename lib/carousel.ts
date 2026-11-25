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

/** Stops the carousel can rest at; no dots when there's only one. */
export function dotCount(model: CarouselModel): number {
  const stops = model.looping ? model.count : model.maxIndex + 1;
  return stops > 1 ? stops : 0;
}

export function activeDot(index: number, model: CarouselModel): number {
  return model.looping ? itemAt(index, model) : clampIndex(index, model);
}

/** Index to move to for a dot; a looping carousel goes the shortest way round. */
export function dotTarget(index: number, dot: number, model: CarouselModel): number {
  if (!model.looping) return clampIndex(dot, model);
  let delta = dot - itemAt(index, model);
  if (delta > model.count / 2) delta -= model.count;
  if (delta < -model.count / 2) delta += model.count;
  return index + delta;
}

export interface SlotGeometry {
  /** CSS size of one slot. */
  size: string;
  /** CSS expression for one step (slot plus gap), to multiply by a slot number. */
  step: string;
  /** Where slot 0 starts, leaving room for the previous item to peek in. */
  offset: string;
}

/**
 * Slot sizes for `slots` items in view with `gap` between them and `peek` px
 * of the neighbouring items showing at each end.
 */
export function slotGeometry(slots: number, gap: number, peek: number): SlotGeometry {
  // Each end holds the peeking neighbour plus the gap before the first/last slot in view.
  const outer = peek > 0 ? peek + gap : 0;
  const stepAdjust = gap - 2 * outer;
  return {
    size: `calc((100% - ${2 * outer + gap * (slots - 1)}px) / ${slots})`,
    step: `((100% ${stepAdjust < 0 ? "-" : "+"} ${Math.abs(stepAdjust)}px) / ${slots})`,
    offset: `${outer}px`,
  };
}

/** Slots to draw for the current index. */
export function slotsToRender(index: number, model: CarouselModel): number[] {
  if (model.count === 0) return [];
  if (!model.looping) return Array.from({ length: model.count }, (_, i) => i);
  return Array.from({ length: model.visible + 2 }, (_, i) => index - 1 + i);
}
