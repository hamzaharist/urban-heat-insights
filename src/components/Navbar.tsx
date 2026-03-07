import { useState } from "react";
import { MapPin, Menu, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: "Problem", href: "#problem", isPage: false },
    { label: "Technology", href: "#technology", isPage: false },
    { label: "Heat Map", href: "#map", isPage: false },
    { label: "Choropleth", href: "/choropleth", isPage: true },
    { label: "Scenarios", href: "/scenarios", isPage: true },
    { label: "About", href: "#about", isPage: false },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">UHI Malaysia</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${link.isPage
                    ? 'text-foreground hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {link.label}
                {link.isPage && <ExternalLink className="w-3 h-3 opacity-50" />}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <Button variant="default" size="sm" asChild>
              <a href="/choropleth">Explore Data</a>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors px-2 py-1 flex items-center gap-1.5 ${link.isPage
                      ? 'text-foreground hover:text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                  {link.isPage && <ExternalLink className="w-3 h-3 opacity-50" />}
                </a>
              ))}
              <Button variant="default" size="sm" className="mt-2" asChild>
                <a href="/choropleth">Explore Data</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
