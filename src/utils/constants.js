/**
 * Central configuration for CSV column names and virus definitions.
 *
 * Edit CSV_COLUMNS if your RVD_CurrentWeekTable.csv uses different header names.
 * Expected logical fields:
 *   - week: epidemiological week label or number (string or number)
 *   - date: week ending or reference date (ISO string preferred)
 *   - ReportingLaboratory: lab or region label (mapped to province via provinceMapping.js)
 *   - Per-virus test and positive counts (column names below)
 */

/** @typedef {'covid19' | 'influenza' | 'influenza_a' | 'influenza_b' | 'rsv' | 'hpiv' | 'adv' | 'hmpv' | 'evrv' | 'hcov'} VirusId */
/** @typedef {'positives' | 'positives_population' | 'tests' | 'positivity'} MetricId */

/**
 * Per-virus CSV columns. `tests` and `positives` are column name(s); use an array for `positives`
 * when the file splits counts across multiple columns (e.g. HPIV types).
 * Order here defines the Virus dropdown order.
 */
export const CSV_COLUMNS = {
  week: "week",
  date: "date",
  reportingLab: "ReportingLaboratory",
  viruses: {
    covid19: {
      id: "covid19",
      label: "SARS-CoV-2",
      tests: "test_sarscov2",
      positives: "pos_sarscov2",
    },
    influenza: {
      id: "influenza",
      label: "Influenza",
      tests: "test_flu",
      positives: "pos_flu",
    },
    influenza_a: {
      id: "influenza_a",
      label: "Influenza A",
      tests: "test_flu",
      positives: "pos_flua",
    },
    influenza_b: {
      id: "influenza_b",
      label: "Influenza B",
      tests: "test_flu",
      positives: "pos_flub",
    },
    rsv: {
      id: "rsv",
      label: "RSV",
      tests: "test_rsv",
      positives: "pos_rsv",
    },
    hpiv: {
      id: "hpiv",
      label: "HPIV",
      tests: "test_hpiv",
      positives: [
        "pos_hpiv_1",
        "pos_hpiv_2",
        "pos_hpiv_3",
        "pos_hpiv_4",
        "pos_hpiv_other",
      ],
    },
    adv: {
      id: "adv",
      label: "ADV",
      tests: "test_adv",
      positives: "pos_adv",
    },
    hmpv: {
      id: "hmpv",
      label: "HMPV",
      tests: "test_hmpv",
      positives: "pos_hmpv",
    },
    evrv: {
      id: "evrv",
      label: "EV/RV",
      tests: "test_evrv",
      positives: "pos_evrv",
    },
    hcov: {
      id: "hcov",
      label: "HCoV",
      tests: "test_hcov",
      positives: "pos_hcov",
    },
  },
};

/** @type { { id: VirusId, label: string }[] } */
export const VIRUS_OPTIONS = Object.values(CSV_COLUMNS.viruses).map((v) => ({
  id: v.id,
  label: v.label,
}));

/** North — used for low–sample-size cue on the map. */
export const CANADA_TERRITORY_NAMES = [
  "Yukon Territory",
  "Northwest Territories",
  "Nunavut",
];

/** Sum of tests below this (over the selected week range) flags a territory as sparse. */
export const TERRITORY_SPARSE_TEST_THRESHOLD = 500;

/** 2021 Census population estimates for provinces and territories. */
export const CANADA_PROVINCE_POPULATIONS = {
  Ontario: 16191000,
  Quebec: 9058000,
  "British Columbia": 5683000,
  Alberta: 5041000,
  Manitoba: 1507000,
  Saskatchewan: 1266000,
  "Nova Scotia": 1092000,
  "New Brunswick": 869000,
  "Newfoundland and Labrador": 550000,
  "Prince Edward Island": 180000,
  "Northwest Territories": 45000,
  "Yukon Territory": 45000,
  Nunavut: 40000,
};

export const CANADA_TOTAL_POPULATION = Object.values(CANADA_PROVINCE_POPULATIONS).reduce(
  (sum, population) => sum + population,
  0
);

/** @type { { id: MetricId, label: string }[] } */
export const METRIC_OPTIONS = [
  { id: "positives", label: "Positive tests" },
  { id: "positives_population", label: "Population burden (%)" },
  { id: "tests", label: "Test volume" },
  { id: "positivity", label: "Positivity rate (%)" },
];

/**
 * Province/territory order for heatmap rows (matches common cartographic reading).
 * Names must match TopoJSON feature properties.name after normalization.
 */
export const PROVINCE_ORDER = [
  "British Columbia",
  "Yukon Territory",
  "Northwest Territories",
  "Nunavut",
  "Alberta",
  "Saskatchewan",
  "Manitoba",
  "Ontario",
  "Quebec",
  "Newfoundland and Labrador",
  "New Brunswick",
  "Nova Scotia",
  "Prince Edward Island",
];

/** Canadian province/territory postal-style abbreviations for map labels (keys match TopoJSON `properties.name`). */
export const PROVINCE_NAME_TO_ABBREV = {
  "British Columbia": "BC",
  Alberta: "AB",
  Saskatchewan: "SK",
  Manitoba: "MB",
  Ontario: "ON",
  Quebec: "QC",
  "Newfoundland and Labrador": "NL",
  "New Brunswick": "NB",
  "Nova Scotia": "NS",
  "Prince Edward Island": "PE",
  "Yukon Territory": "YT",
  "Northwest Territories": "NT",
  Nunavut: "NU",
};
