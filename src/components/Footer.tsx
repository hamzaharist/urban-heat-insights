import { MapPin, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold">UHI Malaysia</span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-4">
              AI-Driven Urban Heat Island Mapping & Prediction Platform for Malaysian Cities. 
              Supporting sustainable urban planning through data-driven insights.
            </p>
            <div className="flex items-center gap-2 text-sm text-background/50">
              <span>Aligned with</span>
              <span className="px-2 py-1 bg-eco/20 text-eco rounded text-xs font-semibold">
                SDG 11
              </span>
              <span>Sustainable Cities</span>
            </div>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-display font-semibold mb-4">Data Sources</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                <span>Landsat 8/9 (USGS/NASA)</span>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                <span>Sentinel-2 (ESA Copernicus)</span>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                <span>Google Earth Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <ExternalLink className="w-3 h-3" />
                <span>Malaysian Meteorological Dept.</span>
              </li>
            </ul>
          </div>

          {/* Academic */}
          <div>
            <h4 className="font-display font-semibold mb-4">Academic Affiliation</h4>
            <p className="text-sm text-background/70 mb-4">
              Final Year Project<br />
              Department of Computer & Information Sciences<br />
              Universiti Teknologi PETRONAS
            </p>
            <p className="text-xs text-background/50">
              This platform is developed for academic research purposes. 
              Data and predictions should be validated before use in official planning decisions.
            </p>
          </div>
        </div>

        {/* Heat gradient divider */}
        <div className="h-1 heat-gradient-bar rounded-full mb-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50">
          <p>© 2024 UHI Malaysia Research Platform. For academic use.</p>
          <div className="flex items-center gap-6">
            <span>Research Disclaimer</span>
            <span>Data Attribution</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
