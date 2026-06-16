import React from "react";
import { Cpu, Sparkles, Layers } from "lucide-react";

interface ModelsViewProps {
  onSelectedEngineChange?: (engineId: string) => void;
  selectedEngineId?: string;
}

export default function ModelsView({ onSelectedEngineChange, selectedEngineId }: ModelsViewProps) {
  const models = [
    {
      title: "DistilBERT Base",
      description: "Best for processing massive volumes of straightforward, short reviews quickly and cost-effectively. Ideal for simple positive or negative feedback.",
      icon: Cpu,
      iconColor: "text-neutral-500 bg-neutral-100",
    },
    {
      title: "LLM Integration",
      description: "Best for deep, complex feedback where customers express complex emotions, sarcasm, or highly specific product nuances. (Consumes tokens)",
      icon: Sparkles,
      iconColor: "text-[#a53b22] bg-[#ffece8]/50",
    },
    {
      title: "Hybrid Arbitration",
      description: "The smart default. Automatically routes simple text to DistilBERT and complex text to the LLM, giving you the perfect balance of speed and token efficiency. (Consumes tokens)",
      icon: Layers,
      iconColor: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col gap-12 font-sans animate-fade-in text-left">
      
      {/* Title block */}
      <div className="w-full text-center mb-12"> 
        <span className="text-xs uppercase tracking-widest font-mono font-black text-[#a53b22]">
          BUILT FOR SCALE AND PRECISION
        </span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight mt-2">
          Intelligence Architecture
        </h2>
      </div>
      {/* Grid of model offerings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {models.map((model, idx) => {
          const IconComponent = model.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-neutral-200/60 shadow-xs flex flex-col gap-6 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${model.iconColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-brand-dark">{model.title}</h3>
              </div>
              <p className="text-xs text-brand-brown-muted leading-relaxed font-light">
                {model.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
