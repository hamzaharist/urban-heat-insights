import { useState, useEffect } from 'react';
import { Users, Flame, TrendingUp, AlertTriangle, Leaf, Building2, Target, CheckCircle2, Loader2 } from 'lucide-react';

interface DiagnosisData {
  location: string;
  current_temp: number;
  population: number;
  population_at_risk: number;
  heat_risk_threshold: number;
  drivers: Array<{
    factor: string;
    contribution_percent: number;
    impact_celsius: number;
  }>;
  dominant_factor: string;
  recommendation: string;
}

interface PrescriptionData {
  location: string;
  current_temp: number;
  target_temp: number;
  current_ndvi: number;
  target_ndvi: number;
  ndvi_increase_needed: number;
  current_population_at_risk: number;
  people_protected: number;
  feasible: boolean;
  notes: string[];
}

interface ConsultantPanelProps {
  selectedDistrict: string | null;
  onApplyIntervention?: (ndviChange: number) => void;
}

export function ConsultantPanel({ selectedDistrict, onApplyIntervention }: ConsultantPanelProps) {
  const [mode, setMode] = useState<'diagnosis' | 'prescription'>('diagnosis');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [targetReduction, setTargetReduction] = useState(2.0);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);

  // Fetch diagnosis when district is selected
  useEffect(() => {
    if (!selectedDistrict) {
      setDiagnosisData(null);
      setPrescriptionData(null);
      return;
    }

    const fetchDiagnosis = async () => {
      setIsLoadingDiagnosis(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/spatial/diagnose?city=${encodeURIComponent(selectedDistrict)}`,
          { method: 'POST' }
        );
        if (response.ok) {
          const data = await response.json();
          setDiagnosisData(data);
        }
      } catch (error) {
        console.error('Failed to fetch diagnosis:', error);
      } finally {
        setIsLoadingDiagnosis(false);
      }
    };

    fetchDiagnosis();
  }, [selectedDistrict]);

  const handlePrescribe = async () => {
    if (!selectedDistrict) return;

    setIsLoadingPrescription(true);
    try {
      const response = await fetch(
        'http://localhost:8000/api/spatial/prescribe',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city: selectedDistrict,
            target_temp_reduction: targetReduction
          })
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPrescriptionData(data);
        setMode('prescription');
      }
    } catch (error) {
      console.error('Failed to fetch prescription:', error);
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  const handleApply = () => {
    if (prescriptionData && onApplyIntervention) {
      onApplyIntervention(prescriptionData.ndvi_increase_needed);
    }
  };

  if (!selectedDistrict) {
    return (
      <div className="absolute top-24 right-6 z-20 w-[420px]">
        <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-8 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-teal-400/60 animate-pulse" />
          <h3 className="text-xl font-bold text-white mb-2">
            AI Urban Cooling Consultant
          </h3>
          <p className="text-sm text-white/60">
            Click on a district to get AI-powered heat mitigation recommendations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-24 right-6 z-20 w-[420px] space-y-4">
      {/* Mode Toggle */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-2 flex gap-2">
        <button
          onClick={() => setMode('diagnosis')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${mode === 'diagnosis'
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
        >
          Diagnosis
        </button>
        <button
          onClick={() => setMode('prescription')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${mode === 'prescription'
              ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
              : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
        >
          Prescription
        </button>
      </div>

      {/* Diagnosis Mode */}
      {mode === 'diagnosis' && (
        <>
          {/* THE KILLER FEATURE: Population at Risk Card */}
          {isLoadingDiagnosis ? (
            <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-6 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : diagnosisData ? (
            <>
              <div className="backdrop-blur-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl shadow-2xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-red-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-300 uppercase tracking-wide mb-1">
                      Population Exposure Risk
                    </h3>
                    <div className="text-4xl font-bold text-white">
                      {diagnosisData.population_at_risk.toLocaleString()}
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      people exposed to dangerous heat (&gt; {diagnosisData.heat_risk_threshold}°C)
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Total Population:</span>
                    <span className="font-semibold text-white">{diagnosisData.population.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-white/60">Current Temperature:</span>
                    <span className="font-semibold text-orange-300">{diagnosisData.current_temp.toFixed(1)}°C</span>
                  </div>
                </div>
              </div>

              {/* Heat Drivers Analysis */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Why It's Hot
                </h3>

                <div className="space-y-3">
                  {diagnosisData.drivers.map((driver, idx) => (
                    <div key={idx} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {driver.factor === 'Urban Density' ? (
                            <Building2 className="w-4 h-4 text-blue-400" />
                          ) : (
                            <Leaf className="w-4 h-4 text-green-400" />
                          )}
                          <span className="text-sm font-medium text-white">{driver.factor}</span>
                        </div>
                        <span className="text-sm font-bold text-white">{driver.contribution_percent.toFixed(1)}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${driver.factor === 'Urban Density'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                              : 'bg-gradient-to-r from-green-500 to-teal-500'
                            }`}
                          style={{ width: `${driver.contribution_percent}%` }}
                        />
                      </div>

                      <p className="text-xs text-white/60 mt-1">
                        Impact: {driver.impact_celsius.toFixed(2)}°C per 0.1 unit change
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-white/80 leading-relaxed">
                      {diagnosisData.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Get Prescription Button */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-4">
                <label className="text-xs font-medium text-white/70 uppercase tracking-wide block mb-2">
                  Target Temperature Reduction
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={targetReduction}
                    onChange={(e) => setTargetReduction(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider-thumb-green"
                  />
                  <span className="text-lg font-bold text-white min-w-[60px] text-center">
                    {targetReduction.toFixed(1)}°C
                  </span>
                </div>

                <button
                  onClick={handlePrescribe}
                  disabled={isLoadingPrescription}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingPrescription ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Get AI Prescription
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* Prescription Mode */}
      {mode === 'prescription' && prescriptionData && (
        <>
          {/* Implementation Plan */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-black/60 to-black/40 border border-white/10 rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Implementation Plan
            </h3>

            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">NDVI Change Required</span>
                <span className="text-lg font-bold text-white">
                  +{(prescriptionData.ndvi_increase_needed * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>{prescriptionData.current_ndvi.toFixed(3)}</span>
                <TrendingUp className="w-3 h-3" />
                <span>{prescriptionData.target_ndvi.toFixed(3)}</span>
              </div>
            </div>

            <div className={`px-4 py-3 rounded-lg mb-4 flex items-center gap-2 ${prescriptionData.feasible
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-red-500/20 border border-red-500/30'
              }`}>
              {prescriptionData.feasible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span className="text-xs font-semibold text-green-300">Feasible with vegetation alone</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-300" />
                  <span className="text-xs font-semibold text-red-300">Requires additional interventions</span>
                </>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {prescriptionData.notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleApply}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-5 h-5" />
              Apply to Map Simulation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
