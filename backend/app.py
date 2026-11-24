"""Flask API that serves the trained model to the React dashboard.

Files expected in this folder:
    Disaster.csv   - your dataset
    model.keras    - saved Keras model   (see README, "Save your model")
    scaler.pkl     - saved fitted scaler (see README)
    metrics.json   - created by export_metrics.py (optional, for the comparison page)
"""
import json
import os

import joblib
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from tensorflow.keras.models import load_model

HERE = os.path.dirname(os.path.abspath(__file__))
LABELS = ["Low", "Moderate", "High", "Very High"]

UI_FEATURES = [
    "Previous_WRI", "Previous_Exposure", "Previous_Vulnerability",
    "Previous_Susceptibility", "Previous_Lack of Coping Capabilities",
    "Previous_Lack of Adaptive Capacities", "Previous_Year",
]
SOURCE_COLUMNS = [
    "WRI", "Exposure", "Vulnerability", "Susceptibility",
    "Lack of Coping Capabilities", "Lack of Adaptive Capacities",
]

app = Flask(__name__)
CORS(app)

df = pd.read_csv(os.path.join(HERE, "Disaster.csv"))
df.columns = df.columns.str.strip()
df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
df["Region"] = df["Region"].astype(str)

model = load_model(os.path.join(HERE, "model.keras"))
scaler = joblib.load(os.path.join(HERE, "scaler.pkl"))

# Risk-level cut-offs = quartiles of the WRI column (same rule as export_metrics.py)
THRESHOLDS = [float(x) for x in np.quantile(df["WRI"].dropna(), [0.25, 0.5, 0.75])]


def level_of(v):
    return LABELS[int(np.searchsorted(THRESHOLDS, v, side="left"))]


def load_metrics():
    path = os.path.join(HERE, "metrics.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None


@app.get("/api/meta")
def meta():
    metrics = load_metrics()
    r2 = None
    if metrics:
        for m in metrics["models"]:
            if "mlp" in m["name"].lower() or "neural" in m["name"].lower():
                r2 = m.get("r2")
    return jsonify(
        regions=sorted(df["Region"].dropna().unique().tolist()),
        years=sorted(int(y) for y in df["Year"].dropna().unique()),
        total_regions=int(df["Region"].nunique()),
        year_min=int(df["Year"].min()),
        year_max=int(df["Year"].max()),
        thresholds=THRESHOLDS,
        labels=LABELS,
        scale_max=float(np.ceil(df["WRI"].max() / 10) * 10),
        r2=r2,
    )


@app.get("/api/predict")
def predict():
    region = request.args.get("region", "")
    try:
        year = int(request.args.get("year", ""))
    except ValueError:
        return jsonify(error="Select a region and year."), 400

    sel = df[(df["Region"] == region) & (df["Year"] == year)]
    if sel.empty:
        return jsonify(error="No data available for this region and year."), 404
    row = sel.iloc[0]
    if row[SOURCE_COLUMNS].isna().any():
        return jsonify(error="Some indicators are missing. Select another year."), 422

    values = [float(row[c]) for c in SOURCE_COLUMNS] + [float(year)]
    x = scaler.transform(pd.DataFrame([values], columns=UI_FEATURES))
    pred = float(model.predict(x, verbose=0)[0][0])

    hist = (
        df[df["Region"] == region].dropna(subset=["Year", "WRI"]).sort_values("Year")
    )
    return jsonify(
        region=region,
        year=year,
        forecast_year=year + 1,
        previous_wri=float(row["WRI"]),
        predicted_wri=pred,
        risk_level=level_of(pred),
        history=[{"year": int(y), "wri": float(w)} for y, w in zip(hist["Year"], hist["WRI"])],
    )


@app.get("/api/ranking")
def ranking():
    year = request.args.get("year", type=int)
    sub = df[df["Year"] == year].dropna(subset=["WRI"]).nlargest(10, "WRI")
    return jsonify([{"region": r, "wri": float(w)} for r, w in zip(sub["Region"], sub["WRI"])])


@app.get("/api/metrics")
def metrics():
    m = load_metrics()
    if m is None:
        return jsonify(error="metrics.json not found. Run export_metrics.py first."), 404
    return jsonify(m)


if __name__ == "__main__":
    app.run(port=5000, debug=False)
