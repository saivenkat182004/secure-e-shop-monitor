import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cpu, Headphones, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-8 animate-slide-up">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">New arrivals are here</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-foreground">Power Your Life</span>
            <br />
            <span className="gradient-text">With Premium Tech</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Discover the latest electronics from top brands. Premium quality, unbeatable prices, 
            and lightning-fast delivery to your doorstep.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/products">
              <Button size="lg" className="glow-primary text-lg px-8">
                Shop Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Feature Icons */}
          <div className="flex flex-wrap justify-center gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Smartphone, label: 'Smartphones', count: '50+' },
              { icon: Cpu, label: 'Laptops', count: '30+' },
              { icon: Headphones, label: 'Audio', count: '100+' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 px-6 py-3 glass rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-display font-bold text-foreground">{item.count}</p>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
