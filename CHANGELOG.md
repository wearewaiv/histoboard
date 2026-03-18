# Changelog

## 2026-03-18

### Models removed

The following models were removed because they lack public weights/paper, are non-pathology-specific baselines, or are duplicates of existing entries:

| Model ID | Name | Reason |
|---|---|---|
| `stanford_ibot_b16` | iBot ViT-B/16 | Generic vision baseline, not pathology-specific |
| `stanford_ibot_l16` | iBot ViT-L/16 | Generic vision baseline, not pathology-specific |
| `stanford_dino_b16` | DINO ViT-B/16 | Generic vision baseline, not pathology-specific |
| `stanford_dino_s16` | DINO ViT-S/16 | Generic vision baseline, not pathology-specific |
| `stanford_dinov2` | DINOv2 | Generic vision baseline, not pathology-specific |
| `stanford_blip_b16` | BLIP ViT-B/16 | Generic vision-language baseline |
| `stanford_beit3` | BEiT-3 ViT-L/16 | Generic vision baseline |
| `stanford_clip_b16` | CLIP ViT-B/16 | Generic vision-language baseline |
| `stanford_align_base` | ALIGN | Generic vision-language baseline |
| `stanford_beph` | BEPH | Removed from upstream Stanford dataset |
| `stanford_fusion` | Fusion | Removed from upstream Stanford dataset |
| `stamp_panakeia` | Panakeia | No public weights or paper |
| `thunder_clip_b32` | CLIP B32 | Generic vision-language baseline |
| `thunder_dinov2_b` | DINOv2 B | Generic vision baseline |
| `thunder_dinov3_b` | DINOv3 B | Generic vision baseline |
| `thunder_dinov3_l` | DINOv3 L | Generic vision baseline |
| `thunder_dinov3_s` | DINOv3 S | Generic vision baseline |
| `thunder_vit_b16` | ViT-B/16 | Generic vision baseline |
| `thunder_vit_l16` | ViT-L/16 | Generic vision baseline |

### Models merged (duplicate IDs resolved)

| Removed ID | Merged into | Reason |
|---|---|---|
| `pathorob_kangdino` | `lunit_vit_s_16` | Same model (Kang et al. CVPR 2023 uses Lunit ViT-S/16 weights) |
| `stamp_dinov2_sslpath` | `lunit_vit_s_8` | Same model |
| `stamp_kaiko` | `kaiko_ai_kaiko_vit_l_14` | Same model |

### Models renamed

| Old ID | New ID |
|---|---|
| `pathbench_chief` | `harvard_chief` |
| `pathorob_ciga` | `toronto_ciga` |
| `pathorob_rudolfv` | `aignostics_rudolfv` |
| `pathorob_retccl` | `sichuan_retccl` |
| `sichuan_university_ctranspath` | `sichuan_ctranspath` |
| `sichuan_university_patho_clip` | `sichuan_patho_clip` |
| `lunit_lunit_vit_s_16` | `lunit_vit_s_16` |
| `lunit_lunit_vit_s_8` | `lunit_vit_s_8` |

### Models added

| Model ID | Name |
|---|---|
| `lgai_exaone_path` | EXAONEPath |

### Data updates

- Stanford benchmark results updated from `benchmarking_updated_ncomm.csv` (Gevaert Lab, NComm)
- Rankings recomputed from scratch after all model removals/merges
