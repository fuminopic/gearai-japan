export const HOME_GEAR_DRAG_THRESHOLD_PX = 8;

/**
 * A small movement is a tap. Anything beyond this threshold belongs to the
 * browser's native scroll gesture and must not activate a gear detail link.
 */
export function movedBeyondHomeGearTapThreshold(
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
) {
  return Math.hypot(currentX - startX, currentY - startY) > HOME_GEAR_DRAG_THRESHOLD_PX;
}
