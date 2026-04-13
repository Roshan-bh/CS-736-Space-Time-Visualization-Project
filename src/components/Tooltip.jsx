/**
 * Simple positioned tooltip for D3-driven hover states.
 * Stays mounted briefly after `visible` goes false so the CSS fade-out transition plays.
 */

import { useEffect, useRef, useState } from "react";

export default function Tooltip({ visible, x, y, children }) {
  const [mounted, setMounted] = useState(visible);
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      clearTimeout(timerRef.current);
      setMounted(true);
    } else {
      // keep mounted for the transition duration, then unmount
      timerRef.current = setTimeout(() => setMounted(false), 130);
    }
    return () => clearTimeout(timerRef.current);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={`viz-tooltip${visible ? "" : " viz-tooltip--hidden"}`}
      style={{ left: x, top: y }}
      role="status"
    >
      {children}
    </div>
  );
}
