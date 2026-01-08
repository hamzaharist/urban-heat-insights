import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Leaf, Building2, AlertCircle } from 'lucide-react';

interface HeatDriver {
  factor: string;
  contribution_percent: number;
  impact_celsius: number;
}

interface DiagnosticData {
  location: string;
  current_temp: number;
  baseline_ndvi: number;
  baseline_ndbi: number;
  drivers: HeatDriver[];
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
  feasible: boolean;
  notes: string[];
}

interface ConsultantPanelProps {
  location: string;
  onApplyFix?: (targetNdvi: number) => void;
}

export function ConsultantPanel({ location, onApplyFix }: ConsultantPanelProps) {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [isLoadingPrescription, setIsLoadingPrescription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetReduction, setTargetReduction] = useState(2.0);

  // Fetch diagnostics when location changes
  useEffect(() => {
    if (!location) return;

    const fetchDiagnostics = async () => {
      setIsLoadingDiagnostics(true);
      setError(null);
      setPrescriptionData(null);

      try {
        const response = await fetch(
          `http://localhost:8000/api/spatial/diagnose?city=${encodeURIComponent(location)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch diagnostics: ${response.statusText}`);
        }

        const data = await response.json();
        setDiagnosticData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load diagnostics');
        console.error('Diagnostics error:', err);
      } finally {
        setIsLoadingDiagnostics(false);
      }
    };

    fetchDiagnostics();
  }, [location]);

  // Fetch prescription
  const handleGetPrescription = async () => {
    if (!location) return;

    setIsLoadingPrescription(true);
    setError(null);

    try {
      const response = await fetch(
        'http://localhost:8000/api/spatial/prescribe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city: location,
            target_temp_reduction: targetReduction,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prescription: ${response.statusText}`);
      }

      const data = await response.json();
      setPrescriptionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescription');
      console.error('Prescription error:', err);
    } finally {
      setIsLoadingPrescription(false);
    }
  };

  if (isLoadingDiagnostics) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Analyzing heat drivers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive mb-1">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!diagnosticData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading analysis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Current State</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Temperature</p>
            <p className="text-lg font-bold text-orange-500">{diagnosticData.current_temp.toFixed(1)}°C</p>
          </Card>
          <Card className="p-3 bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">NDVI</p>
            <p className="text-lg font-bold text-green-500">{diagnosticData.baseline_ndvi.toFixed(3)}</p>
          </Card>
        </div>
      </div>

      {/* Heat Drivers */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Heat Drivers</h3>
        <div className="space-y-2">
          {diagnosticData.drivers.map((driver, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {driver.factor === 'Vegetation Deficit' ? (
                    <Leaf className="w-4 h-4 text-green-500" />
                  ) : (
                    <Building2 className="w-4 h-4 text-orange-500" />
                  )}
                  <span className="text-foreground">{driver.factor}</span>
                </div>
                <span className="font-semibold text-foreground">
                  {driver.contribution_percent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    driver.factor === 'Vegetation Deficit'
                      ? 'bg-green-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${driver.contribution_percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Impact: {driver.impact_celsius > 0 ? '+' : ''}{driver.impact_celsius.toFixed(2)}°C per 0.1 change
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">AI Recommendation</h3>
        <p className="text-sm text-muted-foreground">{diagnosticData.recommendation}</p>
      </div>

      {/* Get Prescription */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Get Cooling Prescription</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              Target Temperature Reduction (°C)
            </label>
            <input
              type="number"
              value={targetReduction}
              onChange={(e) => setTargetReduction(parseFloat(e.target.value) || 0)}
              min="0.5"
              max="10"
              step="0.5"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
            />
          </div>
          <Button
            onClick={handleGetPrescription}
            disabled={isLoadingPrescription}
            className="mt-5"
          >
            {isLoadingPrescription ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating...
              </>
            ) : (
              'Calculate'
            )}
          </Button>
        </div>
      </div>

      {/* Prescription Results */}
      {prescriptionData && (
        <Card className="p-4 bg-card/50">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-semibold text-foreground">Prescription</h3>
              {prescriptionData.feasible ? (
                <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                  Feasible
                </span>
              ) : (
                <span className="px-2 py-1 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
                  Partial Solution
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Temp</p>
                <p className="text-lg font-semibold text-foreground">
                  {prescriptionData.current_temp.toFixed(1)}°C
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Temp</p>
                <p className="text-lg font-semibold text-green-500">
                  {prescriptionData.target_temp.toFixed(1)}°C
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">NDVI Change Required</span>
                <span className="font-semibold text-foreground">
                  {prescriptionData.current_ndvi.toFixed(3)} → {prescriptionData.target_ndvi.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-500">
                  +{prescriptionData.ndvi_increase_needed.toFixed(3)} NDVI increase
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {prescriptionData.notes.map((note, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  • {note}
                </p>
              ))}
            </div>

            {prescriptionData.feasible && onApplyFix && (
              <Button
                onClick={() => onApplyFix(prescriptionData.target_ndvi)}
                className="w-full"
                variant="default"
              >
                Apply Fix to Map
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
