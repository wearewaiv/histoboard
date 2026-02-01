import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 3): string {
  return value.toFixed(decimals);
}

export function formatRank(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

export function getRankColor(rank: number, total: number): string {
  const ratio = (rank - 1) / (total - 1);
  if (ratio <= 0.2) return "text-emerald-600 bg-emerald-50";
  if (ratio <= 0.4) return "text-green-600 bg-green-50";
  if (ratio <= 0.6) return "text-yellow-600 bg-yellow-50";
  if (ratio <= 0.8) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

// Format metric names for display
export function formatMetricLabel(metric: string): string {
  const metricMap: Record<string, string> = {
    "auc": "AUROC",
    "auroc": "AUROC",
    "balanced_accuracy": "Balanced accuracy",
    "balanced_acc": "Balanced accuracy",
    "c-index": "C-Index",
    "c_index": "C-Index",
    "qwk": "QWK",
    "kappa": "Kappa",
    "dice": "Dice",
    "pearson": "Pearson",
    "accuracy": "Accuracy",
    "ece": "ECE",
    "success_rate": "Success Rate",
    "cosine_similarity": "Cosine Sim.",
    "top10_accuracy": "Top-10 Acc.",
    "robustness_index": "Robustness Index",
  };
  return metricMap[metric.toLowerCase()] || metric;
}

// Format organ/indication names for display
export function formatOrganLabel(organ: string): string {
  const organMap: Record<string, string> = {
    "multi-organ": "Multi-organ",
    "pan-cancer": "Pan-cancer",
    "head-neck": "Head & Neck",
    "soft tissue": "Soft Tissue",
    "gi": "GI",
  };

  const lowerOrgan = organ.toLowerCase();
  if (organMap[lowerOrgan]) {
    return organMap[lowerOrgan];
  }

  // Default: capitalize first letter of each word
  return organ
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
