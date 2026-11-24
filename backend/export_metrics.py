"""Train several models on Disaster.csv and write metrics.json for the dashboard.

Task: use the previous year's indicators to predict next-year WRI.
Because precision / recall / F1 / confusion matrix need classes, predicted and true
WRI are grouped into 4 risk levels (quartiles of WRI) before scoring.

Usage:  python export_metrics.py
Edit build_mlp() so it matches the architecture you trained in your notebook,
otherwise the MLP row will not reflect your exact model.
"""
import json
import time

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (accuracy_score, confusion_matrix, mean_squared_error,
                             precision_recall_fscore_support, r2_score)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn.preprocessing import StandardScaler

LABELS = ["Low", "Moderate", "High", "Very High"]
SRC = ["WRI", "Exposure", "Vulnerability", "Susceptibility",
       "Lack of Coping Capabilities", "Lack of Adaptive Capacities"]
SEED = 42

df = pd.read_csv("Disaster.csv")
df.columns = df.columns.str.strip()
df["Year"] = pd.to_numeric(df["Year"], errors="coerce")
df = df.dropna(subset=["Region", "Year"] + SRC).sort_values(["Region", "Year"])

# supervised pairs: year t features -> year t+1 WRI
nxt = df.groupby("Region")[["Year", "WRI"]].shift(-1)
pairs = df.copy()
pairs["target"] = nxt["WRI"]
pairs["next_year"] = nxt["Year"]
pairs = pairs[pairs["next_year"] == pairs["Year"] + 1].dropna(subset=["target"])

X = pairs[SRC + ["Year"]].astype(float).values
y = pairs["target"].astype(float).values

X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=SEED)
scaler = StandardScaler().fit(X_tr)
X_tr_s, X_te_s = scaler.transform(X_tr), scaler.transform(X_te)

thresholds = np.quantile(df["WRI"], [0.25, 0.5, 0.75])
to_class = lambda v: np.searchsorted(thresholds, v, side="left")


def build_mlp(n_features):
    import tensorflow as tf
    tf.random.set_seed(SEED)
    m = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(n_features,)),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dense(32, activation="relu"),
        tf.keras.layers.Dense(1),
    ])
    m.compile(optimizer="adam", loss="mse")
    return m


results = []


def evaluate(name, fit_predict):
    t0 = time.perf_counter()
    pred = np.asarray(fit_predict()).ravel()
    elapsed = time.perf_counter() - t0
    yt, yp = to_class(y_te), to_class(pred)
    p, r, f1, _ = precision_recall_fscore_support(yt, yp, average="weighted", zero_division=0)
    cm = confusion_matrix(yt, yp, labels=range(len(LABELS)))
    results.append({
        "name": name,
        "accuracy": float(accuracy_score(yt, yp)),
        "precision": float(p), "recall": float(r), "f1": float(f1),
        "train_time": round(elapsed, 3),
        "r2": float(r2_score(y_te, pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_te, pred))),
        "confusion": cm.tolist(),
    })
    print(f"{name:22s} acc={results[-1]['accuracy']:.3f} f1={f1:.3f} time={elapsed:.2f}s")


def sk(model):
    def run():
        model.fit(X_tr_s, y_tr)
        return model.predict(X_te_s)
    return run


def mlp():
    m = build_mlp(X_tr_s.shape[1])
    m.fit(X_tr_s, y_tr, epochs=100, batch_size=32, verbose=0, validation_split=0.1)
    return m.predict(X_te_s, verbose=0)


evaluate("MLP Neural Network", mlp)
evaluate("Random Forest", sk(RandomForestRegressor(n_estimators=200, random_state=SEED, n_jobs=-1)))
evaluate("Gradient Boosting", sk(GradientBoostingRegressor(random_state=SEED)))
evaluate("Linear Regression", sk(LinearRegression()))
evaluate("KNN", sk(KNeighborsRegressor(n_neighbors=5)))

with open("metrics.json", "w") as f:
    json.dump({
        "labels": LABELS,
        "thresholds": [float(t) for t in thresholds],
        "test_samples": int(len(y_te)),
        "models": results,
    }, f, indent=2)
print("Wrote metrics.json")
