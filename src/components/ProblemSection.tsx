import { Thermometer, Heart, Zap, Leaf } from "lucide-react";

const ProblemSection = () => {
  return (
    <section className="section-spacing bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-4">
            The Challenge
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Urban Heat Islands Are Making Malaysian Cities Dangerously Hot
          </h2>
          <p className="text-lg text-muted-foreground">
            As cities expand and green spaces shrink, concrete and asphalt absorb and re-emit heat,
            creating localized warming that threatens public health and sustainability.
          </p>
        </div>

        {/* Visual Comparison */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Urban vs Rural Card */}
          <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">Temperature Comparison</h3>

            <div className="space-y-6">
              {/* Urban */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Urban Core (Kuala Lumpur)</span>
                  <span className="text-sm font-bold text-heat-extreme">37.0°C</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-heat-warm via-heat-hot to-heat-extreme"
                    style={{ width: '95%' }}
                  />
                </div>
              </div>

              {/* Suburban */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Suburban Areas</span>
                  <span className="text-sm font-bold text-heat-warm">35.3°C</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-heat-mild to-heat-warm"
                    style={{ width: '70%' }}
                  />
                </div>
              </div>

              {/* Rural */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Rural/Forested</span>
                  <span className="text-sm font-bold text-heat-cool">33.0°C</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-heat-cool to-heat-mild"
                    style={{ width: '45%' }}
                  />
                </div>
              </div>
            </div>

            {/* Heat Scale Legend */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Cool</span>
                <span>Moderate</span>
                <span>Extreme</span>
              </div>
              <div className="h-2 heat-gradient-bar rounded-full" />
            </div>
          </div>

          {/* Impact Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 border-l-4 border-heat-extreme">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-heat-extreme/10 rounded-xl">
                  <Heart className="w-6 h-6 text-heat-extreme" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-2">Public Health Risk</h4>
                  <p className="text-sm text-muted-foreground">
                    Heat-related illnesses increase by 15-20% during UHI peak events.
                    Vulnerable populations face heightened cardiovascular and respiratory risks.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 border-l-4 border-heat-hot">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-heat-hot/10 rounded-xl">
                  <Zap className="w-6 h-6 text-heat-hot" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-2">Energy Demand Surge</h4>
                  <p className="text-sm text-muted-foreground">
                    Air conditioning demand spikes 5-10% for every 1°C increase,
                    straining power grids and increasing carbon emissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 border-l-4 border-eco">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-eco/10 rounded-xl">
                  <Leaf className="w-6 h-6 text-eco" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-foreground mb-2">Sustainability Challenge</h4>
                  <p className="text-sm text-muted-foreground">
                    UHI effects undermine climate adaptation efforts and SDG 11
                    (Sustainable Cities) goals across Southeast Asian urban centers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stat Callout */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center">
          <Thermometer className="w-12 h-12 text-accent mx-auto mb-4" />
          <p className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            +4°C to +9°C
          </p>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Temperature difference between urban cores and surrounding rural areas in Malaysian cities during peak heating hours
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
