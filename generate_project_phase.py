"""
Generate Project Phase Workflow Diagram
For FYP Report - Figure 1: Project Phase
Three-phase structure: UHI Mapping -> Predictive Modeling -> Dashboard Integration
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(20, 14))
ax.set_xlim(0, 20)
ax.set_ylim(0, 14)
ax.axis('off')

# Colors
PHASE1_MAIN = '#1B4F72'
PHASE2_MAIN = '#0E6655'
PHASE3_MAIN = '#7D3C98'
PHASE1_LIGHT = '#AED6F1'
PHASE2_LIGHT = '#A9DFBF'
PHASE3_LIGHT = '#D7BDE2'
OUTPUT_BG = '#F8F9FA'
ARROW_COLOR = '#2C3E50'

def draw_box(ax, x, y, w, h, text, facecolor, edgecolor='#2C3E50', fontsize=10,
             fontcolor='#2C3E50', fontweight='bold', lw=1.5):
    box = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.12",
                          facecolor=facecolor, edgecolor=edgecolor, linewidth=lw)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight=fontweight, color=fontcolor, linespacing=1.4)

def draw_arrow_down(ax, x, y1, y2):
    ax.annotate('', xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle='->', color=ARROW_COLOR, lw=2.5))

def draw_arrow_right(ax, x1, x2, y):
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle='->', color=ARROW_COLOR, lw=2.5))

def draw_curved_arrow(ax, x1, y1, x2, y2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=ARROW_COLOR, lw=2.5,
                               connectionstyle="arc3,rad=0.15"))

# ============================================================
# TITLE
# ============================================================
ax.text(10, 13.5, "Project Phase Overview",
        ha='center', va='center', fontsize=20, fontweight='bold', color='#1B2631')
ax.text(10, 13.1, "AI-Driven Urban Heat Island Mapping and Forecasting Platform",
        ha='center', va='center', fontsize=12, color='#566573')

# ============================================================
# PHASE 1: Calculating & Mapping Current UHI Hotspots
# ============================================================
# Phase header
draw_box(ax, 0.5, 11.5, 5.8, 1.0,
         "Phase 1\nCalculating & Mapping\nCurrent UHI Hotspots",
         PHASE1_MAIN, edgecolor='white', fontsize=13, fontcolor='white', lw=2)

# Steps
draw_box(ax, 0.5, 10.1, 2.7, 1.1,
         "Satellite Data\nExtraction\n(Landsat 8/9, GEE)",
         PHASE1_LIGHT, fontsize=9)

draw_box(ax, 3.5, 10.1, 2.8, 1.1,
         "Index Computation\n(LST, NDVI, NDBI,\nElevation, Population)",
         PHASE1_LIGHT, fontsize=9)

draw_arrow_right(ax, 3.3, 3.4, 10.65)

# Outputs
draw_box(ax, 0.5, 8.7, 5.8, 1.1,
         "Outputs",
         '#E8F0FE', edgecolor=PHASE1_MAIN, fontsize=10, fontcolor=PHASE1_MAIN, lw=1)

ax.text(3.4, 9.45, "\u2022 District-level choropleth heat maps (Mapbox GL JS)",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(3.4, 9.15, "\u2022 42,706 hotspot records in Supabase PostgreSQL",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(3.4, 8.85, "\u2022 8-year historical LST time series (2016\u20132024)",
        ha='center', va='center', fontsize=8, color='#2C3E50')

# ============================================================
# PHASE 2: Predictive Modeling of Future UHI Trends
# ============================================================
draw_box(ax, 7.1, 11.5, 5.8, 1.0,
         "Phase 2\nPredictive Modeling of\nFuture UHI Trends",
         PHASE2_MAIN, edgecolor='white', fontsize=13, fontcolor='white', lw=2)

# Steps row 1
draw_box(ax, 7.1, 10.1, 2.7, 1.1,
         "13 Model\nComparison\n(80/20 Split)",
         PHASE2_LIGHT, fontsize=9)

draw_box(ax, 10.1, 10.1, 2.8, 1.1,
         "Hyperparameter\nTuning\n(RandomizedSearchCV)",
         PHASE2_LIGHT, fontsize=9)

draw_arrow_right(ax, 9.9, 10.0, 10.65)

# Outputs
draw_box(ax, 7.1, 8.7, 5.8, 1.1,
         "Outputs",
         '#E8F8F0', edgecolor=PHASE2_MAIN, fontsize=10, fontcolor=PHASE2_MAIN, lw=1)

ax.text(10.0, 9.45, "\u2022 Tuned Random Forest (R\u00b2 = 0.8890, RMSE = 2.05\u00b0C)",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(10.0, 9.15, "\u2022 CatBoost Time-Series Model (R\u00b2 = 0.8733)",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(10.0, 8.85, "\u2022 Feature importance analysis (MDI scores)",
        ha='center', va='center', fontsize=8, color='#2C3E50')

# ============================================================
# PHASE 3: Simulation and Dashboard Integration
# ============================================================
draw_box(ax, 13.7, 11.5, 5.8, 1.0,
         "Phase 3\nSimulation & Dashboard\nIntegration",
         PHASE3_MAIN, edgecolor='white', fontsize=13, fontcolor='white', lw=2)

# Steps
draw_box(ax, 13.7, 10.1, 2.7, 1.1,
         "Three-Tier\nArchitecture\n(React + FastAPI\n+ Supabase)",
         PHASE3_LIGHT, fontsize=9)

draw_box(ax, 16.7, 10.1, 2.8, 1.1,
         "Interactive\nPlatform\nDeployment",
         PHASE3_LIGHT, fontsize=9)

draw_arrow_right(ax, 16.5, 16.6, 10.65)

# Outputs
draw_box(ax, 13.7, 8.7, 5.8, 1.1,
         "Outputs",
         '#F5EEF8', edgecolor=PHASE3_MAIN, fontsize=10, fontcolor=PHASE3_MAIN, lw=1)

ax.text(16.6, 9.45, "\u2022 Choropleth map (15 states, 131 districts)",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(16.6, 9.15, "\u2022 What-If Scenario Simulator (NDVI/NDBI sliders)",
        ha='center', va='center', fontsize=8, color='#2C3E50')
ax.text(16.6, 8.85, "\u2022 Time-series forecasting (2026\u20132035)",
        ha='center', va='center', fontsize=8, color='#2C3E50')

# ============================================================
# ARROWS BETWEEN PHASES
# ============================================================
draw_arrow_right(ax, 6.4, 7.0, 12.0)
draw_arrow_right(ax, 13.0, 13.6, 12.0)

# ============================================================
# BOTTOM: Data flow summary
# ============================================================
# Input -> Process -> Output flow
draw_box(ax, 0.5, 6.8, 18.8, 1.4,
         "",
         '#FDFEFE', edgecolor='#ABB2B9', fontsize=10, lw=1.5)

ax.text(10, 7.85, "Data Flow & Technology Stack",
        ha='center', va='center', fontsize=12, fontweight='bold', color='#2C3E50')

# Flow items
flow_items = [
    ("Google Earth\nEngine", '#AED6F1'),
    ("80,000 Sample\nDataset", '#A9DFBF'),
    ("ML Training &\nEvaluation", '#F9E79F'),
    ("FastAPI\nBackend", '#F5CBA7'),
    ("React 18\nFrontend", '#D7BDE2'),
    ("End User\nPlatform", '#FADBD8'),
]

x_start = 1.0
box_w = 2.5
gap = 0.55
for i, (label, color) in enumerate(flow_items):
    x = x_start + i * (box_w + gap)
    draw_box(ax, x, 7.0, box_w, 0.65, label, color, fontsize=8.5)
    if i < len(flow_items) - 1:
        draw_arrow_right(ax, x + box_w + 0.05, x + box_w + gap - 0.05, 7.32)

# ============================================================
# KEY METRICS SUMMARY
# ============================================================
draw_box(ax, 0.5, 5.0, 18.8, 1.3,
         "",
         '#F8F9FA', edgecolor='#ABB2B9', fontsize=10, lw=1.5)

ax.text(10, 5.95, "Key Project Metrics",
        ha='center', va='center', fontsize=12, fontweight='bold', color='#2C3E50')

metrics = [
    ("Training\nDataset", "80,000\nsamples", PHASE1_LIGHT),
    ("Hotspot\nRecords", "42,706\nrecords", PHASE1_LIGHT),
    ("States\nCovered", "15\nstates", PHASE1_LIGHT),
    ("Districts\nMapped", "131\ndistricts", PHASE1_LIGHT),
    ("Models\nTested", "12\nmodels", PHASE2_LIGHT),
    ("Best RF\nR\u00b2", "0.8890", PHASE2_LIGHT),
    ("CatBoost\nR\u00b2", "0.8733", PHASE2_LIGHT),
    ("Forecast\nRange", "2026\u2013\n2035", PHASE3_LIGHT),
]

x_start = 1.0
box_w = 2.1
gap = 0.25
for i, (label, value, color) in enumerate(metrics):
    x = x_start + i * (box_w + gap)
    draw_box(ax, x, 5.1, box_w, 0.7, f"{label}\n{value}", color, fontsize=7.5)

# ============================================================
# TIMELINE BAR
# ============================================================
draw_box(ax, 0.5, 3.5, 18.8, 1.0,
         "",
         'white', edgecolor='#ABB2B9', fontsize=10, lw=1.5)

ax.text(10, 4.2, "Project Timeline",
        ha='center', va='center', fontsize=12, fontweight='bold', color='#2C3E50')

# Timeline phases
phases_timeline = [
    (1.0, 5.5, "Phase 1: Data Collection\n& UHI Mapping", PHASE1_MAIN),
    (6.5, 5.5, "Phase 2: Model Training\n& Evaluation", PHASE2_MAIN),
    (12.5, 6.5, "Phase 3: Platform\nDevelopment & Testing", PHASE3_MAIN),
]

for x, w, label, color in phases_timeline:
    box = FancyBboxPatch((x, 3.6), w, 0.55, boxstyle="round,pad=0.08",
                          facecolor=color, edgecolor='white', linewidth=1.5)
    ax.add_patch(box)
    ax.text(x + w/2, 3.87, label, ha='center', va='center',
            fontsize=8, fontweight='bold', color='white')

# Connecting arrows on timeline
draw_arrow_right(ax, 6.6, 6.4, 3.87)
draw_arrow_right(ax, 12.1, 12.4, 3.87)

plt.tight_layout()
plt.savefig('backend/data/fig_project_phase.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("[OK] Saved to backend/data/fig_project_phase.png")
plt.close()
