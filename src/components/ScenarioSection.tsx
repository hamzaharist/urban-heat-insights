import { useState } from "react";
import { TreePine, Building2, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

const ScenarioSection = () => {
  const [greeneryLevel, setGreeneryLevel] = useState([30]);
  const [builtUpLevel, setBuiltUpLevel] = useState([70]);

  // Calculate simulated temperature based on sliders
  const baseTemp = 37.5;
  const greeneryEffect = (greeneryLevel[0] - 30) * 0.03; // More greenery = cooler
  const builtUpEffect = (builtUpLevel[0] - 70) * 0.02; // More built-up = hotter
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

            {/* Greenery Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-eco/10 rounded-lg">
                    <TreePine className="w-5 h-5 text-eco" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Vegetation Cover</p>
                    <p className="text-xs text-muted-foreground">NDVI-based greenery index</p>
                  </div>
                </div>
                <span className="text-2xl font-display font-bold text-eco">{greeneryLevel[0]}%</span>
              </div>
              <Slider
                value={greeneryLevel}
                onValueChange={setGreeneryLevel}
                max={80}
                min={10}
                step={5}
                className="[&_[role=slider]]:bg-eco [&_[role=slider]]:border-eco [&_.bg-primary]:bg-eco"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Low (10%)</span>
                <span>Current (30%)</span>
                <span>High (80%)</span>
              </div>
            </div>

            {/* Built-up Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Built-up Density</p>
                    <p className="text-xs text-muted-foreground">NDBI-based urban intensity</p>
                  </div>
                </div>
                <span className="text-2xl font-display font-bold text-primary">{builtUpLevel[0]}%</span>
              </div>
              <Slider
                value={builtUpLevel}
                onValueChange={setBuiltUpLevel}
                max={95}
                min={40}
                step={5}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Sparse (40%)</span>
                <span>Current (70%)</span>
                <span>Dense (95%)</span>
              </div>
            </div>

            {/* Scenario Presets */}
            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Quick Scenarios</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setGreeneryLevel([50]); setBuiltUpLevel([60]); }}
                >
                  Green City Initiative
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setGreeneryLevel([15]); setBuiltUpLevel([90]); }}
                >
                  High-Density Growth
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setGreeneryLevel([30]); setBuiltUpLevel([70]); }}
                >
                  Reset to Current
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
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current State</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Temp</span>
                    <span className="font-semibold text-foreground">37.5°C</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Greenery</span>
                    <span className="font-semibold text-foreground">30%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-foreground">70%</span>
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
                    <span className="font-semibold text-eco">{greeneryLevel[0]}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Built-up</span>
                    <span className="font-semibold text-primary">{builtUpLevel[0]}%</span>
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
