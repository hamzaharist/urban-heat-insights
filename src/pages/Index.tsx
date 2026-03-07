import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import TechnologySection from "@/components/TechnologySection";
import MapSection from "@/components/MapSection";
import PredictionSection from "@/components/PredictionSection";
import ScenarioSection from "@/components/ScenarioSection";
import UseCasesSection from "@/components/UseCasesSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [selectedCity, setSelectedCity] = useState('Kuala Lumpur');

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <section id="problem">
          <ProblemSection />
        </section>
        <section id="technology">
          <TechnologySection />
        </section>
        <section id="map">
          <MapSection selectedCity={selectedCity} onCityChange={setSelectedCity} />
        </section>

        {/* Narrative connector: Map → Predictions */}
        <div className="relative py-12 bg-gradient-to-b from-background to-muted/50 overflow-hidden">
          <div className="container max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-primary/80 mb-3">
              <div className="w-8 h-px bg-primary/30" />
              <span className="text-xs font-semibold uppercase tracking-widest">What's Next</span>
              <div className="w-8 h-px bg-primary/30" />
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Now that you've seen <span className="font-semibold text-foreground">where heat concentrates today</span>,
              let's explore <span className="font-semibold text-foreground">where it's heading</span> over the next decade.
            </p>
          </div>
        </div>

        <section id="predictions">
          <PredictionSection selectedCity={selectedCity} />
        </section>

        {/* Narrative connector: Predictions → Scenarios */}
        <div className="relative py-12 bg-gradient-to-b from-muted/50 to-background overflow-hidden">
          <div className="container max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-eco/80 mb-3">
              <div className="w-8 h-px bg-eco/30" />
              <span className="text-xs font-semibold uppercase tracking-widest">Take Action</span>
              <div className="w-8 h-px bg-eco/30" />
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              What can urban planners do about this rising trend? Adjust the parameters below to
              explore <span className="font-semibold text-foreground">how green infrastructure and land use changes</span> could reshape the future.
            </p>
          </div>
        </div>

        <section id="scenarios">
          <ScenarioSection />
        </section>
        <section id="use-cases">
          <UseCasesSection />
        </section>
        <section id="about">
          <AboutSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
