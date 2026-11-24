import { demoMeta, demoMetrics, demoPredict, demoRanking } from "./demoData.js";

const BASE = import.meta.env.VITE_API_URL || "/api";

async function get(path) {
  const res = await fetch(BASE + path);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || res.statusText);
  return body;
}

// Tries the Flask backend first; falls back to built-in demo data.
export async function createApi() {
  try {
    const meta = await get("/meta");
    return {
      mode: "live",
      meta,
      predict: (region, year) =>
        get(`/predict?region=${encodeURIComponent(region)}&year=${year}`),
      metrics: () => get("/metrics"),
      ranking: (year) => get(`/ranking?year=${year}`),
    };
  } catch {
    return {
      mode: "demo",
      meta: demoMeta,
      predict: async (region, year) => demoPredict(region, year),
      metrics: async () => demoMetrics,
      ranking: async (year) => demoRanking(year),
    };
  }
}
