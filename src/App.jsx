import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { createApi } from "./api.js";
import { levelColor } from "./colors.js";
import Gauge from "./components/Gauge.jsx";
import TrendChart from "./components/TrendChart.jsx";
import ModelComparison from "./components/ModelComparison.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "compare", label: "Model Comparison", icon: "▥" },
  { id: "ranking", label: "Risk Ranking", icon: "◉" },
  { id: "about", label: "About", icon: "ⓘ" },
];

export default function App() {
  const [api, setApi] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [region, setRegion] = useState("");
  const [year, setYear] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    createApi().then((a) => {
      setApi(a);
      setRegion(a.meta.regions[0] || "");
      setYear(a.meta.years[a.meta.years.length - 1] || "");
      a.metrics().then(setMetrics).catch(() => setMetrics(null));
    });
  }, []);

  async function predict() {
    if (!api) return;
    setLoading(true);
    setError("");
    try {
      setResult(await api.predict(region, year));
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (api && page === "ranking" && year) {
      api.ranking(year).then(setRanking).catch(() => setRanking([]));
    }
  }, [api, page, year]);

  if (!api) return <div className="boot">Loading dashboard…</div>;

  const meta = api.meta;
  const level = result?.risk_level;
  const mlp = metrics?.models?.find((m) => /mlp|neural/i.test(m.name));
  const r2 = mlp?.r2 ?? meta.r2;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">🛡️</div>
        <h1>Disaster Management System</h1>
        <p className="tag">Deep Learning Based Risk Prediction</p>
        <nav>
          {NAV.map((n) => (
            <button key={n.id} className={page === n.id ? "nav active" : "nav"} onClick={() => setPage(n.id)}>
              <span className="ico">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className={`mode ${api.mode}`}>
          {api.mode === "live" ? "Connected to model API" : "Demo data (API not running)"}
        </div>
      </aside>

      <main className="main">
        <header className="banner">
          <span className="warn">⚠</span>
          <em>Smarter Prediction. Safer Tomorrow.</em>
          <span className="active-pill"><i /> Model: {api.mode === "live" ? "Active" : "Demo"}</span>
        </header>

        <section className="stats">
          <Stat icon="🌐" label="Total regions" value={meta.total_regions} />
          <Stat icon="📅" label="Data years" value={`${meta.year_min} – ${meta.year_max}`} />
          <Stat icon="✔" label="Model accuracy (R² score)" value={r2 != null ? `≈ ${(r2 * 100).toFixed(1)}%` : "–"} />
          <Stat icon="⚠" label="Risk alert level" value={level || "–"} color={level ? levelColor(level) : undefined} alert />
        </section>

        {page === "dashboard" && (
          <div className="dash-grid">
            <div className="left-col">
              <section className="card">
                <h3>Select region</h3>
                <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
                  {meta.regions.map((r) => <option key={r}>{r}</option>)}
                </select>
                <h3 className="mt">Select historical year</h3>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Historical year">
                  {meta.years.map((y) => <option key={y}>{y}</option>)}
                </select>
                <button className="primary" onClick={predict} disabled={loading}>
                  {loading ? "Predicting…" : "Predict Disaster Risk"}
                </button>
              </section>

              <section className="card">
                <h3>AI model details</h3>
                <dl className="details">
                  <dt>Model</dt><dd>MLP Neural Network</dd>
                  <dt>Framework</dt><dd>TensorFlow</dd>
                  <dt>Optimizer</dt><dd>Adam</dd>
                  <dt>Output</dt><dd>Next-year WRI</dd>
                </dl>
              </section>
            </div>

            <div className="right-col">
              <section className="card result">
                <h3>Prediction result</h3>
                {error && <div className="error">{error}</div>}
                {!result && !error && <p className="muted pad">Choose a region and year, then select Predict Disaster Risk.</p>}
                {result && (
                  <div className="result-body">
                    <Gauge value={result.predicted_wri} max={meta.scale_max} level={level} caption={`for ${result.forecast_year}`} />
                    <div className="result-info">
                      <div className="muted">Risk level</div>
                      <span className="level-pill" style={{ background: levelColor(level) }}>{level} Risk</span>
                      <p>Previous WRI: <b>{result.previous_wri.toFixed(2)}</b></p>
                      <p>Region: {result.region} | Year: {result.year}</p>
                      <p className="fine">Annual WRI estimate, not a live disaster warning.</p>
                    </div>
                  </div>
                )}
              </section>

              <section className="card">
                <h3>Historical risk trend{result ? ` – ${result.region}` : ""}</h3>
                {result ? <TrendChart result={result} scaleMax={meta.scale_max} /> : <p className="muted pad">The trend chart appears after you run a prediction.</p>}
              </section>

              {result && (
                <section className="card insights">
                  <h3>Key insights</h3>
                  <ul>
                    <li>{result.region}'s predicted risk level is {level}.</li>
                    <li>
                      Predicted WRI {result.predicted_wri >= result.previous_wri ? "rises" : "falls"} by{" "}
                      {Math.abs(result.predicted_wri - result.previous_wri).toFixed(2)} points from {result.year}.
                    </li>
                    <li>Focus on strengthening resilience and early warning systems.</li>
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}

        {page === "compare" && (
          metrics ? <ModelComparison data={metrics} /> : (
            <div className="notice">
              No metrics found. Run <code>python export_metrics.py</code> in the backend folder, then reload.
            </div>
          )
        )}

        {page === "ranking" && (
          <section className="card">
            <h3>Highest-risk regions in {year}</h3>
            <div className="year-pick">
              <label>Year{" "}
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {meta.years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </label>
            </div>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={ranking} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid stroke="#1b2a47" horizontal={false} />
                <XAxis type="number" stroke="#7d8db0" domain={[0, meta.scale_max]} />
                <YAxis type="category" dataKey="region" stroke="#7d8db0" width={150} />
                <Tooltip contentStyle={{ background: "#0d1730", border: "1px solid #2a3c63", borderRadius: 8 }} />
                <Bar dataKey="wri" name="WRI" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {page === "about" && (
          <section className="card about">
            <h3>About</h3>
            <p>
              This prototype uses a TensorFlow MLP to predict the next-year World Risk Index (WRI)
              for each region from the previous year's exposure, vulnerability, susceptibility,
              coping and adaptive-capacity scores.
            </p>
            <p><b>Disclaimer:</b> This is not a real-time emergency warning system.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value, color, alert }) {
  return (
    <div className={alert ? "stat alert" : "stat"}>
      <span className="stat-ico">{icon}</span>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-val" style={color ? { color } : undefined}>{value}</div>
      </div>
    </div>
  );
}
