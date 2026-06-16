import React, { useState } from "react";
import { Database, Cpu, Sparkles, LayoutGrid, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const INPUT_TEXT = "The oatmeal bowl with berries tasted unbelievably delicious and sweet! However, the delivery took almost an hour making it cold.";

export default function PipelineView() {
  const [selectedBranch, setSelectedBranch] = useState<"DistilBERT" | "LLM" | "Hybrid">("Hybrid");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      id: "input",
      name: "Data Ingestion",
      icon: Database,
      desc: "Receives raw customer feedback via Single Text Input or Batch CSV Upload.",
      outputTitle: "Raw Payload"
    },
    {
      id: "model",
      name: "Model Inference Branch",
      icon: GitBranch,
      desc: "Execution branches based on user model selection. Each model employs a different strategy for ABSA.",
      outputTitle: "Processing Architecture"
    },
    {
      id: "extraction",
      name: "Aspect Extraction",
      icon: Sparkles,
      desc: "Isolates the specific aspects and opinions from the text.",
      outputTitle: "Extracted Features"
    },
    {
      id: "sentiment",
      name: "Sentiment Assignment",
      icon: Cpu,
      desc: "Assigns a positive or negative sentiment valence to each extracted aspect.",
      outputTitle: "Valence Scores"
    },
    {
      id: "output",
      name: "Aggregated Output",
      icon: LayoutGrid,
      desc: "Compiles results into an interactive dashboard or a downloadable PDF report for batch processing.",
      outputTitle: "Final Report"
    }
  ];

  const getSimulatedOutput = (stepId: string) => {
    switch (stepId) {
      case "input":
        return (
          <div className="font-mono text-[11px] text-brand-brown-muted p-3 bg-[#f7f5f2] rounded-xl border border-neutral-200/55 leading-relaxed">
            {`"text": "${INPUT_TEXT}"`}
          </div>
        );
      case "model":
        return (
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 flex-wrap">
              {["DistilBERT", "LLM", "Hybrid"].map(m => (
                <button
                  key={m}
                  onClick={(e) => { e.stopPropagation(); setSelectedBranch(m as any); }}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${selectedBranch === m ? 'bg-[#a53b22] text-white border-[#a53b22]' : 'bg-white text-brand-brown-muted border-neutral-200 hover:bg-neutral-50'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
              {selectedBranch === "DistilBERT" && <span className="text-[11px] text-brand-dark">Local fine-tune BERT model. No API Key needed, Free. Single text only.</span>}
              {selectedBranch === "LLM" && <span className="text-[11px] text-brand-dark">Gemini 2.5 Flash receives a zero-shot prompt to extract aspects and assign sentiments simultaneously. Supports CSV batch.</span>}
              {selectedBranch === "Hybrid" && <span className="text-[11px] text-brand-dark">1. Gemini 2.5 Flash extracts Aspect & Opinion.<br/>2. DistilBERT processes the extracted pairs to determine Sentiment. Supports CSV batch.</span>}
            </div>
          </div>
        );
      case "extraction":
        return (
          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg">
              Aspect: <strong>oatmeal bowl</strong> | Opinion: <strong>unbelievably delicious and sweet</strong>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-800 border border-rose-100 rounded-lg">
              Aspect: <strong>delivery</strong> | Opinion: <strong>took almost an hour making it cold</strong>
            </div>
          </div>
        );
      case "sentiment":
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-dark">oatmeal bowl</span>
              <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 border border-emerald-100 rounded-full text-[10px]">POSITIVE</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-brand-dark">delivery</span>
              <span className="text-rose-600 font-extrabold bg-rose-50 px-2 py-0.5 border border-rose-100 rounded-full text-[10px]">NEGATIVE</span>
            </div>
          </div>
        );
      case "output":
        return (
          <div className="bg-[#a53b22]/5 border border-[#a53b22]/10 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-brand-dark uppercase tracking-wide">Analysis Complete</span>
              <span className="px-2 py-0.5 text-[9px] bg-[#a53b22] text-white font-bold rounded">Sentiment</span>
            </div>
            <p className="text-[11px] text-brand-brown-muted leading-relaxed font-light">
              Results rendered on Dashboard or formatted into Exportable PDF table.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 flex flex-col gap-16 font-sans animate-fade-in text-left">

      <div className="text-center max-w-2xl mx-auto flex flex-col gap-3">
        <span className="font-bold text-xs uppercase tracking-widest text-[#a53b22]">
          Extraction Pipeline
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-brand-dark tracking-tight leading-tight">
          System Architecture
        </h2>
        <p className="text-base text-brand-brown-muted leading-relaxed font-light">
          Hover over each phase to reveal how your review is processed — from input to output.
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full flex flex-col gap-3 relative">
        {/* Left decorative flow line */}
        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-neutral-100 -z-10 hidden md:block" />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isHovered = hoveredStep === idx;

          return (
            <div
              key={step.id}
              onMouseEnter={() => setHoveredStep(idx)}
              onMouseLeave={() => setHoveredStep(null)}
              className={`border-2 rounded-2xl bg-white flex flex-col md:flex-row gap-4 items-start relative transition-all duration-300 ease-out overflow-hidden ${
                isHovered ? "border-[#a53b22]/50 shadow-lg scale-[1.02]" : "border-neutral-200/55"
              }`}
              style={{ padding: isHovered ? "1.25rem 1.5rem" : "0.875rem 1.5rem" }}
            >
              {/* Icon + Label */}
              <div className="flex gap-4 items-center shrink-0 w-full md:w-[240px]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  isHovered ? "bg-[#a53b22] text-white" : "bg-neutral-100 text-neutral-400"
                }`}>
                  <StepIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                    Phase 0{idx + 1}
                  </span>
                  <span className="text-sm font-black text-brand-dark">
                    {step.name}
                  </span>
                </div>
              </div>

              {/* Expandable detail — visible only on hover, smooth animation */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-1 flex flex-col gap-3 text-left w-full md:border-l border-neutral-100 md:pl-5"
                  >
                    <div className="pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 mt-3 md:mt-0">
                      <p className="text-xs text-brand-brown-muted leading-relaxed font-light mb-3">
                        {step.desc}
                      </p>
                      <div className="border-t border-neutral-100 pt-3">
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase font-mono font-bold text-[#a53b22]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a53b22]" />
                          <span>{step.outputTitle}</span>
                        </div>
                        {getSimulatedOutput(step.id)}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
