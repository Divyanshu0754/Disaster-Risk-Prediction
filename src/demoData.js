// Fallback data so the UI runs even when the Flask backend is not started.
// These numbers are placeholders, NOT results from your trained model.
export const LABELS = ["Low", "Moderate", "High", "Very High"];
export const THRESHOLDS = [30, 50, 70];

const REGIONS = [
  "India", "Japan", "Brazil", "Indonesia", "Philippines",
  "Nigeria", "Germany", "United States", "Australia", "Bangladesh",
];
const YEARS = Array.from({ length: 25 }, (_, i) => 2000 + i);

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

const HISTORY = {};
REGIONS.forEach((r, idx) => {
  const rand = rng(idx * 97 + 13);
  let v = 40 + rand() * 40;
  HISTORY[r] = YEARS.map((year) => {
    v = Math.min(95, Math.max(8, v + (rand() - 0.5) * 6));
    return { year, wri: +v.toFixed(2) };
  });
});

export const demoMeta = {
  regions: REGIONS,
  years: YEARS,
  total_regions: REGIONS.length,
  year_min: YEARS[0],
  year_max: YEARS[YEARS.length - 1],
  thresholds: THRESHOLDS,
  labels: LABELS,
  scale_max: 100,
  r2: null,
};

export function levelOf(v, thresholds = THRESHOLDS, labels = LABELS) {
  let i = 0;
  while (i < thresholds.length && v > thresholds[i]) i++;
  return labels[i];
}

export function demoPredict(region, year) {
  const hist = HISTORY[region];
  const row = hist.find((h) => h.year === Number(year));
  if (!row) throw new Error("No data available for this region and year.");
  const predicted = +(row.wri + 0.8).toFixed(2);
  return {
    region,
    year: Number(year),
    forecast_year: Number(year) + 1,
    previous_wri: row.wri,
    predicted_wri: predicted,
    risk_level: levelOf(predicted),
    history: hist,
  };
}

export function demoRanking(year) {
  return REGIONS.map((r) => ({
    region: r,
    wri: HISTORY[r].find((h) => h.year === Number(year))?.wri ?? 0,
  }))
    .sort((a, b) => b.wri - a.wri)
    .slice(0, 10);
}

export const demoMetrics = {
  demo: true,
  labels: LABELS,
  thresholds: THRESHOLDS,
  test_samples: 400,
  models: [
    { name: "MLP Neural Network", accuracy: 0.86, precision: 0.85, recall: 0.86, f1: 0.85, train_time: 42.3, r2: 0.875, rmse: 3.1,
      confusion: [[92, 8, 0, 0], [7, 96, 9, 0], [0, 10, 88, 6], [0, 0, 7, 77]] },
    { name: "Random Forest", accuracy: 0.83, precision: 0.83, recall: 0.83, f1: 0.83, train_time: 6.1, r2: 0.84, rmse: 3.6,
      confusion: [[90, 10, 0, 0], [9, 92, 11, 0], [0, 12, 84, 8], [0, 0, 9, 75]] },
    { name: "Gradient Boosting", accuracy: 0.84, precision: 0.84, recall: 0.84, f1: 0.84, train_time: 9.4, r2: 0.85, rmse: 3.4,
      confusion: [[91, 9, 0, 0], [8, 94, 10, 0], [0, 11, 86, 7], [0, 0, 8, 76]] },
    { name: "Linear Regression", accuracy: 0.78, precision: 0.78, recall: 0.78, f1: 0.78, train_time: 0.02, r2: 0.79, rmse: 4.5,
      confusion: [[85, 15, 0, 0], [13, 86, 13, 0], [0, 16, 78, 10], [0, 0, 12, 72]] },
  ],
};
