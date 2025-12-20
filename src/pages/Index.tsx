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
        <section id="predictions">
          <PredictionSection selectedCity={selectedCity} />
        </section>
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
