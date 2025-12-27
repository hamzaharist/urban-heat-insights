import { useState } from "react";
import { TreePine, Building2, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const ScenarioSection = () => {
  // Adjustment values from baseline (-50 to +50)
  const [greenAdjustment, setGreenAdjustment] = useState([0]);
  const [builtupAdjustment, setBuiltupAdjustment] = useState([0]);

  // Baseline values
  const baselineGreen = 30;
  const baselineBuiltup = 70;

  // Calculate actual percentages
  const actualGreen = Math.max(10, Math.min(80, baselineGreen + greenAdjustment[0]));
  const actualBuiltup = Math.max(40, Math.min(95, baselineBuiltup + builtupAdjustment[0]));

  // Calculate simulated temperature based on adjustments
  const baseTemp = 35.1; // Actual Malaysia average temperature
  const greeneryEffect = greenAdjustment[0] * 0.03; // Adjustment in cooling
  const builtUpEffect = builtupAdjustment[0] * 0.02; // Adjustment in heating
  const projectedTemp = (baseTemp - greeneryEffect + builtUpEffect).toFixed(1);
  const tempChange = (parseFloat(projectedTemp) - baseTemp).toFixed(1);
  const isPositive = parseFloat(tempChange) >= 0;

  return (
    <section className="py-20 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="inline-block text-sm font-semibold text-eco uppercase tracking-wider mb-4">
            Scenario Simulation
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            What-If Analysis for Urban Planning
          </h2>
          <p className="text-lg text-muted-foreground">
            Explore how changes in land cover could affect urban temperatures.
            Adjust greenery and built-up density to visualize potential outcomes.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls Panel */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Adjust Land Cover Parameters
            </h3>

            {/* Green Cover Adjustment Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-eco/10 rounded-lg">
                    <TreePine className="w-5 h-5 text-eco" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Green Cover Adjustment</p>
                    <p className="text-xs text-muted-foreground">From baseline {baselineGreen}%</p>
                  </div>
                </div>
                <span className={`text-2xl font-display font-bold ${greenAdjustment[0] >= 0 ? 'text-eco' : 'text-orange-500'}`}>
                  {greenAdjustment[0] > 0 ? '+' : ''}{greenAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={greenAdjustment}
                onValueChange={setGreenAdjustment}
                max={50}
                min={-50}
                step={5}
                className="[&_[role=slider]]:bg-eco [&_[role=slider]]:border-eco [&_.bg-primary]:bg-eco"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
                <span>-50%</span>
                <span className="absolute left-1/2 -translate-x-1/2">0%</span>
                <span>+50%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Actual: {actualGreen}%
              </p>
            </div>

            {/* Building Density Adjustment Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Building Density Adjustment</p>
                    <p className="text-xs text-muted-foreground">From baseline {baselineBuiltup}%</p>
                  </div>
                </div>
                <span className={`text-2xl font-display font-bold ${builtupAdjustment[0] >= 0 ? 'text-primary' : 'text-blue-500'}`}>
                  {builtupAdjustment[0] > 0 ? '+' : ''}{builtupAdjustment[0]}%
                </span>
              </div>
              <Slider
                value={builtupAdjustment}
                onValueChange={setBuiltupAdjustment}
                max={50}
                min={-50}
                step={5}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 relative">
                <span>-50%</span>
                <span className="absolute left-1/2 -translate-x-1/2">0%</span>
                <span>+50%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                Actual: {actualBuiltup}%
              </p>
            </div>

            {/* Scenario Presets */}
            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Quick Scenarios</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setGreenAdjustment([+20]); setBuiltupAdjustment([-10]); }}
                >
                  Green City Initiative
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setGreenAdjustment([-15]); setBuiltupAdjustment([+20]); }}
                >
                  High-Density Growth
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setGreenAdjustment([0]); setBuiltupAdjustment([0]); }}
                >
                  Reset to Baseline
                </Button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-6">
            {/* Temperature Result */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 md:p-8 text-primary-foreground">
              <h3 className="font-display text-lg font-semibold mb-6 text-primary-foreground/90">
                Projected Outcome
              </h3>

              <div className="flex items-end justify-between mb-6">
                <div>
                  <p className="text-sm text-primary-foreground/70 mb-1">Estimated Peak Temperature</p>
                  <p className="text-5xl md:text-6xl font-display font-bold">{projectedTemp}°C</p>
                </div>
                <div className={`px-4 py-2 rounded-full ${isPositive ? 'bg-heat-hot/20' : 'bg-eco/20'}`}>
                  <span className={`text-lg font-bold ${isPositive ? 'text-heat-warm' : 'text-eco'}`}>
                    {isPositive ? '+' : ''}{tempChange}°C
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-xl">
                <ArrowRight className="w-5 h-5 text-primary-foreground/70" />
                <p className="text-sm text-primary-foreground/80">
                  {parseFloat(tempChange) < -1
                    ? "Significant cooling effect from increased vegetation"
                    : parseFloat(tempChange) > 1
                      ? "Warning: Higher heat stress expected with this configuration"
                      : "Moderate changes with minimal temperature impact"
                  }
                </p>
              </div>
            </div>

            {/* Before/After Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-5 shadow-card">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Baseline State</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Temp</span>
                    <span className="font-semibold text-foreground">35.1°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Greenery</span>
                    <span className="font-semibold text-foreground">{baselineGreen}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-foreground">{baselineBuiltup}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-5 shadow-card border-2 border-primary/20">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Your Scenario</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Temp</span>
                    <span className={`font-semibold ${isPositive ? 'text-heat-hot' : 'text-eco'}`}>{projectedTemp}°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Greenery</span>
                    <span className="font-semibold text-eco">{actualGreen}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-primary">{actualBuiltup}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Planning Note */}
            <div className="bg-eco/5 border border-eco/20 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-eco">Planning Insight:</span> This simulation
                demonstrates how land cover changes influence urban temperatures, supporting
                evidence-based decisions for sustainable urban development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScenarioSection;
