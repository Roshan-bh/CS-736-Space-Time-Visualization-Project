/**
 * Info control opening a modal with Data guide + Data notes (FluWatch-style).
 */

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { CHART_INFO } from "../data/chartInfoContent.js";

/**
 * @param {{ chartId: keyof typeof CHART_INFO, titleSuffix?: string }} props
 * @param {string} [titleSuffix] — e.g. virus name; shown after the base title for per-panel mini charts.
 */
export default function ChartInfoButton({ chartId, titleSuffix }) {
  const info = CHART_INFO[chartId];
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  const dialogTitle =
    info && titleSuffix ? `${info.title} — ${titleSuffix}` : info?.title ?? "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!info) return null;

  const modal =
    open &&
    createPortal(
      <div
        className="chart-info-backdrop"
        role="presentation"
        onClick={() => setOpen(false)}
      >
        <div
          className="chart-info-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="chart-info-dialog-header">
            <h2 id={titleId} className="chart-info-dialog-title">
              {dialogTitle}
            </h2>
            <button
              type="button"
              className="chart-info-close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <div id={bodyId} className="chart-info-dialog-body">
            <h3 className="chart-info-section-title">Data guide</h3>
            <div className="chart-info-prose">
              {info.guide.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <h3 className="chart-info-section-title">Data notes</h3>
            <ul className="chart-info-notes">
              {info.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
          <footer className="chart-info-dialog-footer">
            <button
              type="button"
              className="btn-chart-info-done"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </footer>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        className="btn-chart-info"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`About this chart: ${dialogTitle}`}
        title="About this chart"
      >
        <svg
          className="btn-chart-info-svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="12" cy="8" r="1.35" fill="currentColor" />
          <path
            d="M12 11v6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {modal}
    </>
  );
}
