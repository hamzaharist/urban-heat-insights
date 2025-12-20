import { GraduationCap, Target, Globe } from "lucide-react";

const AboutSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              About the Project
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
              Academic Research for Real-World Impact
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              This platform is developed as a Final Year Project at Universiti Teknologi PETRONAS, 
              combining advanced remote sensing, machine learning, and geospatial visualization 
              to address the growing challenge of urban heat in Malaysian cities.
            </p>

            <p className="text-muted-foreground mb-8 leading-relaxed">
              The methodology integrates multi-temporal Landsat and Sentinel satellite imagery 
              with ensemble machine learning models to provide neighborhood-level heat analysis 
              and future projections. The platform is designed to be extensible to other 
              Malaysian urban centers and can serve as a template for similar initiatives 
              in tropical Southeast Asian cities.
            </p>

            {/* Key Points */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Academic Rigor</h4>
                  <p className="text-sm text-muted-foreground">Peer-reviewed methodology and validated models</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg mt-1">
                  <Target className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Practical Focus</h4>
                  <p className="text-sm text-muted-foreground">Decision-support tools for real planning needs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-eco/10 rounded-lg mt-1">
                  <Globe className="w-5 h-5 text-eco" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Extensible Design</h4>
                  <p className="text-sm text-muted-foreground">Adaptable to other Malaysian cities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual/Info Panel */}
          <div className="bg-card rounded-2xl p-8 shadow-card">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">
              Methodology Overview
            </h3>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold text-foreground mb-1">Data Acquisition</h4>
                  <p className="text-sm text-muted-foreground">
                    Multi-temporal satellite imagery from Landsat 8/9 (thermal) and 
                    Sentinel-2 (multispectral) via Google Earth Engine
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold text-foreground mb-1">Feature Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    Derivation of LST, NDVI (vegetation), NDBI (built-up), and 
                    other spectral indices at 30m resolution
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="w-0.5 h-full bg-border mt-2" />
                </div>
                <div className="pb-6">
                  <h4 className="font-semibold text-foreground mb-1">ML Modeling</h4>
                  <p className="text-sm text-muted-foreground">
                    Random Forest and XGBoost ensemble models trained on 
                    spatial-temporal patterns for prediction and factor analysis
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-eco text-primary-foreground flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Visualization & Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    Interactive web-based mapping and scenario simulation 
                    for stakeholder access and decision support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
