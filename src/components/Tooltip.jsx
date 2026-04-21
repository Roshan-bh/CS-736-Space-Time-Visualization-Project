/**
 * Simple positioned tooltip for D3-driven hover states.
 */

export default function Tooltip({ visible, x, y, children }) {
  if (!visible) return null;

  return (
    <div
      className="viz-tooltip"
      style={{ left: x, top: y }}
      role="status"
    >
      {children}
    </div>
  );
}
