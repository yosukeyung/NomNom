import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

interface HomeViewProps {
  onNavigateToPlayground: () => void;
}

export default function HomeView({ onNavigateToPlayground }: HomeViewProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative w-full overflow-hidden flex flex-col">
      {/* Hero Section with Beautiful Oatmeal & Berry Salad Backdrop styling */}
      <div className="relative w-full min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center p-6 md:p-12 lg:p-24 overflow-hidden">
        {/* Background Image with subtle parallax for a premium feel, offset by scroll Y */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1600&q=80"
            alt="Delicious oatmeal bowl background"
            className="absolute inset-0 w-full h-[115%] object-cover opacity-90"
            referrerPolicy="no-referrer"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.12, 120)}px)`,
            }}
          />
        </div>
        {/* Soft, natural cream gradient overlay with a subtle backdrop blur for crisp readability, blending into solid background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F6]/30 via-[#FAF9F6]/80 to-[#FAF9F6] backdrop-blur-[3px]" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left max-w-2xl">

            {/* Subheading */}
            <span className="text-sm md:text-base font-semibold tracking-wider uppercase text-brand-brown-muted/80">
              Stop Guessing What Went Wrong
            </span>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.1] font-sans">
              Know Exactly What{" "}
              <span className="text-brand-primary bg-gradient-to-r from-brand-primary to-brand-primary-light bg-clip-text text-transparent">
                Customers Really Think.
              </span>
            </h1>

            {/* Body Description */}
            <p className="text-base md:text-lg text-brand-brown-muted leading-relaxed font-sans font-light">
               Best for deep, complex feedback where customers express intricate emotions, sarcasm, or highly specific product nuances. (Consumes tokens). 
              <strong className="font-semibold text-brand-dark"> Nomnom.ai</strong> automatically extracts and categorizes sentiment in real-time.
            </p>

            {/* Primary Action Button */}
            <button 
              id="start-analysis-btn"
              onClick={onNavigateToPlayground}
              className="flex items-center gap-2 px-8 py-4 bg-brand-primary hover:bg-brand-primary-light text-white font-semibold rounded-full shadow-lg hover:shadow-brand-primary/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Start Analysis</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Right Interface Floating Card Column */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div 
              id="live-stream-hero-card"
              className="w-full max-w-sm rounded-2xl bg-white/85 backdrop-blur-md border border-white/50 p-6 shadow-xl relative transition-all duration-500 hover:shadow-2xl"
            >
              {/* Header inside the Floating Card */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-brown-muted/10 mb-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-secondary animate-pulse" />
                  <span className="text-sm font-semibold text-brand-dark">
                    Live Stream Analysis
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-widest font-mono text-brand-accent-teal font-extrabold px-2 py-0.5 bg-brand-accent-teal/10 rounded">
                  Processed
                </span>
              </div>

              {/* Sample Review Highlight Container */}
              <div className="bg-brand-background/60 border border-brand-brown-muted/5 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex gap-2">
                  <span className="text-brand-primary text-lg">“</span>
                  <p className="text-sm text-brand-brown-muted font-medium italic leading-relaxed">
                    Texture is perfectly crunchy.
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent-teal" />
                    <span className="text-xs uppercase tracking-wider font-bold text-brand-brown-muted">
                      Texture
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] bg-[#a53b22] text-white font-bold rounded">Sentiment</span>
                </div>
              </div>

              {/* Additional Trivial Visual Micro logs to look premium and authentic */}
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px] text-brand-brown-muted/60 font-mono">
                  <span>Aspect Count: 1 extracted</span>
                  <span>Latency: 42ms</span>
                </div>
                <div className="w-full h-1 bg-brand-background rounded-full overflow-hidden">
                  <div className="h-full w-[95%] bg-brand-accent-teal rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
