/**
 * Loads CSV + TopoJSON, builds aggregates and derived lists for visualizations.
 */

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";

import topology from "../data/ProvincesTerritories.topo.json";
import csvUrl from "../data/RVD_CurrentWeekTable.csv?url";

import { PROVINCE_ORDER, CSV_COLUMNS } from "../utils/constants.js";
import { topoToFeatureCollection } from "../utils/topoHelpers.js";
import {
  aggregateByProvinceWeek,
  normalizeRows,
  sortedWeekKeys,
  weekKeysInRange,
  sumMetricByProvinceOverWeeks,
  nationalSeriesForWeeks,
  provinceSeriesForWeeks,
  heatmapMatrix,
} from "../utils/dataProcessing.js";

/**
 * @param {import('../utils/constants.js').VirusId} virusId
 * @param {import('../utils/constants.js').MetricId} metric
 * @param {[number, number] | null} userWeekRange inclusive indices, or null = full data span
 * @param {string | null} selectedProvince
 * @param {import('../utils/constants.js').VirusId[]} compareVirusIds viruses to overlay on the trend chart (compare mode)
 */
export function useVirusData(
  virusId,
  metric,
  userWeekRange,
  selectedProvince,
  compareVirusIds = []
) {
  const [loadState, setLoadState] = useState({
    status: "loading",
    error: null,
    rawRows: /** @type {Record<string, string>[] | null} */ (null),
  });

  const geo = useMemo(() => topoToFeatureCollection(topology), []);

  useEffect(() => {
    let cancelled = false;

    d3.csv(csvUrl)
      .then((rows) => {
        if (cancelled) return;
        setLoadState({ status: "ready", error: null, rawRows: rows });
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadState({
          status: "error",
          error: String(e?.message ?? e),
          rawRows: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const provinceNamesFromMap = useMemo(() => {
    const names = geo.features.map((f) => f.properties?.name).filter(Boolean);
    return /** @type {string[]} */ (names);
  }, [geo]);

  /** Provinces in stable order: PROVINCE_ORDER intersected with map names, then any extras */
  const provinceList = useMemo(() => {
    const set = new Set(provinceNamesFromMap);
    const ordered = PROVINCE_ORDER.filter((p) => set.has(p));
    const extra = provinceNamesFromMap.filter((p) => !ordered.includes(p));
    return [...ordered, ...extra.sort()];
  }, [provinceNamesFromMap]);

  const records = useMemo(() => {
    if (!loadState.rawRows) return [];
    return normalizeRows(loadState.rawRows);
  }, [loadState.rawRows]);

  const weekKeysSorted = useMemo(() => sortedWeekKeys(records), [records]);

  const weekRangeIndices = useMemo(() => {
    const n = weekKeysSorted.length;
    if (n === 0) return [0, 0];
    const max = n - 1;
    if (userWeekRange == null) return [0, max];
    const a = Math.max(0, Math.min(userWeekRange[0], max));
    const b = Math.max(0, Math.min(userWeekRange[1], max));
    return a <= b ? [a, b] : [b, a];
  }, [weekKeysSorted, userWeekRange]);

  const agg = useMemo(
    () => aggregateByProvinceWeek(records, virusId),
    [records, virusId]
  );

  const weeksInRange = useMemo(() => {
    if (weekKeysSorted.length === 0) return [];
    const lo = Math.max(
      0,
      Math.min(weekRangeIndices[0], weekKeysSorted.length - 1)
    );
    const hi = Math.max(
      0,
      Math.min(weekRangeIndices[1], weekKeysSorted.length - 1)
    );
    return weekKeysInRange(weekKeysSorted, [lo, hi]);
  }, [weekKeysSorted, weekRangeIndices]);

  const choroplethByProvince = useMemo(
    () =>
      sumMetricByProvinceOverWeeks(agg, provinceList, weeksInRange, metric),
    [agg, provinceList, weeksInRange, metric]
  );

  /** National trend — always computed for comparison when a province is selected. */
  const nationalTrendSeries = useMemo(() => {
    if (weeksInRange.length === 0) return [];
    return nationalSeriesForWeeks(agg, weeksInRange, metric);
  }, [agg, weeksInRange, metric]);

  /** Province trend — only when a region is selected. */
  const provinceTrendSeries = useMemo(() => {
    if (!selectedProvince || weeksInRange.length === 0) return null;
    return provinceSeriesForWeeks(agg, selectedProvince, weeksInRange, metric);
  }, [agg, weeksInRange, metric, selectedProvince]);

  const heatmap = useMemo(
    () => heatmapMatrix(agg, provinceList, weeksInRange, metric),
    [agg, provinceList, weeksInRange, metric]
  );

  /**
   * One series per virus for compare mode (national or selected-province aggregate).
   * Order matches `compareVirusIds`.
   */
  const compareMultiSeries = useMemo(() => {
    if (!weeksInRange.length || !compareVirusIds.length) return [];
    return compareVirusIds.map((vid) => {
      const a = aggregateByProvinceWeek(records, vid);
      const series = selectedProvince
        ? provinceSeriesForWeeks(a, selectedProvince, weeksInRange, metric)
        : nationalSeriesForWeeks(a, weeksInRange, metric);
      return {
        virusId: vid,
        label: CSV_COLUMNS.viruses[vid]?.label ?? vid,
        series,
      };
    });
  }, [records, weeksInRange, metric, selectedProvince, compareVirusIds]);

  /**
   * Per compared virus: national series + optional province series (same order as `compareVirusIds`).
   * For small-multiple “vs national” charts below the main trend.
   */
  const compareProvincialVsNational = useMemo(() => {
    if (!weeksInRange.length || !compareVirusIds.length) return [];
    return compareVirusIds.map((vid) => {
      const a = aggregateByProvinceWeek(records, vid);
      const national = nationalSeriesForWeeks(a, weeksInRange, metric);
      const provinceSeries = selectedProvince
        ? provinceSeriesForWeeks(a, selectedProvince, weeksInRange, metric)
        : null;
      return {
        virusId: vid,
        label: CSV_COLUMNS.viruses[vid]?.label ?? vid,
        national,
        provinceSeries,
      };
    });
  }, [records, weeksInRange, metric, selectedProvince, compareVirusIds]);

  return {
    loadState,
    geo,
    provinceList,
    weekKeysSorted,
    weekRangeIndices,
    choroplethByProvince,
    nationalTrendSeries,
    provinceTrendSeries,
    heatmap,
    agg,
    weeksInRange,
    compareMultiSeries,
    compareProvincialVsNational,
    /** Normalized CSV rows (province + week); used for multi-province × multi-virus comparison. */
    records,
  };
}
