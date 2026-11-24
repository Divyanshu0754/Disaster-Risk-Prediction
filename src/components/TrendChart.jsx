import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ReferenceDot,
} from "recharts";

export default function TrendChart({ result, scaleMax }) {
  const data = result.history.map((h) => ({ year: h.year, wri: h.wri }));
  // dashed bridge from the selected year to the forecast
  const bridge = data.map((d) => ({ ...d, pred: d.year === result.year ? d.wri : undefined }));
  bridge.push({ year: result.forecast_year, pred: result.predicted_wri });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={bridge} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1b2a47" vertical={false} />
        <XAxis dataKey="year" stroke="#7d8db0" tick={{ fontSize: 12 }} />
        <YAxis stroke="#7d8db0" tick={{ fontSize: 12 }} domain={[0, scaleMax]} />
        <Tooltip contentStyle={{ background: "#0d1730", border: "1px solid #2a3c63", borderRadius: 8 }} />
        <Legend />
        <Line type="monotone" dataKey="wri" name="Historical WRI" stroke="#3b9bff" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
        <Line type="linear" dataKey="pred" name="Predicted WRI" stroke="#ff4d4d" strokeDasharray="5 4" strokeWidth={2} dot={false} legendType="star" connectNulls />
        <ReferenceDot
          x={result.forecast_year}
          y={result.predicted_wri}
          r={0}
          shape={(p) => (
            <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize="26" fill="#ff3b3b">★</text>
          )}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
