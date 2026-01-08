---
stepsCompleted: [1, 2]
inputDocuments: []
session_topic: 'Inverse Goal Seeking / AI Remediation Features'
session_goals: 'List one killer feature based on unused Supabase data'
selected_approach: '2'
techniques_used: ['Schema Analysis', 'Gap Analysis', 'Location Mapping']
ideas_generated: ['Population Exposure Dashboard', 'Vulnerability Index']
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Omen
**Date:** 2026-01-01

## Session Overview

**Topic:** Inverse Goal Seeking / AI Remediation Features
**Goals:** List one killer feature based on unused Supabase data

### Schema Analysis results

I have analyzed your codebase and discovered the following "Hidden Gems" in your Supabase data that are currently **unused** on the frontend:

1.  **`population`**: Found in `hotspots` table (referenced in `prediction_api.py`).
2.  **`elevation`**: Found in `hotspots` table (referenced in `prediction_api.py`).

### The Killer Feature: "Population Exposure Risk"

**Concept**: Combine `avg_temperature` with `population` to quantify human impact.

**Why it's Killer**:
*   Policy makers care about *people*, not just degrees Celsius.
*   "35°C in a forest" is a statistic. "35°C affecting 500,000 residents" is a **crisis**.

### Implementation Location: Scenario Page

We will implement this directly on the **Scenario Page** (`/scenarios`).

**User Flow**:
1.  **AI Diagnosis**: When a user selects a district, the AI says:
    *   "This district is **High Risk**."
    *   "Reason: High Urban Density (NDBI 0.75)."
    *   "Impact: **45,000 People** exposed to >35°C heat."
2.  **AI Prescription**: "Increasing vegetation by 10% will reduce temperature by 1.2°C, protecting **15,000 people**."

### Next Steps
1.  Update `prediction_api.py` to return population data and calculate "Risk Score".
2.  Update `ScenarioPage.tsx` interface to display this "Human Impact" metric.
