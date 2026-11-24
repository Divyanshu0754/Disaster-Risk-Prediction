import { useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import ConfusionMatrix from "./ConfusionMatrix.jsx";

const METRICS = [
  { key: "accuracy", label: "Accuracy" },
  { key: "precision", label: "Precision" },
  { key: "recall", label: "Recall" },
  { key: "f1", label: "F1-Score" },
];
const BAR_COLORS = ["#3b9bff", "#a78bfa", "#22c55e", "#f59e0b"];
const tip = { background: "#0d1730", border: "1px solid #2a3c63", borderRadius: 8 };
const pct = (v) => `${(v * 100).toFixed(1)}%`;

export default function ModelComparison({ data }) {
  const { models, labels } = data;
  const [selected, setSelected] = useState(0);

  const best = useMemo(() => {
    const out = {};
    METRICS.forEach((m) => {
      out[m.key] = Math.max(...models.map((x) => x[m.key]));
    });
    out.train_time = Math.min(...models.map((x) => x.train_time));
    return out;
  }, [models]);

  const bestModel = models.reduce((a, b) => (b.f1 > a.f1 ? b : a));

  const chartData = METRICS.map((m) => {
    const row = { metric: m.label };
    models.forEach((mod) => (row[mod.name] = +(mod[m.key] * 100).toFixed(2)));
    return row;
  });
  const timeData = models.map((m) => ({ name: m.name, seconds: m.train_time }));

  return (
    <div className="page-stack">
      {data.demo && (
        <div className="notice">
          Showing placeholder numbers. Run <code>python export_metrics.py</code> in the
          backend folder and restart the API to see your real results.
        </div>
      )}

      <section className="card">
        <h3>Model comparison</h3>
        <p className="muted">
          Each model predicts next-year WRI. Predictions are grouped into risk levels
          ({labels.join(", ")}) so that precision, recall and F1 can be measured
          {data.test_samples ? ` on ${data.test_samples} held-out test rows` : ""}.
          Precision, recall and F1 are weighted averages across the levels.
        </p>
        <div className="table-scroll">
          <table className="cmp">
            <thead>
              <tr>
                <th>Model</th>
                {METRICS.map((m) => <th key={m.key}>{m.label}</th>)}
                <th>Training time</th>
                <th>R²</th>
                <th>RMSE</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.name} className={m.name === bestModel.name ? "best-row" : ""}>
                  <td>
                    {m.name} {m.name === bestModel.name && <span className="badge">Best F1</span>}
                  </td>
                  {METRICS.map((x) => (
                    <td key={x.key} className={m[x.key] === best[x.key] ? "best" : ""}>{pct(m[x.key])}</td>
                  ))}
                  <td className={m.train_time === best.train_time ? "best" : ""}>
                    {m.train_time < 1 ? `${(m.train_time * 1000).toFixed(0)} ms` : `${m.train_time.toFixed(1)} s`}
                  </td>
                  <td>{m.r2 != null ? m.r2.toFixed(3) : "–"}</td>
                  <td>{m.rmse != null ? m.rmse.toFixed(2) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <h3>Accuracy, precision, recall, F1</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1b2a47" vertical={false} />
              <XAxis dataKey="metric" stroke="#7d8db0" />
              <YAxis stroke="#7d8db0" domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={tip} formatter={(v) => `${v}%`} />
              <Legend />
              {models.map((m, i) => (
                <Bar key={m.name} dataKey={m.name} fill={BAR_COLORS[i % BAR_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <h3>Training time (seconds)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid stroke="#1b2a47" horizontal={false} />
              <XAxis type="number" stroke="#7d8db0" />
              <YAxis type="category" dataKey="name" stroke="#7d8db0" width={130} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tip} formatter={(v) => `${v} s`} />
              <Bar dataKey="seconds" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="card">
        <h3>Confusion matrix</h3>
        <div className="tabs">
          {models.map((m, i) => (
            <button key={m.name} className={i === selected ? "tab active" : "tab"} onClick={() => setSelected(i)}>
              {m.name}
            </button>
          ))}
        </div>
        <ConfusionMatrix matrix={models[selected].confusion} labels={labels} />
      </section>
    </div>
  );
}
