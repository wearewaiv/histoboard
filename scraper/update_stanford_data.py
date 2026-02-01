#!/usr/bin/env python3
"""Update Stanford benchmark data with sensitivity, specificity, and confidence intervals from the official CSV."""

import csv
import json
from pathlib import Path

# Paths
CSV_PATH = "/tmp/stanford_benchmark.csv"
RESULTS_PATH = Path(__file__).parent.parent / "frontend" / "src" / "data" / "results.json"

# Model name mapping from CSV to our model IDs
MODEL_NAME_MAP = {
    # Stanford models
    "Align-base": "stanford_align_base",
    "BEPH": "stanford_beph",
    "BiomedCLIP": "stanford_biomedclip",
    "Blip-B16-14M": "stanford_blip_b16",
    "Clip-B16": "stanford_clip_b16",
    "Dino-B16": "stanford_dino_b16",
    "Dino-S16": "stanford_dino_s16",
    "Dinov2": "stanford_dinov2",
    "HIPT": "stanford_hipt",
    "iBot-B16": "stanford_ibot_b16",
    "iBot-L16": "stanford_ibot_l16",
    "QuiltNet-B-16": "stanford_quiltnet",
    "TITAN": "stanford_titan",
    "beit3-L16": "stanford_beit3",
    "cTranspath": "ctranspath",
    "fusion model": "stanford_fusion",
    "mizero bioclinicalbert": "stanford_mizero_bioclinical",
    "mizero pubmedbert": "stanford_mizero_pubmed",
    # External models
    "CONCH": "mahmood_conch",
    "GPFM": "gpfm",
    "H-optimus-0": "bioptimus_h_optimus_0",
    "Hibou": "histai_hibou_l",
    "Kaiko": "kaiko_vitb8",
    "Lunit": "lunit_vits16",
    "PLIP": "plip",
    "Phikon": "owkin_phikon",
    "Phikon-v2": "owkin_phikon_v2",
    "Prov-GigaPath": "prov_gigapath",
    "UNI": "mahmood_uni",
    "UNI2": "mahmood_uni2_h",
    "Virchow": "paige_virchow",
    "Virchow2": "paige_virchow2",
}

def get_task_id(task_short: str) -> str:
    """Convert Task_short from CSV to our task ID format."""
    # Normalize the task name to match our task IDs
    # e.g., "lung exp subtype" -> "stanford_lung_exp_subtype"
    # e.g., "CPTAC-MYC" -> "stanford_cptac_myc"
    task_name = task_short.lower().replace("-", "_").replace(" ", "_")
    return f"stanford_{task_name}"


def main():
    # Load existing results
    with open(RESULTS_PATH, "r") as f:
        results = json.load(f)

    # Create a lookup map for Stanford results
    stanford_results = {}
    for i, result in enumerate(results):
        if result.get("source") == "stanford":
            key = (result["modelId"], result["taskId"])
            stanford_results[key] = i

    updated_count = 0
    not_found_count = 0

    # Read CSV and update results
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            model_name = row["ModelName_short"]
            task_short = row["Task_short"]

            # Get our model ID
            model_id = MODEL_NAME_MAP.get(model_name)
            if not model_id:
                continue

            # Get our task ID from Task_short column
            task_id = get_task_id(task_short)

            # Find the result in our data
            key = (model_id, task_id)

            if key in stanford_results:
                idx = stanford_results[key]

                # Update with new metrics
                try:
                    if row["Sensitivity"]:
                        results[idx]["sensitivity"] = float(row["Sensitivity"])
                    if row["Specificity"]:
                        results[idx]["specificity"] = float(row["Specificity"])
                    if row["AUROC_lower"]:
                        results[idx]["aurocLower"] = float(row["AUROC_lower"])
                    if row["AUROC_upper"]:
                        results[idx]["aurocUpper"] = float(row["AUROC_upper"])
                    if row["Balanced_accuracy_lower"]:
                        results[idx]["balancedAccuracyLower"] = float(row["Balanced_accuracy_lower"])
                    if row["Balanced_accuracy_upper"]:
                        results[idx]["balancedAccuracyUpper"] = float(row["Balanced_accuracy_upper"])
                    if row["Sensitivity_lower"]:
                        results[idx]["sensitivityLower"] = float(row["Sensitivity_lower"])
                    if row["Sensitivity_upper"]:
                        results[idx]["sensitivityUpper"] = float(row["Sensitivity_upper"])
                    if row["Specificity_lower"]:
                        results[idx]["specificityLower"] = float(row["Specificity_lower"])
                    if row["Specificity_upper"]:
                        results[idx]["specificityUpper"] = float(row["Specificity_upper"])
                    updated_count += 1
                except (ValueError, KeyError) as e:
                    print(f"Error updating {model_id} - {task_id}: {e}")
            else:
                not_found_count += 1

    print(f"Updated {updated_count} results")
    print(f"Not found: {not_found_count} results (expected - some models in CSV may not be in our data)")

    # Save updated results
    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Results saved to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
