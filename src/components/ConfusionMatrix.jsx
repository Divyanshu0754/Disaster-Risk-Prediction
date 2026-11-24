import { useState } from "react";

export default function ConfusionMatrix({ matrix, labels }) {
  const [normalize, setNormalize] = useState(true);
  const rowSums = matrix.map((r) => r.reduce((a, b) => a + b, 0));
  const maxVal = Math.max(...matrix.flat());

  return (
    <div>
      <div className="cm-toolbar">
        <label>
          <input type="checkbox" checked={normalize} onChange={(e) => setNormalize(e.target.checked)} />
          Show % of each actual class
        </label>
      </div>
      <div className="cm-wrap">
        <div className="cm-axis-y">Actual risk level</div>
        <div>
          <div className="cm-grid" style={{ gridTemplateColumns: `90px repeat(${labels.length}, 1fr)` }}>
            <div />
            {labels.map((l) => <div key={l} className="cm-head">{l}</div>)}
            {matrix.map((row, i) => (
              <Row key={i} i={i} row={row} labels={labels} rowSum={rowSums[i]} maxVal={maxVal} normalize={normalize} />
            ))}
          </div>
          <div className="cm-axis-x">Predicted risk level</div>
        </div>
      </div>
    </div>
  );
}

function Row({ i, row, labels, rowSum, maxVal, normalize }) {
  return (
    <>
      <div className="cm-head cm-side">{labels[i]}</div>
      {row.map((v, j) => {
        const strength = normalize ? (rowSum ? v / rowSum : 0) : v / maxVal;
        const diagonal = i === j;
        const rgb = diagonal ? "34,197,94" : "239,68,68";
        return (
          <div
            key={j}
            className="cm-cell"
            style={{ background: `rgba(${rgb}, ${0.08 + strength * 0.75})` }}
            title={`Actual ${labels[i]} → predicted ${labels[j]}: ${v}`}
          >
            <b>{normalize ? `${(strength * 100).toFixed(0)}%` : v}</b>
            {normalize && <span>{v}</span>}
          </div>
        );
      })}
    </>
  );
}
