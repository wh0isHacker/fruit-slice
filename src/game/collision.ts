import { Point } from '../types';

export interface SliceIntersectionResult {
  hit: boolean;
  sliceAngle: number;
  sliceSpeed: number;
  cutNormalX: number;
  cutNormalY: number;
  contactX: number;
  contactY: number;
}

/**
 * Checks if line segment (p1 -> p2) intersects circle at (cx, cy) with given radius.
 * Accurately detects high-speed fast swipe tunneling through fruit objects.
 */
export function checkSegmentCircleIntersection(
  p1: Point,
  p2: Point,
  cx: number,
  cy: number,
  radius: number
): SliceIntersectionResult {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const segLenSq = dx * dx + dy * dy;

  // If swipe didn't move
  if (segLenSq < 1) {
    const distSq = (cx - p1.x) * (cx - p1.x) + (cy - p1.y) * (cy - p1.y);
    return {
      hit: distSq <= radius * radius,
      sliceAngle: 0,
      sliceSpeed: 0,
      cutNormalX: 0,
      cutNormalY: 1,
      contactX: cx,
      contactY: cy,
    };
  }

  // Project vector (circle - p1) onto segment vector (p2 - p1)
  // t clamped to [0, 1] gives closest point on segment to circle center
  let t = ((cx - p1.x) * dx + (cy - p1.y) * dy) / segLenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = p1.x + t * dx;
  const closestY = p1.y + t * dy;

  const distX = cx - closestX;
  const distY = cy - closestY;
  const distSq = distX * distX + distY * distY;

  const hit = distSq <= radius * radius;
  const sliceAngle = Math.atan2(dy, dx);
  const sliceSpeed = Math.sqrt(segLenSq);

  // Perpendicular normal vector to the blade cut line
  // If swipe is along (dx, dy), normal is (-dy, dx) normalized
  const segLen = Math.sqrt(segLenSq);
  const cutNormalX = -dy / segLen;
  const cutNormalY = dx / segLen;

  return {
    hit,
    sliceAngle,
    sliceSpeed,
    cutNormalX,
    cutNormalY,
    contactX: closestX,
    contactY: closestY,
  };
}
