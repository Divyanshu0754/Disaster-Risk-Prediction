import { levelColor } from "../colors.js";

// Semicircle gauge drawn with SVG.
export default function Gauge({ value, max = 100, level, caption }) {
  const R = 78, C = 100, STROKE = 16;
  const pct = Math.max(0, Math.min(1, value / max));
  const start = Math.PI, end = Math.PI + Math.PI * pct;
  const pt = (a) => [C + R * Math.cos(a), C + R * Math.sin(a)];
  const [x0, y0] = pt(start), [x1, y1] = pt(end), [xe, ye] = pt(2 * Math.PI);
  const color = levelColor(level);
  return (
    <svg viewBox="0 0 200 130" className="gauge" role="img" aria-label={`Predicted WRI ${value}`}>
      <path d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${xe} ${ye}`} stroke="#1e2d4a" strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      {pct > 0 && (
        <path d={`M ${x0} ${y0} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x1} ${y1}`} stroke={color} strokeWidth={STROKE} fill="none" strokeLinecap="round" />
      )}
      <text x="100" y="92" textAnchor="middle" className="gauge-num">{value.toFixed(1)}</text>
      <text x="100" y="112" textAnchor="middle" className="gauge-cap">Predicted WRI</text>
      <text x="100" y="126" textAnchor="middle" className="gauge-sub">{caption}</text>
    </svg>
  );
}
