import React from "react";
import { Sparkles, MessageCircle, AlertTriangle, Check, X } from "lucide-react";

export default function WhyView() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col gap-16 font-sans animate-fade-in text-left">
      
      {/* Title block */}
      <div className="max-w-3xl flex flex-col gap-3">
        <span className="text-brand-primary font-bold text-[#a53b22] text-xs uppercase tracking-widest">
          Foundational Methodology
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-dark tracking-tight leading-tight">
          Why Average Ratings Are Failing Your Business
        </h2>
        <p className="text-base text-brand-brown-muted leading-relaxed font-light">
          Traditional sentiment tools compress a sentence's rich emotion into a single flat aggregate score. When customers express complex feelings—like a delicious meal served in a broken container—the result is neutralized to an unproductive average.
        </p>
      </div>

      {/* Modern 2-Card Layout Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
        
        {/* Left Card: Standard Analysis */}
        <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-8 shadow-xs flex flex-col justify-between gap-8 transition-all hover:shadow-md">
          <div className="flex flex-col gap-6">
            {/* Card Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                <X className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-dark">Standard Sentiment Engine</h4>
                <p className="text-[10px] text-brand-brown-muted uppercase tracking-wider font-mono">Legacy Aggregate Models</p>
              </div>
            </div>

            {/* Review Content */}
            <div className="bg-neutral-50/50 rounded-2xl p-5 border border-neutral-200/20">
              <span className="text-[10px] uppercase font-bold text-neural-400 tracking-wider font-mono block mb-2 text-neutral-400">
                Review Sample
              </span>
              <p className="text-sm text-brand-brown-muted font-medium italic leading-relaxed">
                "The overnight oats from Mavorly tasted absolutely incredible, but the cardboard packaging was impossible to open."
              </p>
            </div>

            {/* Output Progress Bar */}
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex justify-between items-center text-xs font-bold text-neutral-500">
                <span className="uppercase tracking-wider">Flat Sentiment Rating:</span>
                <span className="font-mono bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-md text-[11px]">
                  Neutral (3/5)
                </span>
              </div>
              <div className="h-6 w-full bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200/55 relative">
                <div className="h-full bg-neutral-400 w-3/5 transition-all duration-500" />
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-300/40" />
              </div>
            </div>
          </div>

          {/* Actionability Footer */}
          <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
            <div className="p-1 rounded-full bg-rose-50 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <p className="text-xs text-brand-brown-muted leading-relaxed">
              <strong className="text-brand-dark font-bold">The Wash-Out Effect:</strong> Positive taste (+0.95) and negative design critiques (-0.90) aggregate to average, blinding recipe development teams to real packaging flaws.
            </p>
          </div>
        </div>

        {/* Right Card: Nomnom ABSA Diverging Chart */}
        <div className="bg-white border-2 border-brand-primary/20 rounded-3xl p-8 shadow-sm flex flex-col justify-between gap-8 relative overflow-hidden transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 py-1 px-4 bg-[#a53b22] text-[9px] uppercase tracking-widest font-black text-white rounded-bl-2xl font-mono">
            ABSA Intel
          </div>

          <div className="flex flex-col gap-6">
            {/* Card Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-brand-primary/10">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-[#a53b22]">
                <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-brand-dark">Nomnom Sensory Intel</h4>
                <p className="text-[10px] text-[#a53b22] uppercase tracking-wider font-mono">Aspect-Based Sentiment Intelligence</p>
              </div>
            </div>

            {/* Review Content */}
            <div className="bg-emerald-50/20 rounded-2xl p-5 border border-brand-primary/5">
              <span className="text-[10px] uppercase font-bold text-brand-primary tracking-wider font-mono block mb-2">
                Clause Segment Match
              </span>
              <p className="text-sm text-brand-dark font-medium italic leading-relaxed">
                "The overnight oats... <span className="bg-emerald-100/60 px-1 text-emerald-800 rounded font-bold">tasted absolutely incredible</span>, but the cardboard <span className="bg-rose-100/60 px-1 text-rose-800 rounded font-bold">packaging was impossible to open</span>."
              </p>
            </div>

            {/* Aspect Diverging Bar Chart */}
            <div className="flex flex-col gap-5 mt-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-500 pb-1">
                <span className="uppercase tracking-wider">Aspect Sentiments Range:</span>
                <span className="font-mono text-[10px] text-neutral-400">NEGATIVE • 0 • POSITIVE</span>
              </div>

              {/* Taste Aspect (Positive) */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-dark font-extrabold uppercase tracking-wider text-[11px]">Taste / Flavor</span>
                  <span className="text-emerald-600 font-extrabold font-mono text-[11px] bg-emerald-50 px-2 py-0.5 rounded">
                    +0.95 (Exceptional)
                  </span>
                </div>
                
                {/* Visual Diverging Bar Track */}
                <div className="relative h-6 bg-neutral-150/40 bg-[#f7f5f2] rounded-lg overflow-hidden border border-neutral-300/15">
                  {/* Center Zero Anchor */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-400/80 z-10" />
                  {/* Positive bar starting from 50% left extending to the right */}
                  <div 
                    className="absolute top-0 bottom-0 left-1/2 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-r-sm shadow-inner"
                    style={{ width: "47.5%" }} 
                  />
                </div>
              </div>

              {/* Packaging Aspect (Negative) */}
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-dark font-extrabold uppercase tracking-wider text-[11px]">Packaging (Ergonomics)</span>
                  <span className="text-rose-600 font-extrabold font-mono text-[11px] bg-rose-50 px-2 py-0.5 rounded">
                    -0.90 (Defect)
                  </span>
                </div>
                
                {/* Visual Diverging Bar Track */}
                <div className="relative h-6 bg-[#f7f5f2] rounded-lg overflow-hidden border border-neutral-300/15">
                  {/* Center Zero Anchor */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-neutral-400/80 z-10" />
                  {/* Negative bar starting from left side extending rightward TO the center line */}
                  <div 
                    className="absolute top-0 bottom-0 bg-gradient-to-l from-rose-400 to-rose-500 rounded-l-sm shadow-inner"
                    style={{ 
                      left: "5%",
                      width: "45%" 
                    }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actionability Footer */}
          <div className="pt-4 border-t border-brand-primary/10 flex items-center gap-3">
            <div className="p-1 rounded-full bg-emerald-50 text-emerald-600">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs text-brand-dark leading-relaxed font-medium">
              <strong className="text-emerald-700 font-bold">Unmixed Clarity:</strong> Isolating aspects lets grocery operations flag the packaging defect automatically while recognizing that the food recipe remains perfect.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
