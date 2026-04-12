/**
 * CSV loading, filtering, aggregation, and metric helpers for RVD-style tables.
 */

import { CSV_COLUMNS } from "./constants.js";
import { mapReportingLaboratoryToProvince, normalizeProvinceName } from "./provinceMapping.js";

/**
 * Parse numeric cells; empty or non-numeric → NaN (treated as 0 when summing).
 * @param {string | undefined} v
 */
export function parseNumber(v) {
  if (v == null || v === "") return NaN;
  const s = String(v).trim();
  if (/^n\/?a$/i.test(s)) return NaN;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Sum numeric values from one or more CSV columns (skips NaN / N/A).
 * @param {Record<string, string>} row
 * @param {string | string[]} colOrCols
 */
function sumColumns(row, colOrCols) {
  const cols = Array.isArray(colOrCols) ? colOrCols : [colOrCols];
  let sum = 0;
  for (const c of cols) {
    const n = parseNumber(row[c]);
    if (Number.isFinite(n)) sum += n;
  }
  return sum;
}

/**
 * Coerce one CSV row to typed fields using CSV_COLUMNS.
 * @param {Record<string, string>} row
 * @param {import('./constants.js').VirusId} virusId
 */
export function extractVirusCounts(row, virusId) {
  const cfg = CSV_COLUMNS.viruses[virusId];
  const tests = sumColumns(row, cfg.tests);
  const positives = sumColumns(row, cfg.positives);
  return { tests, positives };
}

/**
 * @param {number} positives
 * @param {number} tests
 * @returns {number | null} Percent 0–100, or null if tests === 0
 */
export function positivityRate(positives, tests) {
  if (tests <= 0) return null;
  return (positives / tests) * 100;
}

/**
 * @param {{ positives: number, tests: number }} counts
 * @param {import('./constants.js').MetricId} metric
 */
export function metricValue(counts, metric) {
  if (metric === "positives") return counts.positives;
  if (metric === "tests") return counts.tests;
  const p = positivityRate(counts.positives, counts.tests);
  return p == null ? 0 : p;
}

/**
 * Stable key for province + week label.
 * @param {string} province
 * @param {string} weekKey
 */
export function aggKey(province, weekKey) {
  return `${province}::${weekKey}`;
}

/**
 * Turn raw CSV rows into normalized records with province and week keys.
 * Rows without a resolvable province are dropped.
 * @param {Record<string, string>[]} rows
 */
export function normalizeRows(rows) {
  const out = [];
  for (const row of rows) {
    const lab = row[CSV_COLUMNS.reportingLab];
    const province = mapReportingLaboratoryToProvince(lab);
    if (!province) continue;

    const weekRaw = row[CSV_COLUMNS.week];
    const dateRaw = row[CSV_COLUMNS.date];
    const weekKey =
      weekRaw != null && String(weekRaw).trim() !== ""
        ? String(weekRaw).trim()
        : dateRaw
          ? String(dateRaw).trim()
          : "";

    if (!weekKey) continue;

    out.push({
      province,
      weekKey,
      date: dateRaw ? String(dateRaw) : "",
      raw: row,
    });
  }
  return out;
}

/**
 * Aggregate by province and week: sum tests and positives per virus.
 * @param {ReturnType<typeof normalizeRows>} records
 * @param {import('./constants.js').VirusId} virusId
 * @returns {Map<string, { province: string, weekKey: string, tests: number, positives: number }>}
 */
export function aggregateByProvinceWeek(records, virusId) {
  /** @type {Map<string, { province: string, weekKey: string, tests: number, positives: number }>} */
  const map = new Map();

  for (const rec of records) {
    const { tests, positives } = extractVirusCounts(rec.raw, virusId);
    const key = aggKey(rec.province, rec.weekKey);
    const prev = map.get(key);
    if (prev) {
      prev.tests += tests;
      prev.positives += positives;
    } else {
      map.set(key, {
        province: rec.province,
        weekKey: rec.weekKey,
        tests,
        positives,
      });
    }
  }
  return map;
}

/**
 * Sorted unique week keys (lexicographic; use ISO dates in CSV for best sort).
 * @param {ReturnType<typeof normalizeRows>} records
 */
export function sortedWeekKeys(records) {
  const set = new Set(records.map((r) => r.weekKey));
  return Array.from(set).sort(compareWeekKeys);
}

/**
 * Heuristic: numeric week numbers first, else string compare.
 * @param {string} a
 * @param {string} b
 */
function compareWeekKeys(a, b) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.localeCompare(b, undefined, { numeric: true });
}

/**
 * @param {string[]} weekKeysSorted
 * @param {[number, number]} rangeIndices inclusive indices into weekKeysSorted
 */
export function weekKeysInRange(weekKeysSorted, rangeIndices) {
  const [a, b] = rangeIndices;
  const lo = Math.max(0, Math.min(a, b));
  const hi = Math.min(weekKeysSorted.length - 1, Math.max(a, b));
  return weekKeysSorted.slice(lo, hi + 1);
}

/**
 * Choropleth values per province over a week range: sum tests/positives, or positivity from totals.
 * @param {Map<string, { province: string, weekKey: string, tests: number, positives: number }>} agg
 * @param {string[]} provinces
 * @param {string[]} weekKeysInRange
 * @param {import('./constants.js').MetricId} metric
 * @returns {Map<string, number>}
 */
export function sumMetricByProvinceOverWeeks(agg, provinces, weekKeysInRange, metric) {
  /** @type {Map<string, number>} */
  const byProvince = new Map();
  const weekSet = new Set(weekKeysInRange);

  if (metric === "positivity") {
    /** @type {Map<string, { tests: number, positives: number }>} */
    const sums = new Map();
    for (const p of provinces) sums.set(p, { tests: 0, positives: 0 });
    for (const [, row] of agg) {
      if (!weekSet.has(row.weekKey)) continue;
      const s = sums.get(row.province);
      if (s) {
        s.tests += row.tests;
        s.positives += row.positives;
      }
    }
    for (const p of provinces) {
      const s = sums.get(p);
      const rate = s ? positivityRate(s.positives, s.tests) : null;
      byProvince.set(p, rate == null ? 0 : rate);
    }
    return byProvince;
  }

  for (const p of provinces) byProvince.set(p, 0);
  for (const [, row] of agg) {
    if (!weekSet.has(row.weekKey)) continue;
    const add =
      metric === "tests" ? row.tests : row.positives;
    const cur = byProvince.get(row.province) ?? 0;
    byProvince.set(row.province, cur + add);
  }
  return byProvince;
}

/**
 * National time series: for each week in range, aggregate all provinces.
 * @param {Map<string, { province: string, weekKey: string, tests: number, positives: number }>} agg
 * @param {string[]} weekKeysInRange
 * @param {import('./constants.js').MetricId} metric
 */
export function nationalSeriesForWeeks(agg, weekKeysInRange, metric) {
  const keys = [...weekKeysInRange].sort(compareWeekKeys);
  /** @type { { weekKey: string, value: number }[] } */
  const series = [];

  for (const wk of keys) {
    let tests = 0;
    let positives = 0;
    for (const [, row] of agg) {
      if (row.weekKey !== wk) continue;
      tests += row.tests;
      positives += row.positives;
    }
    let value;
    if (metric === "positivity") {
      const p = positivityRate(positives, tests);
      value = p == null ? 0 : p;
    } else if (metric === "tests") {
      value = tests;
    } else {
      value = positives;
    }
    series.push({ weekKey: wk, value });
  }
  return series;
}

/**
 * Province-specific time series (same structure as national).
 * @param {Map<string, { province: string, weekKey: string, tests: number, positives: number }>} agg
 * @param {string} province
 * @param {string[]} weekKeysInRange
 * @param {import('./constants.js').MetricId} metric
 */
export function provinceSeriesForWeeks(agg, province, weekKeysInRange, metric) {
  const keys = [...weekKeysInRange].sort(compareWeekKeys);
  /** @type { { weekKey: string, value: number }[] } */
  const series = [];
  const target = normalizeProvinceName(province);

  for (const wk of keys) {
    let tests = 0;
    let positives = 0;
    for (const [, row] of agg) {
      if (row.weekKey !== wk) continue;
      if (row.province !== target) continue;
      tests += row.tests;
      positives += row.positives;
    }
    let value;
    if (metric === "positivity") {
      const p = positivityRate(positives, tests);
      value = p == null ? 0 : p;
    } else if (metric === "tests") {
      value = tests;
    } else {
      value = positives;
    }
    series.push({ weekKey: wk, value });
  }
  return series;
}

/**
 * Heatmap matrix: rows = provinces, cols = weeks; cell = metric value for that province-week.
 * @param {Map<string, { province: string, weekKey: string, tests: number, positives: number }>} agg
 * @param {string[]} provinceList
 * @param {string[]} weekKeysInRange
 * @param {import('./constants.js').MetricId} metric
 */
export function heatmapMatrix(agg, provinceList, weekKeysInRange, metric) {
  const weeks = [...weekKeysInRange].sort(compareWeekKeys);
  /** @type {Map<string, Map<string, number>>} */
  const lookup = new Map();

  for (const p of provinceList) {
    lookup.set(p, new Map());
  }

  for (const p of provinceList) {
    const rowMap = lookup.get(p);
    for (const wk of weeks) {
      const cell = agg.get(aggKey(p, wk));
      const counts = cell
        ? { positives: cell.positives, tests: cell.tests }
        : { positives: 0, tests: 0 };
      const v = metricValue(counts, metric);
      rowMap.set(wk, v);
    }
  }

  return { provinces: provinceList, weeks, lookup };
}

/**
 * One time series per (province, virus) pair — for comparing multiple regions and pathogens on the same metric.
 * Reuses per-virus aggregates once per distinct virus id.
 *
 * @param {ReturnType<typeof normalizeRows>} records
 * @param {string[]} provinces
 * @param {import('./constants.js').VirusId[]} virusIds
 * @param {string[]} weekKeysInRange
 * @param {import('./constants.js').MetricId} metric
 */
export function crossCompareSeries(
  records,
  provinces,
  virusIds,
  weekKeysInRange,
  metric
) {
  if (!provinces.length || !virusIds.length || !weekKeysInRange.length) return [];

  /** @type {Map<import('./constants.js').VirusId, ReturnType<typeof aggregateByProvinceWeek>>} */
  const aggsByVirus = new Map();
  for (const vid of virusIds) {
    aggsByVirus.set(vid, aggregateByProvinceWeek(records, vid));
  }

  /** @type { { key: string, label: string, province: string, virusId: import('./constants.js').VirusId, series: { weekKey: string, value: number }[] }[] } */
  const out = [];
  for (const prov of provinces) {
    for (const vid of virusIds) {
      const agg = aggsByVirus.get(vid);
      if (!agg) continue;
      const series = provinceSeriesForWeeks(agg, prov, weekKeysInRange, metric);
      const vLabel = CSV_COLUMNS.viruses[vid]?.label ?? vid;
      out.push({
        key: `${prov}::${vid}`,
        label: `${prov} · ${vLabel}`,
        province: prov,
        virusId: vid,
        series,
      });
    }
  }
  return out;
}

/**
 * One chart per virus: each panel’s lines are provinces (same metric / weeks).
 */
export function crossCompareByVirusPanels(
  records,
  provinces,
  virusIds,
  weekKeysInRange,
  metric
) {
  if (!provinces.length || !virusIds.length || !weekKeysInRange.length) return [];

  const palette = [
    "#0c4a6e",
    "#b45309",
    "#047857",
    "#7c3aed",
    "#be123c",
    "#0e7490",
    "#a16207",
    "#4338ca",
    "#15803d",
    "#c2410c",
    "#0369a1",
    "#a21caf",
  ];

  /** @type { { virusId: import('./constants.js').VirusId, virusLabel: string, lines: { key: string, label: string, series: { weekKey: string, value: number }[], color: string, strokeWidth: number }[] }[] } */
  const panels = [];

  for (const vid of virusIds) {
    const agg = aggregateByProvinceWeek(records, vid);
    const virusLabel = CSV_COLUMNS.viruses[vid]?.label ?? vid;
    const lines = provinces.map((prov, i) => ({
      /** Safe for DOM/CSS class names (province names may include spaces). */
      key: `p${i}_${String(prov).replace(/[^a-zA-Z0-9_-]/g, "_")}`,
      label: prov,
      series: provinceSeriesForWeeks(agg, prov, weekKeysInRange, metric),
      color: palette[i % palette.length],
      strokeWidth: 2,
    }));
    panels.push({ virusId: vid, virusLabel, lines });
  }
  return panels;
}
