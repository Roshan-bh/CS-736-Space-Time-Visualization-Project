/**
 * Maps ReportingLaboratory (or related location strings) to a canonical province
 * or territory name that matches TopoJSON feature properties.name.
 *
 * Add or edit entries when your CSV uses lab names, abbreviations, or regions
 * that do not exactly match map names (e.g. "ON — Toronto PHL" → "Ontario").
 *
 * Matching is case-insensitive after trim. Unmapped labs are skipped during aggregation.
 */

// Add lowercase lab/region keys from your CSV → exact TopoJSON province name.
/** @type { Record<string, string> } */
const LAB_TO_PROVINCE = {};

/**
 * Normalize minor spelling differences between CSV and map (e.g. Yukon).
 * Keys: lowercase trimmed input; values: exact TopoJSON name.
 */
const ALIAS_TO_CANONICAL = {
  yukon: "Yukon Territory",
  "yukon territory": "Yukon Territory",
  pei: "Prince Edward Island",
  "prince edward island": "Prince Edward Island",
  nl: "Newfoundland and Labrador",
  "newfoundland": "Newfoundland and Labrador",
  "labrador": "Newfoundland and Labrador",
};

/**
 * @param {string | undefined | null} raw
 * @returns {string | null} Canonical province name or null if unknown
 */
export function mapReportingLaboratoryToProvince(raw) {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const lower = s.toLowerCase();

  if (LAB_TO_PROVINCE[lower]) return LAB_TO_PROVINCE[lower];
  if (ALIAS_TO_CANONICAL[lower]) return ALIAS_TO_CANONICAL[lower];

  // Substring match for labels that embed a province name (last resort)
  const provinces = [
    "British Columbia",
    "Alberta",
    "Saskatchewan",
    "Manitoba",
    "Ontario",
    "Quebec",
    "New Brunswick",
    "Nova Scotia",
    "Prince Edward Island",
    "Newfoundland and Labrador",
    "Yukon Territory",
    "Northwest Territories",
    "Nunavut",
  ];
  for (const p of provinces) {
    if (lower.includes(p.toLowerCase())) return p;
  }

  return null;
}

/**
 * Normalize a province string from CSV or UI to match TopoJSON names.
 * @param {string} name
 * @returns {string | null}
 */
export function normalizeProvinceName(name) {
  if (!name) return null;
  const lower = String(name).trim().toLowerCase();
  if (ALIAS_TO_CANONICAL[lower]) return ALIAS_TO_CANONICAL[lower];
  return String(name).trim();
}
