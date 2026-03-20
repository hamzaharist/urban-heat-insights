"""
Generate End-to-End Methodology Workflow Diagram
For FYP Report - Figure 2
"""
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(18, 22))
ax.set_xlim(0, 18)
ax.set_ylim(0, 22)
ax.axis('off')

# Color scheme
PHASE_COLORS = {
    1: '#1B4F72',  # Dark blue
    2: '#1A5276',  # Blue
    3: '#154360',  # Navy
    4: '#0E6655',  # Dark teal
}
STEP_COLORS = {
    1: '#AED6F1',  # Light blue
    2: '#A9DFBF',  # Light green
    3: '#F9E79F',  # Light yellow
    4: '#F5CBA7',  # Light orange
}
DETAIL_COLOR = '#F8F9FA'
ARROW_COLOR = '#2C3E50'

def draw_phase_header(ax, y, phase_num, title, color):
    """Draw phase header bar"""
    box = FancyBboxPatch((1, y), 16, 0.8,
                          boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='white', linewidth=2)
    ax.add_patch(box)
    ax.text(9, y + 0.4, f"Phase {phase_num}: {title}",
            ha='center', va='center', fontsize=14, fontweight='bold', color='white')

def draw_step_box(ax, x, y, w, h, text, color, fontsize=9):
    """Draw a step box"""
    box = FancyBboxPatch((x, y), w, h,
                          boxstyle="round,pad=0.1",
                          facecolor=color, edgecolor='#2C3E50', linewidth=1.5)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight='bold', color='#2C3E50', wrap=True)

def draw_detail_box(ax, x, y, w, h, text, fontsize=8):
    """Draw a detail/description box"""
    box = FancyBboxPatch((x, y), w, h,
                          boxstyle="round,pad=0.05",
                          facecolor=DETAIL_COLOR, edgecolor='#BDC3C7', linewidth=1)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fontsize, color='#34495E', style='italic')

def draw_arrow_down(ax, x, y1, y2):
    """Draw downward arrow"""
    ax.annotate('', xy=(x, y2), xytext=(x, y1),
                arrowprops=dict(arrowstyle='->', color=ARROW_COLOR, lw=2.5))

def draw_arrow_right(ax, x1, x2, y):
    """Draw rightward arrow"""
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle='->', color=ARROW_COLOR, lw=2))

# Title
ax.text(9, 21.5, "End-to-End Methodology Workflow",
        ha='center', va='center', fontsize=18, fontweight='bold', color='#1B2631')
ax.text(9, 21.1, "AI-Driven Urban Heat Island Mapping and Forecasting Platform",
        ha='center', va='center', fontsize=11, color='#566573')

# ============================================================
# PHASE 1: DATA ACQUISITION (y: 18.5 - 20.5)
# ============================================================
draw_phase_header(ax, 20.0, 1, "Data Acquisition", PHASE_COLORS[1])

# Data sources row
draw_step_box(ax, 1.2, 18.6, 3.5, 1.1, "Landsat 8/9\n(Band 10 - TIR)", STEP_COLORS[1])
draw_step_box(ax, 5.2, 18.6, 3.5, 1.1, "SRTM DEM\n(30m Elevation)", STEP_COLORS[1])
draw_step_box(ax, 9.2, 18.6, 3.5, 1.1, "WorldPop\n(Population\nDensity)", STEP_COLORS[1])
draw_step_box(ax, 13.2, 18.6, 3.5, 1.1, "Google Earth\nEngine\n(Cloud Processing)", STEP_COLORS[1])

# Feature extraction row
draw_detail_box(ax, 1.2, 17.9, 3.5, 0.55, "LST, NDVI, NDBI", fontsize=9)
draw_detail_box(ax, 5.2, 17.9, 3.5, 0.55, "Elevation (m)", fontsize=9)
draw_detail_box(ax, 9.2, 17.9, 3.5, 0.55, "Pop. per pixel", fontsize=9)
draw_detail_box(ax, 13.2, 17.9, 3.5, 0.55, "Batch extraction", fontsize=9)

# Arrow down to Phase 2
draw_arrow_down(ax, 9, 17.7, 17.1)

# ============================================================
# PHASE 2: DATA PROCESSING PIPELINE (y: 14.5 - 16.8)
# ============================================================
draw_phase_header(ax, 16.3, 2, "Data Processing Pipeline", PHASE_COLORS[2])

# Processing steps
draw_step_box(ax, 1.2, 15.0, 3.8, 1.0, "Dataset\nComposition\n(80,000 samples)", STEP_COLORS[2])
draw_arrow_right(ax, 5.1, 5.5, 15.5)
draw_step_box(ax, 5.5, 15.0, 3.5, 1.0, "Data Quality\nAudit\n(LST 20-60\u00b0C)", STEP_COLORS[2])
draw_arrow_right(ax, 9.1, 9.5, 15.5)
draw_step_box(ax, 9.5, 15.0, 3.5, 1.0, "Correlation\nAnalysis\n(Pearson)", STEP_COLORS[2])
draw_arrow_right(ax, 13.1, 13.5, 15.5)
draw_step_box(ax, 13.5, 15.0, 3.3, 1.0, "Clean Dataset\n(77,668\nsamples)", STEP_COLORS[2])

# Details row
draw_detail_box(ax, 1.2, 14.3, 3.8, 0.55, "4 cities \u00d7 4 years \u00d7 5 features", fontsize=8)
draw_detail_box(ax, 5.5, 14.3, 3.5, 0.55, "Outlier flagging, range check", fontsize=8)
draw_detail_box(ax, 9.5, 14.3, 3.5, 0.55, "NDBI r=0.656, NDVI r=-0.565", fontsize=8)
draw_detail_box(ax, 13.5, 14.3, 3.3, 0.55, "Ready for training", fontsize=8)

# Arrow down to Phase 3
draw_arrow_down(ax, 9, 14.1, 13.5)

# ============================================================
# PHASE 3: MODEL DEVELOPMENT (y: 9.5 - 13.2)
# ============================================================
draw_phase_header(ax, 12.7, 3, "Model Development", PHASE_COLORS[3])

# Model selection and training
draw_step_box(ax, 1.2, 11.3, 3.5, 1.1, "12 Model\nComparison\n(80/20 Split)", STEP_COLORS[3])
draw_arrow_right(ax, 4.8, 5.2, 11.85)
draw_step_box(ax, 5.2, 11.3, 3.5, 1.1, "Random Forest\nSelected\n(R\u00b2 = 0.8362)", STEP_COLORS[3])
draw_arrow_right(ax, 8.8, 9.2, 11.85)
draw_step_box(ax, 9.2, 11.3, 3.5, 1.1, "Hyperparameter\nTuning\n(RandomizedSearch)", STEP_COLORS[3])
draw_arrow_right(ax, 12.8, 13.2, 11.85)
draw_step_box(ax, 13.2, 11.3, 3.5, 1.1, "Tuned RF Model\n(R\u00b2 = 0.8890)", STEP_COLORS[3])

# Validation row
draw_step_box(ax, 1.2, 9.8, 3.5, 1.1, "State-Based\nGroupKFold CV\n(5-Fold)", STEP_COLORS[3])
draw_arrow_right(ax, 4.8, 5.2, 10.35)
draw_step_box(ax, 5.2, 9.8, 3.5, 1.1, "Spatial\nGeneralization\nValidation", STEP_COLORS[3])
draw_arrow_right(ax, 8.8, 9.2, 10.35)
draw_step_box(ax, 9.2, 9.8, 3.5, 1.1, "CatBoost\nTime-Series\n(R\u00b2 = 0.8733)", STEP_COLORS[3])
draw_arrow_right(ax, 12.8, 13.2, 10.35)
draw_step_box(ax, 13.2, 9.8, 3.5, 1.1, "Feature\nImportance\n(MDI)", STEP_COLORS[3])

# Details
draw_detail_box(ax, 1.2, 9.2, 7.5, 0.45, "CV R\u00b2 = 0.7429 | Ensures no spatial leakage between states", fontsize=8)
draw_detail_box(ax, 9.2, 9.2, 7.5, 0.45, "NDBI (38.21%) > NDVI (24.96%) > Population (22.57%) > Elevation (14.26%)", fontsize=8)

# Arrow down to Phase 4
draw_arrow_down(ax, 9, 9.0, 8.4)

# ============================================================
# PHASE 4: APPLICATION WORKFLOW (y: 4.0 - 8.1)
# ============================================================
draw_phase_header(ax, 7.6, 4, "Application Workflow", PHASE_COLORS[4])

# Architecture row
draw_step_box(ax, 1.2, 6.2, 3.5, 1.1, "React 18 +\nTypeScript\n(Frontend)", STEP_COLORS[4])
draw_arrow_right(ax, 4.8, 5.2, 6.75)
draw_step_box(ax, 5.2, 6.2, 3.5, 1.1, "FastAPI\nPython 3.11\n(Backend)", STEP_COLORS[4])
draw_arrow_right(ax, 8.8, 9.2, 6.75)
draw_step_box(ax, 9.2, 6.2, 3.5, 1.1, "Supabase\nPostgreSQL\n(Database)", STEP_COLORS[4])
draw_arrow_right(ax, 12.8, 13.2, 6.75)
draw_step_box(ax, 13.2, 6.2, 3.5, 1.1, "Mapbox GL JS\n(Visualization)", STEP_COLORS[4])

# Platform features row
draw_step_box(ax, 1.2, 4.7, 3.5, 1.1, "Choropleth\nMap\n(Real-time Data)", STEP_COLORS[4])
draw_step_box(ax, 5.2, 4.7, 3.5, 1.1, "Scenario\nSimulator\n(RF Model)", STEP_COLORS[4])
draw_step_box(ax, 9.2, 4.7, 3.5, 1.1, "Time-Series\nForecasting\n(CatBoost)", STEP_COLORS[4])
draw_step_box(ax, 13.2, 4.7, 3.5, 1.1, "Analytics\nDashboard\n(Insights)", STEP_COLORS[4])

# Details row
draw_detail_box(ax, 1.2, 4.1, 3.5, 0.45, "15 states, 131 districts", fontsize=8)
draw_detail_box(ax, 5.2, 4.1, 3.5, 0.45, "What-if NDVI/NDBI sliders", fontsize=8)
draw_detail_box(ax, 9.2, 4.1, 3.5, 0.45, "2026-2035 projections", fontsize=8)
draw_detail_box(ax, 13.2, 4.1, 3.5, 0.45, "Trends & correlations", fontsize=8)

# Output box at bottom
output_box = FancyBboxPatch((3, 2.8), 12, 0.9,
                             boxstyle="round,pad=0.15",
                             facecolor='#1B4F72', edgecolor='white', linewidth=2)
ax.add_patch(output_box)
ax.text(9, 3.25, "AI-Driven Urban Heat Island Decision Support Platform",
        ha='center', va='center', fontsize=13, fontweight='bold', color='white')

draw_arrow_down(ax, 9, 3.9, 3.8)

# Legend
legend_y = 2.0
ax.text(1.5, legend_y, "Legend:", fontsize=10, fontweight='bold', color='#2C3E50')
for i, (label, color) in enumerate(zip(
    ["Data Acquisition", "Data Processing", "Model Development", "Application"],
    [STEP_COLORS[1], STEP_COLORS[2], STEP_COLORS[3], STEP_COLORS[4]])):
    x_pos = 3.5 + i * 3.5
    box = FancyBboxPatch((x_pos, legend_y - 0.2), 2.8, 0.5,
                          boxstyle="round,pad=0.05",
                          facecolor=color, edgecolor='#BDC3C7', linewidth=1)
    ax.add_patch(box)
    ax.text(x_pos + 1.4, legend_y + 0.05, label, ha='center', va='center',
            fontsize=8, fontweight='bold', color='#2C3E50')

plt.tight_layout()
plt.savefig('backend/data/fig_methodology_workflow.png', dpi=300, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print("[OK] Saved to backend/data/fig_methodology_workflow.png")
plt.close()
