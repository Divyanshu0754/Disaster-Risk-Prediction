# 🌍 Disaster Risk Prediction: Deep Learning + React Dashboard

Forecast a region's **next-year World Risk Index (WRI)** from its previous-year risk indicators using a TensorFlow MLP, compare it with four classical ML models, and explore everything in an interactive React dashboard.

> **Smarter Prediction. Safer Tomorrow.**
> This is an annual risk-estimation prototype. It is **not** a real-time disaster warning system.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [How It Works](#how-it-works)
5. [Dataset](#dataset)
6. [Models](#models)
7. [Evaluation Metrics](#evaluation-metrics)
8. [Results](#results)
9. [Project Structure](#project-structure)
10. [Getting Started](#getting-started)
11. [API Reference](#api-reference)
12. [Configuration and Customisation](#configuration-and-customisation)
13. [Limitations](#limitations)
14. [Future Work](#future-work)
15. [Tech Stack](#tech-stack)
16. [Troubleshooting](#troubleshooting)
17. [References](#references)
18. [Author and License](#author-and-license)

---

## Overview

The **World Risk Index (WRI)** combines a region's **exposure** to natural hazards with its **vulnerability**. Vulnerability is built from three parts: susceptibility, lack of coping capabilities and lack of adaptive capacities.

This project takes the indicators of a region in year *t* and predicts the WRI of year *t + 1*.

| Item | Detail |
|---|---|
| Task | Regression: predict next-year WRI |
| Main model | MLP neural network (TensorFlow / Keras) |
| Comparison models | Random Forest, Gradient Boosting, Linear Regression, KNN |
| Backend | Flask API |
| Frontend | React + Vite + Recharts |
| Course | Deep Learning (CSE0711), ITM University, Gwalior |

## Features

- **Prediction dashboard**: pick a region and a historical year, get the predicted WRI on a gauge with a colour-coded risk level, the previous-year WRI, a historical trend line with the forecast marked by a star, and key insights.
- **Model comparison**: accuracy, precision, recall, F1-score, training time, R² and RMSE for all models, with the best value highlighted, bar charts, and a **confusion matrix** for every model (counts or percentages).
- **Risk ranking**: the ten highest-risk regions in any year.
- **Four risk levels**: Low, Moderate, High, Very High, derived from the quartiles of WRI.
- **Demo mode**: if the API is not running, the UI shows clearly labelled placeholder data so it can still be explored. The sidebar says **"Demo data (API not running)"**.


## How It Works

```
Disaster.csv
     │
     ▼
 clean data ─► build pairs (year t → WRI of year t+1) ─► 80/20 split
     │
     ▼
 standardise (fit on train only) ─► train 5 models ─► evaluate
     │                                                   │
     ▼                                                   ▼
 model.keras + scaler.pkl                          metrics.json
     │                                                   │
     └──────────────► Flask API (backend/app.py) ◄───────┘
                              │  JSON over HTTP
                              ▼
                     React dashboard (frontend/)
```

1. Records are sorted by year within each region.
2. The six indicators plus the year of year *t* are paired with the WRI of year *t + 1* (consecutive years only).
3. Features are standardised using statistics from the training set only (no leakage from the test set).
4. All models are trained on the same split with seed `42`.
5. Predicted and true WRI are converted into four risk levels so precision, recall, F1 and confusion matrices can be computed.

## Dataset

File: `Disaster.csv` (one row per region per year).

| Column | Meaning |
|---|---|
| `Region` | Country or region name |
| `Year` | Calendar year |
| `WRI` | World Risk Index (target comes from the next year's value) |
| `Exposure` | Exposure to natural hazards |
| `Vulnerability` | Overall vulnerability |
| `Susceptibility` | Likelihood of harm from a hazard |
| `Lack of Coping Capabilities` | Weakness in response and recovery |
| `Lack of Adaptive Capacities` | Weakness in long-term adaptation |

**Model inputs (7, fixed order):**
`Previous_WRI`, `Previous_Exposure`, `Previous_Vulnerability`, `Previous_Susceptibility`, `Previous_Lack of Coping Capabilities`, `Previous_Lack of Adaptive Capacities`, `Previous_Year`.

**Preprocessing:** strip column names, convert `Year` to numeric, drop rows with missing indicators, build year-to-year pairs, standardise with a scaler fitted on training data.

> Add your own numbers here: **[number of regions]**, **[year range]**, **[number of rows]**.

**Risk levels** use the 25th, 50th and 75th percentiles of WRI:

| Level | WRI range |
|---|---|
| Low | ≤ Q1 |
| Moderate | Q1 – median |
| High | median – Q3 |
| Very High | > Q3 |

These levels are relative to the dataset. If you have official WRI category boundaries, replace the thresholds in `backend/app.py` and `backend/export_metrics.py`.

## Models

| Model | Type | Settings |
|---|---|---|
| **MLP Neural Network** | Deep learning | 7 → Dense 64 (ReLU) → Dense 32 (ReLU) → 1 (linear); Adam; MSE loss; 100 epochs; batch 32; 10% validation split |
| Random Forest | Bagged trees | 200 trees, seed 42 |
| Gradient Boosting | Boosted trees | scikit-learn defaults, seed 42 |
| Linear Regression | Linear | Ordinary least squares |
| KNN | Instance based | 5 neighbours |

The MLP has **2,625** trainable parameters (512 + 2,080 + 33) if you use the architecture above. `export_metrics.py` retrains the MLP so that training time is measured fairly. **Edit `build_mlp()` so it matches the architecture in your own notebook.**

## Evaluation Metrics

| Metric | What it tells you |
|---|---|
| Accuracy | Share of test records whose risk level is predicted correctly |
| Precision | Of records predicted as a level, how many truly belong to it |
| Recall | Of records that truly belong to a level, how many were found |
| F1-score | Harmonic mean of precision and recall |
| Confusion matrix | Actual vs predicted risk level; shows which levels are confused |
| Training time | Seconds to fit the model and predict on the test set |
| R² / RMSE | Fit and typical error of the numeric WRI forecast |

Precision, recall and F1 are **weighted averages** over the four levels. The "best" model in the dashboard is chosen by F1-score.

## Results

> The numbers below are **not filled in on purpose**. Run `python export_metrics.py`, then copy the values from `backend/metrics.json` (or from the Model Comparison page).
> The dashboard's built-in demo numbers are placeholders and must not be reported as results.

| Model | Accuracy | Precision | Recall | F1 | Train time (s) | R² | RMSE |
|---|---|---|---|---|---|---|---|
| MLP Neural Network | | | | | | | |
| Random Forest | | | | | | | |
| Gradient Boosting | | | | | | | |
| Linear Regression | | | | | | | |
| KNN | | | | | | | |

Tip: also report a **persistence baseline** (predict next year = this year). WRI changes slowly, so a useful model should beat it.

## Project Structure

```
disaster-risk-app/
├── README.md
├── backend/
│   ├── app.py                 # Flask API
│   ├── export_metrics.py      # trains/evaluates 5 models, writes metrics.json
│   ├── requirements.txt
│   ├── Disaster.csv           # your dataset (add this)
│   ├── model.keras            # saved Keras model (add this)
│   ├── scaler.pkl             # saved fitted scaler (add this)
│   └── metrics.json           # created by export_metrics.py
├── frontend/
│   ├── package.json
│   ├── vite.config.js         # proxies /api to http://localhost:5000
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # pages: Dashboard, Model Comparison, Risk Ranking, About
│       ├── api.js             # API calls with demo-data fallback
│       ├── demoData.js        # placeholder data (demo mode only)
│       ├── colors.js
│       ├── styles.css
│       └── components/
│           ├── Gauge.jsx
│           ├── TrendChart.jsx
│           ├── ModelComparison.jsx
│           └── ConfusionMatrix.jsx
└── docs/
    └── images/                # screenshots for this README
```

## Getting Started

### Prerequisites

- Python 3.9+ and `pip`
- Node.js 18+ and `npm`

### 1. Clone

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Run the UI only (demo mode)

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Without the API you will see **demo data**, which is for exploring the interface only.

### 3. Connect your real model

**a) Save the model and scaler** in the notebook where you trained:

```python
import joblib
model.save("model.keras")
joblib.dump(scaler, "scaler.pkl")
```

Copy `model.keras`, `scaler.pkl` and `Disaster.csv` into `backend/`.

**b) Create the comparison metrics:**

```bash
cd backend
pip install -r requirements.txt
python export_metrics.py
```

This trains all five models on the same split and writes `metrics.json`.

**c) Start the API:**

```bash
python app.py        # http://localhost:5000
```

**d) Start the dashboard** (in a second terminal):

```bash
cd frontend
npm run dev
```

The sidebar should now show **Connected to model API**.

### Production build of the frontend

```bash
cd frontend
npm run build      # output in frontend/dist
npm run preview
```

If you host the frontend and API on different domains, set `VITE_API_URL` (for example `VITE_API_URL=https://your-api.example.com/api`) before building.

## API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/meta` | Regions, years, region count, year range, risk thresholds, labels, scale maximum, MLP R² |
| GET | `/api/predict?region=India&year=2023` | Predicted next-year WRI, risk level, previous WRI and history |
| GET | `/api/ranking?year=2023` | Ten highest-WRI regions for that year |
| GET | `/api/metrics` | Contents of `metrics.json` (model comparison) |

**Example response from `/api/predict`:**

```json
{
  "region": "India",
  "year": 2023,
  "forecast_year": 2024,
  "previous_wri": 0.0,
  "predicted_wri": 0.0,
  "risk_level": "High",
  "history": [{ "year": 2000, "wri": 0.0 }]
}
```

(Values shown as `0.0` are placeholders for the shape of the response.)

**Error responses:** `400` invalid input, `404` no data for that region/year, `422` missing indicators for that record.

## Configuration and Customisation

| What | Where |
|---|---|
| MLP architecture and epochs | `build_mlp()` and `mlp()` in `backend/export_metrics.py` |
| Comparison models and settings | `evaluate(...)` calls at the bottom of `export_metrics.py` |
| Risk-level thresholds | `THRESHOLDS` in `backend/app.py` and `thresholds` in `export_metrics.py` |
| API port | last line of `backend/app.py` and the proxy in `frontend/vite.config.js` |
| Theme colours | `frontend/src/styles.css`, `frontend/src/colors.js` |

## Limitations

- **Annual index only.** It cannot predict individual events or give real-time warnings.
- **Random split.** Records of the same region can be in both training and test sets. A split by year (latest years as test) is a stricter test of true forecasting.
- **Persistence effect.** WRI changes slowly, so the previous WRI is a very strong input and even simple models can score well.
- **Risk levels are relative.** Quartile-based levels are not official categories, and precision/recall depend on where the boundaries lie.
- **Single run.** One seed and no confidence intervals, so small differences between models are not conclusive.
- **One-year horizon**, and no hazard-level or climate data are used.

## Future Work

- Time-based split, persistence baseline and multiple seeds with confidence intervals
- Hazard and climate inputs (rainfall, seismic activity, sea-surface temperature)
- Sequence models (LSTM/GRU) that read several past years
- Multi-year forecasts with prediction intervals
- Systematic hyper-parameter tuning with cross-validation
- Explainability (for example SHAP) and an interactive world map
- Cloud deployment with automated retraining when new WRI data is released

## Tech Stack

**ML / Backend:** Python, TensorFlow/Keras, scikit-learn, pandas, NumPy, Flask, Flask-CORS, joblib
**Frontend:** React 18, Vite, Recharts

## Troubleshooting

| Problem | Fix |
|---|---|
| Sidebar says "Demo data (API not running)" | Start `python app.py` and reload the page; check that port 5000 is free |
| API fails at start with a file error | Make sure `Disaster.csv`, `model.keras` and `scaler.pkl` are inside `backend/` |
| Model Comparison shows a "placeholder numbers" notice | Run `python export_metrics.py` and restart the API |
| `scaler.transform` feature error | The 7 input features must be in the same order as in training (see [Dataset](#dataset)) |
| CORS error in the browser | Use `npm run dev` (it proxies `/api`) or set `VITE_API_URL` to the API address |
| `pip install tensorflow` fails | Use a supported Python version for your TensorFlow release |

## References

1. Bündnis Entwicklung Hilft and IFHV, *WorldRiskReport*, annual publication.
2. A. Mosavi, P. Ozturk, K.-W. Chau, "Flood prediction using machine learning models: Literature review," *Water*, 2018.
3. Y. Gorishniy et al., "Revisiting deep learning models for tabular data," *NeurIPS*, 2021.
4. R. Shwartz-Ziv and A. Armon, "Tabular data: Deep learning is not all you need," *Information Fusion*, 2022.
5. D. P. Kingma and J. Ba, "Adam: A method for stochastic optimization," *ICLR*, 2015.
6. L. Breiman, "Random forests," *Machine Learning*, 2001.
7. J. H. Friedman, "Greedy function approximation: A gradient boosting machine," *Annals of Statistics*, 2001.
8. M. Abadi et al., "TensorFlow: A system for large-scale machine learning," *OSDI*, 2016.
9. F. Pedregosa et al., "Scikit-learn: Machine learning in Python," *JMLR*, 2011.

Please verify bibliographic details against the original sources before citing.

## Author and License

**Author:** Divyanshu BETN1CS23125, B.Tech CSE, ITM University, Gwalior


License: [choose a license, e.g. MIT, and add a `LICENSE` file]

> ⚠️ **Disclaimer:** This project is for academic and demonstration purposes. It is not a real-time emergency warning system and should not be used for operational disaster decisions.
