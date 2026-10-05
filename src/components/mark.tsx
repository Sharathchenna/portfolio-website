/** A 4×4 Bayer-dithered gradient: the portrait's algorithm, reduced to a logo. */
export const MARK_PATH =
  "M0 0h4v4h-4zM8 0h4v4h-4zM4 4h4v4h-4zM12 4h4v4h-4zM0 8h4v4h-4zM8 8h4v4h-4zM12 8h4v4h-4zM4 12h4v4h-4zM8 12h4v4h-4zM12 12h4v4h-4z";

export function Mark({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden focusable={false} className={className} shapeRendering="crispEdges">
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  );
}
