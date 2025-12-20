import { Building, FileText, GraduationCap } from "lucide-react";

const UseCasesSection = () => {
  const useCases = [
    {
      icon: Building,
      title: "Urban Planners",
      description: "Identify priority zones for green infrastructure investments and heat mitigation measures. Use data-driven insights to optimize city development strategies.",
      benefits: ["Hotspot identification", "Site prioritization", "Impact assessment"],
    },
    {
      icon: FileText,
      title: "Policymakers",
      description: "Evaluate the effectiveness of proposed greening strategies before implementation. Make evidence-based decisions for sustainable urban policies.",
      benefits: ["Scenario comparison", "Cost-benefit analysis", "SDG alignment"],
    },
    {
      icon: GraduationCap,
      title: "Researchers",
      description: "Access high-resolution spatial data for urban climate studies. Validate models and contribute to the growing body of UHI research in tropical cities.",
      benefits: ["Data access", "Model validation", "Trend analysis"],
    },
  ];

  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
            Applications
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-6">
            Who Benefits From This Platform?
          </h2>
          <p className="text-lg text-muted-foreground">
            Designed to serve multiple stakeholders in the urban sustainability ecosystem, 
            from municipal authorities to academic researchers.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={useCase.title}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 group"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <useCase.icon className="w-7 h-7 text-primary" />
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {useCase.title}
              </h3>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {useCase.description}
              </p>

              <div className="space-y-2">
                {useCase.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
