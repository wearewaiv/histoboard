#!/usr/bin/env python3
"""
Update PFM-DenseBench data from the official GitHub repository.

Fetches the 5 per-method JSON files from:
  https://github.com/m4a1tastegood/PFM-DenseBench/tree/main/Data/

For each (model, dataset) pair, computes:
  - Average value and 95% CI across all 5 adaptation methods for 8 metrics:
      Mean_Dice (primary, stored as `value` / `ciLower` / `ciUpper`),
      mIoU, Pixel_Accuracy, Mean_Accuracy, Frequency_Weighted_IoU,
      Mean_Precision, Mean_Recall, Mean_F1
  - Average mDice rank across the 5 methods (`mDiceAvgRank`):
      within each method, models are ranked by mDice descending (rank 1 = best);
      these per-method ranks are then averaged — this matches the official
      PFM-DenseBench leaderboard display.

Usage:
    python scraper/update_pfm_densebench_data.py

The script is idempotent: re-running it overwrites existing PFM-DenseBench
entries (excluding the avgrank virtual task) with fresh values.
"""

import json
import urllib.request
from pathlib import Path
from collections import defaultdict
import datetime

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
RESULTS_PATH = Path(__file__).parent.parent / "frontend" / "src" / "data" / "results.json"
TASKS_PATH   = Path(__file__).parent.parent / "frontend" / "src" / "data" / "tasks.json"

# ---------------------------------------------------------------------------
# Source URLs
# ---------------------------------------------------------------------------
RAW_BASE = "https://raw.githubusercontent.com/m4a1tastegood/PFM-DenseBench/main/Data"
METHOD_URLS = {
    "cnn":         f"{RAW_BASE}/cnn.json",
    "dora":        f"{RAW_BASE}/dora.json",
    "frozen":      f"{RAW_BASE}/frozen.json",
    "lora":        f"{RAW_BASE}/lora.json",
    "transformer": f"{RAW_BASE}/transformer.json",
}

# ---------------------------------------------------------------------------
# Source metric key → (JSON field, CI lower field, CI upper field)
# "Mean_Dice" maps to the base Result fields (value / ciLower / ciUpper).
# All others map to PFMDenseBenchResult extension fields.
# ---------------------------------------------------------------------------
METRIC_FIELD_MAP = {
    "Mean_Dice":              ("value",               "ciLower",                    "ciUpper"),
    "mIoU":                   ("mIoU",                "mIoULower",                  "mIoUUpper"),
    "Pixel_Accuracy":         ("pixelAccuracy",        "pixelAccuracyLower",          "pixelAccuracyUpper"),
    "Mean_Accuracy":          ("meanAccuracy",         "meanAccuracyLower",           "meanAccuracyUpper"),
    "Frequency_Weighted_IoU": ("frequencyWeightedIoU", "frequencyWeightedIoULower",   "frequencyWeightedIoUUpper"),
    "Mean_Precision":         ("meanPrecision",        "meanPrecisionLower",          "meanPrecisionUpper"),
    "Mean_Recall":            ("meanRecall",           "meanRecallLower",             "meanRecallUpper"),
    "Mean_F1":                ("meanF1",               "meanF1Lower",                "meanF1Upper"),
}

# ---------------------------------------------------------------------------
# Model key → Histoboard model ID mapping
# Update this dict whenever a new model is added to PFM-DenseBench.
# ---------------------------------------------------------------------------
MODEL_KEY_MAP = {
    "PathOrchestra": "ai4pathology_pathorchestra",
    "hoptimus_0":    "bioptimus_h_optimus_0",
    "hoptimus_1":    "bioptimus_h_optimus_1",
    "hibou_l":       "hist_ai_hibou_l",
    "midnight12k":   "kaiko_ai_midnight_12k",
    "kaiko-vitl14":  "kaiko_ai_vit_l_14",
    "lunit_vits8":   "lunit_vit_s_8",
    "conch_v1":      "mahmood_lab_conch",
    "conch_v1_5":    "mahmood_lab_conch_1_5",
    "uni_v1":        "mahmood_lab_uni",
    "uni_v2":        "mahmood_lab_uni2",
    "gigapath":      "microsoft_prov_gigapath",
    "phikon":        "owkin_phikon",
    "phikon_v2":     "owkin_phikon_v2",
    "virchow_v1":    "paige_ai_virchow",
    "virchow_v2":    "paige_ai_virchow2",
    "musk":          "stanford_university_musk",
}

# Dataset names in the source files use mixed casing; normalize to lowercase
# for matching against task IDs (pfm_densebench_<lowercase>).
DATASET_NAME_OVERRIDES = {
    "kumar": "kumar",
    "cpm17": "cpm17",
    "cpm15": "cpm15",
}


def fetch_json(url: str) -> dict:
    print(f"  Fetching {url} …")
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read())


def dataset_to_task_id(dataset_name: str) -> str:
    """Convert a source dataset name to its Histoboard task ID."""
    normalized = DATASET_NAME_OVERRIDES.get(dataset_name, dataset_name.lower())
    return f"pfm_densebench_{normalized}"


def main():
    # ------------------------------------------------------------------
    # 1. Fetch all 5 method files
    # ------------------------------------------------------------------
    print("Fetching PFM-DenseBench method data …")
    method_data: dict[str, dict] = {}
    for method, url in METHOD_URLS.items():
        method_data[method] = fetch_json(url)

    # ------------------------------------------------------------------
    # 2a. Aggregate metric values across methods
    # ------------------------------------------------------------------
    # Structure: (hid, task_id) → metric_source_name → {"mean": [], ...}
    agg: dict[tuple[str, str], dict[str, dict[str, list[float]]]] = {}

    for method, md in method_data.items():
        for dataset_name, models_in_ds in md.items():
            task_id = dataset_to_task_id(dataset_name)
            for model_key, metrics in models_in_ds.items():
                if model_key not in MODEL_KEY_MAP:
                    continue
                hid = MODEL_KEY_MAP[model_key]
                key = (hid, task_id)
                if key not in agg:
                    agg[key] = {m: {"mean": [], "ci_lower": [], "ci_upper": []}
                                for m in METRIC_FIELD_MAP}

                for src_metric in METRIC_FIELD_MAP:
                    if src_metric not in metrics:
                        continue
                    m = metrics[src_metric]
                    if "mean" not in m:
                        continue
                    agg[key][src_metric]["mean"].append(m["mean"])
                    if "ci_lower" in m:
                        agg[key][src_metric]["ci_lower"].append(m["ci_lower"])
                    if "ci_upper" in m:
                        agg[key][src_metric]["ci_upper"].append(m["ci_upper"])

    # ------------------------------------------------------------------
    # 2b. Compute per-method mDice ranks, then average + std across methods
    # ------------------------------------------------------------------
    # method_dice_ranks[(hid, task_id)] = list of per-method mDice ranks
    method_dice_ranks: dict[tuple[str, str], list[float]] = defaultdict(list)

    for method, md in method_data.items():
        for dataset_name, models_in_ds in md.items():
            task_id = dataset_to_task_id(dataset_name)
            # Collect (hid, mDice) for tracked models in this method/dataset
            model_dice: list[tuple[str, float]] = []
            for model_key, metrics in models_in_ds.items():
                if model_key not in MODEL_KEY_MAP:
                    continue
                dice_m = metrics.get("Mean_Dice", {})
                if "mean" not in dice_m:
                    continue
                hid = MODEL_KEY_MAP[model_key]
                model_dice.append((hid, dice_m["mean"]))
            # Rank by mDice descending: rank 1 = best
            model_dice.sort(key=lambda x: x[1], reverse=True)
            for rank_idx, (hid, _) in enumerate(model_dice, start=1):
                method_dice_ranks[(hid, task_id)].append(float(rank_idx))

    print(f"  Aggregated {len(agg)} (model, dataset) pairs across 5 methods")

    # ------------------------------------------------------------------
    # 3. Load valid task IDs from tasks.json
    # ------------------------------------------------------------------
    with open(TASKS_PATH) as f:
        tasks = json.load(f)
    valid_task_ids = {
        t["id"] for t in tasks if t.get("benchmarkId") == "pfm_densebench"
    }

    # ------------------------------------------------------------------
    # 4. Build updated result entries
    # ------------------------------------------------------------------
    new_entries: dict[tuple[str, str], dict] = {}
    for (hid, task_id), metrics_agg in agg.items():
        if task_id not in valid_task_ids:
            print(f"  WARNING: unknown task_id '{task_id}' — add it to tasks.json")
            continue

        dice_vals = metrics_agg["Mean_Dice"]["mean"]
        if not dice_vals:
            continue

        entry: dict = {
            "modelId":     hid,
            "taskId":      task_id,
            "value":       round(sum(dice_vals) / len(dice_vals), 6),
            "rank":        0,   # placeholder; re-ranked below
            "source":      "pfm_densebench",
            "retrievedAt": "",  # filled below
        }

        # mDice average rank + std across 5 methods (official leaderboard metric)
        ranks = method_dice_ranks.get((hid, task_id), [])
        if ranks:
            avg_rank = sum(ranks) / len(ranks)
            entry["mDiceAvgRank"] = round(avg_rank, 4)
            if len(ranks) > 1:
                variance = sum((r - avg_rank) ** 2 for r in ranks) / len(ranks)
                entry["mDiceRankStd"] = round(variance ** 0.5, 4)

        # All 8 metrics (avg value + CI across methods)
        for src_metric, (val_field, lower_field, upper_field) in METRIC_FIELD_MAP.items():
            vals = metrics_agg[src_metric]
            if vals["mean"]:
                avg = round(sum(vals["mean"]) / len(vals["mean"]), 6)
                if val_field != "value":
                    entry[val_field] = avg
                if vals["ci_lower"]:
                    entry[lower_field] = round(sum(vals["ci_lower"]) / len(vals["ci_lower"]), 6)
                if vals["ci_upper"]:
                    entry[upper_field] = round(sum(vals["ci_upper"]) / len(vals["ci_upper"]), 6)

        new_entries[(hid, task_id)] = entry

    # ------------------------------------------------------------------
    # 5. Assign overall ranks per task (by Mean Dice, descending)
    # ------------------------------------------------------------------
    retrieved_at = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    by_task: dict[str, list] = defaultdict(list)
    for (hid, task_id), entry in new_entries.items():
        by_task[task_id].append(entry)

    for task_id, entries in by_task.items():
        entries.sort(key=lambda e: e["value"], reverse=True)
        for rank, entry in enumerate(entries, start=1):
            entry["rank"] = rank
            entry["retrievedAt"] = retrieved_at

    # ------------------------------------------------------------------
    # 6. Merge into results.json (replace existing pfm_densebench entries)
    # ------------------------------------------------------------------
    with open(RESULTS_PATH) as f:
        results: list[dict] = json.load(f)

    kept = [
        r for r in results
        if not (
            r.get("source") == "pfm_densebench"
            and r.get("taskId") != "pfm_densebench_avgrank"
        )
    ]
    inserted = list(new_entries.values())
    results_out = kept + inserted

    with open(RESULTS_PATH, "w") as f:
        json.dump(results_out, f, indent=2)

    print(f"  Wrote {len(inserted)} per-dataset entries to results.json")
    print("Done. Remember to also update rankings.json (avgRank) if model coverage changed.")


if __name__ == "__main__":
    main()
