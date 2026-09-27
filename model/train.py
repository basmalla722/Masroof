"""
Trains the end-of-month spend projection model for Masroof.

The problem: it is day N of the month, the user has spent S so far, and the app
has to say what they will finish at. The app currently uses the naive rule
    projected = (S / N) * days_in_month
which assumes spending is uniform across the month. It is not: people get paid,
weekends cost more, and the last days are quiet.

This script trains a replacement, measures it against the naive rule, and
exports the coefficients to src/ml/weights.json so the browser can run the
prediction with no ML dependency at all.

The data is SYNTHETIC (see generate_data.py). These numbers describe how well
the model fits generated behaviour, not how well it will fit real users.

Run:  python model/train.py
Out:  src/ml/weights.json   (committed)
      model/report.txt     (committed, the numbers quoted in the README)
"""

import csv
import json
import os

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import PolynomialFeatures

HERE = os.path.dirname(__file__)
ROOT = os.path.dirname(HERE)


# Features are computed in JS too, in src/ml/features.js. Any change here must
# be made there as well, in the same order.
FEATURES = [
    "frac",
    "daily",
    "daily_x_frac",
    "daily_x_frac2",
    "daily_x_remaining_frac",
    "log_daily",
    "tx_per_day",
    "top_category_share",
    "n_categories",
    "log_income",
    "spent_over_income",
    "is_weekend_start",
]


def featurise(rows):
    out = np.zeros((len(rows), len(FEATURES)))
    for i, r in enumerate(rows):
        elapsed = r["elapsed"]
        days = r["days_in_month"]
        total = r["total_so_far"]
        income = r["income"]

        frac = elapsed / days
        daily = total / elapsed

        out[i] = [
            frac,
            daily,
            daily * frac,
            daily * frac * frac,
            daily * (1 - frac),
            np.log1p(daily),
            r["tx_count"] / elapsed,
            r["top_category_share"],
            r["n_categories"],
            np.log1p(income),
            total / max(income, 1.0),
            1.0 if elapsed >= days - 3 else 0.0,
        ]
    return out


def naive(rows):
    """The rule that is in the app right now."""
    return np.array(
        [(r["total_so_far"] / r["elapsed"]) * r["days_in_month"] for r in rows]
    )


def mape(pred, actual):
    return float(np.mean(np.abs(pred - actual) / np.maximum(actual, 1.0)) * 100)


def main():
    with open(os.path.join(HERE, "data.csv")) as fh:
        raw = list(csv.DictReader(fh))

    typed = []
    for r in raw:
        typed.append(
            {
                "user": int(r["user"]),
                "elapsed": int(r["elapsed"]),
                "days_in_month": int(r["days_in_month"]),
                "total_so_far": float(r["total_so_far"]),
                "tx_count": int(float(r["tx_count"])),
                "top_category_share": float(r["top_category_share"]),
                "n_categories": int(r["n_categories"]),
                "income": float(r["income"]),
                "full_month_total": float(r["full_month_total"]),
            }
        )

    # Split by USER, not by row. Two observations from the same user are the
    # same person, and a random row split would leak that into the test set and
    # flatter the model.
    users = np.array([r["user"] for r in typed])
    uniq = np.unique(users)
    rng = np.random.default_rng(7)
    rng.shuffle(uniq)
    cut = int(len(uniq) * 0.8)
    train_users = set(uniq[:cut].tolist())

    train = [r for r in typed if r["user"] in train_users]
    test = [r for r in typed if r["user"] not in train_users]

    X_train, X_test = featurise(train), featurise(test)
    y_train = np.array([r["full_month_total"] for r in train])
    y_test = np.array([r["full_month_total"] for r in test])

    results = []

    # 0. The incumbent.
    n_test = naive(test)
    results.append(("naive rule (current app)", naive(test), None))

    # 1. Plain linear regression on the engineered features.
    lin = LinearRegression()
    lin.fit(X_train, y_train)
    results.append(("linear regression", lin.predict(X_test), lin))

    # 2. Linear regression with quadratic expansion. Still exports as a flat
    #    list of coefficients, so the browser stays dependency-free.
    poly = PolynomialFeatures(degree=2, include_bias=False)
    Xt = poly.fit_transform(X_train)
    Xe = poly.fit_transform(X_test)
    lin2 = LinearRegression()
    lin2.fit(Xt, y_train)
    results.append(("quadratic regression", lin2.predict(Xe), (poly, lin2)))

    # 3. Trees, as a reference point only. If this is far better it means the
    #    relationship is not linear and the flat export is leaving accuracy on
    #    the table. Measured, not shipped.
    gbm = HistGradientBoostingRegressor(max_iter=300, learning_rate=0.06, random_state=0)
    gbm.fit(X_train, y_train)
    results.append(("gradient boosting (reference only)", gbm.predict(X_test), None))

    lines = []
    lines.append("Masroof projection model")
    lines.append("=" * 52)
    lines.append(f"observations: {len(typed)}   users: {len(uniq)}")
    lines.append(f"train rows: {len(train)}   test rows: {len(test)} (unseen users)")
    lines.append(f"test target: median {np.median(y_test):.0f}   mean {y_test.mean():.0f}")
    lines.append("")
    lines.append(f"{'model':<34}{'MAE':>10}{'MAPE':>10}")
    lines.append("-" * 52)

    base_mae = mean_absolute_error(y_test, n_test)
    for name, pred, _ in results:
        mae = mean_absolute_error(y_test, pred)
        lines.append(f"{name:<34}{mae:>10.1f}{mape(pred, y_test):>9.1f}%")

    lines.append("-" * 52)
    lin_mae = mean_absolute_error(y_test, results[1][1])
    gain = (base_mae - lin_mae) / base_mae * 100
    lines.append(f"linear vs naive MAE improvement: {gain:.1f}%")
    lines.append("")
    lines.append("Shipped model: linear regression (flat coefficients, no runtime dep)")

    report = "\n".join(lines)
    print(report)

    # Export the plain linear model: it is the best of the two we can express
    # as a dot product in the browser, and the honest default.
    with open(os.path.join(HERE, "report.txt"), "w") as fh:
        fh.write(report + "\n")

    weights = {
        "_comment": (
            "Generated by model/train.py from synthetic data (model/generate_data.py). "
            "Do not edit by hand. Inference lives in src/ml/predict.js."
        ),
        "features": FEATURES,
        "intercept": float(lin.intercept_),
        "coefficients": [float(c) for c in lin.coef_],
        "training": {
            "synthetic_users": int(len(uniq)),
            "train_rows": len(train),
            "test_rows": len(test),
            "mae": round(float(lin_mae), 1),
            "naive_mae": round(float(base_mae), 1),
            "improvement_pct": round(float(gain), 1),
            "mape": round(mape(lin.predict(X_test), y_test), 1),
        },
    }

    os.makedirs(os.path.join(ROOT, "src", "ml"), exist_ok=True)
    with open(os.path.join(ROOT, "src", "ml", "weights.json"), "w") as fh:
        json.dump(weights, fh, indent=2)
        fh.write("\n")

    print(f"\nwrote src/ml/weights.json and model/report.txt")


if __name__ == "__main__":
    main()
