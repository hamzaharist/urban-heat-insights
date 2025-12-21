import { MapPin, Thermometer, TreePine, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroMap from "@/assets/hero-map.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroMap}
          alt="Urban Heat Island satellite visualization of Malaysian city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-transparent to-transparent" />
      </div>

      {/* Floating Data Points */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 animate-float" style={{ animationDelay: '0s' }}>
          <div className="bg-card/20 backdrop-blur-md rounded-xl p-3 border border-primary-foreground/20">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Thermometer className="w-4 h-4 text-heat-hot" />
              <span className="text-sm font-medium">+6.2°C</span>
            </div>
          </div>
        </div>
        <div className="absolute top-1/3 right-1/3 animate-float" style={{ animationDelay: '2s' }}>
          <div className="bg-card/20 backdrop-blur-md rounded-xl p-3 border border-primary-foreground/20">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Building2 className="w-4 h-4 text-heat-warm" />
              <span className="text-sm font-medium">High Density</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-1/3 right-1/4 animate-float" style={{ animationDelay: '4s' }}>
          <div className="bg-card/20 backdrop-blur-md rounded-xl p-3 border border-primary-foreground/20">
            <div className="flex items-center gap-2 text-primary-foreground">
              <TreePine className="w-4 h-4 text-eco" />
              <span className="text-sm font-medium">Low NDVI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 animate-fade-up">
            <MapPin className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground">Malaysian Urban Climate Research</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
            AI-Powered Insights Into Where Cities Are{" "}
            <span className="text-gradient-heat">Heating Up</span>
            {" "}— And How to Cool Them Down
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 leading-relaxed max-w-2xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Leveraging satellite imagery and machine learning to map, predict, and simulate Urban Heat Island effects across Malaysian cities. A decision-support platform for sustainable urban planning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate('/heatmap')}
            >
              Explore Heat Maps
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              onClick={() => navigate('/scenarios')}
            >
              View Future Scenarios
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary-foreground/20 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div>
              <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">+4-9°C</div>
              <div className="text-sm text-primary-foreground/70 mt-1">Urban-Rural Difference</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">30m</div>
              <div className="text-sm text-primary-foreground/70 mt-1">Spatial Resolution</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">10yr</div>
              <div className="text-sm text-primary-foreground/70 mt-1">Forecast Horizon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Heat Gradient Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 heat-gradient-bar" />
    </section>
  );
};

export default HeroSection;
