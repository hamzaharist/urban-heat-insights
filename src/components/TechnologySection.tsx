import { Satellite, Brain, Globe, Database } from "lucide-react";

const TechnologySection = () => {
  const technologies = [
    {
      icon: Satellite,
      title: "Satellite Imagery",
      subtitle: "Landsat 8/9 & Sentinel-2",
      description: "High-resolution thermal and multispectral data for Land Surface Temperature (LST), vegetation indices (NDVI), and built-up intensity (NDBI).",
      color: "primary" as const,
    },
    {
      icon: Brain,
      title: "Machine Learning",
      subtitle: "Random Forest & XGBoost",
      description: "Ensemble models trained on spatial-temporal patterns to predict heat distribution and identify key contributing factors.",
      color: "accent" as const,
    },
    {
      icon: Globe,
      title: "Geospatial Processing",
      subtitle: "Google Earth Engine",
      description: "Cloud-based planetary-scale analysis for efficient processing of multi-decadal satellite imagery across Malaysian cities.",
      color: "eco" as const,
    },
    {
      icon: Database,
      title: "Data Integration",
      subtitle: "Multi-source Fusion",
      description: "Combining remote sensing, meteorological data, and urban morphology metrics for comprehensive heat analysis.",
      color: "primary" as const,
    },
  ];

  const getColorClasses = (color: "primary" | "accent" | "eco") => {
    const colors = {
      primary: {
        bg: "bg-primary/10",
        text: "text-primary",
        border: "border-primary/20",
      },
      accent: {
        bg: "bg-accent/10",
        text: "text-accent",
        border: "border-accent/20",
      },
      eco: {
        bg: "bg-eco/10",
        text: "text-eco",
        border: "border-eco/20",
      },
    };
    return colors[color];
  };

  return (
    <section className="section-spacing bg-muted/50">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Technology Stack
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Data-Driven Urban Climate Analysis
          </h2>
          <p className="text-lg text-muted-foreground">
            Combining cutting-edge satellite technology with advanced machine learning
            to deliver neighborhood-level heat insights at 30-meter resolution.
          </p>
        </div>

        {/* Technology Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {technologies.map((tech, index) => {
            const colorClasses = getColorClasses(tech.color);
            return (
              <div
                key={tech.title}
                className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 ${colorClasses.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <tech.icon className={`w-7 h-7 ${colorClasses.text}`} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {tech.title}
                </h3>
                <p className={`text-sm font-medium ${colorClasses.text} mb-3`}>
                  {tech.subtitle}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tech.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Pipeline Visualization */}
        <div className="bg-card rounded-2xl p-8 shadow-card">
          <h3 className="font-display text-xl font-semibold text-foreground text-center mb-8">
            Data Processing Pipeline
          </h3>


          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Satellite className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">Satellite Data</h4>
              <p className="text-xs text-muted-foreground mt-1">Landsat & Sentinel</p>
            </div>

            {/* Arrow - centered with circles */}
            <div className="flex items-center justify-center md:mb-12">
              <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-primary to-accent" />
              <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-primary to-accent" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">GEE Processing</h4>
              <p className="text-xs text-muted-foreground mt-1">Cloud Computation</p>
            </div>

            {/* Arrow - centered with circles */}
            <div className="flex items-center justify-center md:mb-12">
              <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-primary to-accent" />
              <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-primary to-accent" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-3">
                <Brain className="w-8 h-8 text-accent" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">ML Prediction</h4>
              <p className="text-xs text-muted-foreground mt-1">RF & XGBoost</p>
            </div>

            {/* Arrow - centered with circles */}
            <div className="flex items-center justify-center md:mb-12">
              <div className="hidden md:block w-12 h-0.5 bg-gradient-to-r from-accent to-eco" />
              <div className="md:hidden h-8 w-0.5 bg-gradient-to-b from-accent to-eco" />
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center flex-1">
              <div className="w-16 h-16 bg-eco/10 rounded-full flex items-center justify-center mb-3">
                <Database className="w-8 h-8 text-eco" />
              </div>
              <h4 className="font-semibold text-foreground text-sm">Visualization</h4>
              <p className="text-xs text-muted-foreground mt-1">Interactive Maps</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
