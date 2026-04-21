/**
 * Single-track range control with two thumbs (week indices). No external deps.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export default function WeekRangeSlider({
  min,
  max,
  value,
  onChange,
  disabled,
  idPrefix = "week-range",
}) {
  const trackRef = useRef(null);
  const dragRef = useRef(/** @type {0 | 1 | null} */ (null));
  const valueRef = useRef(value);

  useLayoutEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [lo, hi] = value;
  const span = Math.max(1, max - min);

  const xToIndex = useCallback(
    (clientX) => {
      const el = trackRef.current;
      if (!el) return min;
      const r = el.getBoundingClientRect();
      const t = r.width > 0 ? (clientX - r.left) / r.width : 0;
      const raw = min + t * (max - min);
      return Math.round(Math.min(max, Math.max(min, raw)));
    },
    [min, max]
  );

  useEffect(() => {
    const onMove = (e) => {
      const thumb = dragRef.current;
      if (thumb === null) return;
      const idx = xToIndex(e.clientX);
      const [a, b] = valueRef.current;
      if (thumb === 0) {
        const nlo = Math.min(idx, b);
        if (nlo !== a) onChange([nlo, b]);
      } else {
        const nhi = Math.max(idx, a);
        if (nhi !== b) onChange([a, nhi]);
      }
    };
    const end = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [onChange, xToIndex]);

  const pct = (v) => ((v - min) / span) * 100;
  const leftPct = pct(lo);
  const rightPct = pct(hi);

  const startDrag = (which) => (e) => {
    if (disabled) return;
    e.preventDefault();
    dragRef.current = which;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onTrackPointerDown = (e) => {
    if (disabled || e.button !== 0) return;
    const idx = xToIndex(e.clientX);
    const [a, b] = valueRef.current;
    const distLo = Math.abs(idx - a);
    const distHi = Math.abs(idx - b);
    if (distLo <= distHi) {
      const nlo = Math.min(idx, b);
      onChange([nlo, b]);
      dragRef.current = 0;
    } else {
      const nhi = Math.max(idx, a);
      onChange([a, nhi]);
      dragRef.current = 1;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onKeyThumb =
    (which) =>
    (e) => {
      if (disabled) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 1 : -1;
      const [a, b] = valueRef.current;
      if (which === 0) {
        const nlo = Math.min(Math.max(min, a + delta), b);
        if (nlo !== a) onChange([nlo, b]);
      } else {
        const nhi = Math.max(Math.min(max, b + delta), a);
        if (nhi !== b) onChange([a, nhi]);
      }
    };

  const bumpLo = (delta) => {
    if (disabled) return;
    const [a, b] = valueRef.current;
    const nlo = Math.min(Math.max(min, a + delta), b);
    if (nlo !== a) onChange([nlo, b]);
  };

  const bumpHi = (delta) => {
    if (disabled) return;
    const [a, b] = valueRef.current;
    const nhi = Math.max(Math.min(max, b + delta), a);
    if (nhi !== b) onChange([a, nhi]);
  };

  const idLo = `${idPrefix}-lo`;
  const idHi = `${idPrefix}-hi`;

  return (
    <div
      className={`week-range-slider ${disabled ? "is-disabled" : ""}`}
      aria-disabled={disabled}
    >
      <div className="week-range-slider-inner">
        <div
          className="week-range-nudge week-range-nudge--start"
          role="group"
          aria-label="Adjust start of week range"
        >
          <button
            type="button"
            className="week-range-nudge-btn"
            onClick={() => bumpLo(-1)}
            disabled={disabled || lo <= min}
            aria-label="Move range start one week earlier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="week-range-nudge-btn"
            onClick={() => bumpLo(1)}
            disabled={disabled || lo >= hi}
            aria-label="Move range start one week later"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div
          ref={trackRef}
          className="week-range-track"
          onPointerDown={onTrackPointerDown}
          role="presentation"
        >
          <div className="week-range-rail" />
          <div
            className="week-range-fill"
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(0, rightPct - leftPct)}%`,
            }}
          />
          <button
            type="button"
            id={idLo}
            className="week-range-thumb"
            style={{ left: `${leftPct}%` }}
            disabled={disabled}
            aria-label="Week range start"
            aria-valuemin={min}
            aria-valuemax={hi}
            aria-valuenow={lo}
            role="slider"
            onPointerDown={startDrag(0)}
            onKeyDown={onKeyThumb(0)}
          />
          <button
            type="button"
            id={idHi}
            className="week-range-thumb"
            style={{ left: `${rightPct}%` }}
            disabled={disabled}
            aria-label="Week range end"
            aria-valuemin={lo}
            aria-valuemax={max}
            aria-valuenow={hi}
            role="slider"
            onPointerDown={startDrag(1)}
            onKeyDown={onKeyThumb(1)}
          />
        </div>
        <div
          className="week-range-nudge week-range-nudge--end"
          role="group"
          aria-label="Adjust end of week range"
        >
          <button
            type="button"
            className="week-range-nudge-btn"
            onClick={() => bumpHi(-1)}
            disabled={disabled || hi <= lo}
            aria-label="Move range end one week earlier"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="week-range-nudge-btn"
            onClick={() => bumpHi(1)}
            disabled={disabled || hi >= max}
            aria-label="Move range end one week later"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
