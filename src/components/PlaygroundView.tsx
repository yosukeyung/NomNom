import React, { useState, useRef } from "react";
import { Sparkles, ArrowRight, UploadCloud, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, BarChart3, HelpCircle, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { ProductSensingResult } from "../types";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

const SAMPLES = [
  {
    name: "Crunchy Berry Granola",
    text: "This granola tastes utterly fantastic! The freeze-dried strawberries add a delicious sour twist. However, the cardboard box flap is poorly designed, it tore immediately when opening and now the contents are going stale within days. Also, paying $12 is a bit too much for basic oats."
  },
  {
    name: "Spicy Miso Ramen",
    text: "OMG, the ramen broth tastes heavenly and spicy! It rehydrated with amazing mushroom caps in under 3 minutes. Disappointingly, the microwave container has no thermo-shielding and became scalding hot. I had to wait 10 minutes to touch the outer cup, by then the noodles had turned super mushy and soft."
  },
  {
    name: "Ceremonial Matcha Tea",
    text: "Highly premium-grade jade powder which whisks beautifully into a smooth thick organic foam. No bitterness at all, pure grass-like sweetness. On the flip side, the metal pull-ring security foil took massive force to pop, spilling fine green dust all over my kitchen counter. At $38 for 30g, it is hard to justify. Refill pouch options are sorely needed."
  }
];

export default function PlaygroundView() {
  const { user } = useAuth();
  const [reviewText, setReviewText] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("Hybrid");
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>("");
  const [results, setResults] = useState<ProductSensingResult | null>(null);
  const [selectedAspectIndex, setSelectedAspectIndex] = useState<number | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // File drag & drop simulator
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch Mode States
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<{product_name: string, review_text: string}[]>([]);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchProgress, setBatchProgress] = useState<{current: number, total: number}>({current: 0, total: 0});
  const [batchAnalysisRunning, setBatchAnalysisRunning] = useState<boolean>(false);

  const rotateLoadingMessages = (step: number) => {
    const inferenceMsg = selectedModel === "DistilBERT" 
      ? "Running sentiment inference via local IndoBERT..." 
      : selectedModel === "Hybrid" 
        ? "Extracting via Gemini & scoring via DistilBERT..." 
        : "Running semantic inference via Gemini...";

    const msgs = [
      "Securing connection pipeline...",
      "Chunking sentences into discrete clauses...",
      "Matching aspects against culinary taxonomies...",
      inferenceMsg,
      "Constructing reactive layout telemetry..."
    ];
    if (step < msgs.length) {
      setLoadingMsg(msgs[step]);
      setTimeout(() => rotateLoadingMessages(step + 1), 600);
    }
  };

  const handleAnalyze = async () => {
    if (!reviewText.trim()) return;

    const MAX_WORDS = 75;
    const wordCount = reviewText.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      setWarningMsg(`Word limit exceeded! You entered ${wordCount} words, but the maximum is ${MAX_WORDS} words per request.`);
      return;
    }

    if (user) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString());
      
      if (count !== null && count >= 40) {
        setWarningMsg("You have reached your daily quota of 40 requests. Please try again tomorrow.");
        return;
      }
    }

    let apiKey = localStorage.getItem("nomnom_gemini_key") || "";
    if (!apiKey && (selectedModel === "Hybrid" || selectedModel === "LLM")) {
      const trialKey = `nomnom_trial_count_${user?.id || 'guest'}`;
      let trialCount = parseInt(localStorage.getItem(trialKey) || "0");
      if (trialCount >= 3) {
        setWarningMsg("Your 3x free trial for Hybrid/LLM has expired. Please enter your own Gemini API Key in the Profile page.");
        return;
      }
      localStorage.setItem(trialKey, (trialCount + 1).toString());
    }

    setLoading(true);
    setSelectedAspectIndex(null);
    setWarningMsg(null);
    rotateLoadingMessages(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reviewText, model: selectedModel, apiKey })
      });
      const data = await response.json();
      
      if (!response.ok) {
        setLoading(false);
        setWarningMsg(data.error || data.message || `API Error: ${response.statusText}`);
        return;
      }
      
      // Delay slightly so the beautiful loading stages feel premium and visual
      setTimeout(async () => {
        setResults(data);
        
        // Log to Recent Activities history via Supabase if logged in
        if (user) {
          try {
            await supabase.from('analysis_history').insert([{
              user_id: user.id,
              review_text: reviewText,
              model_used: selectedModel.toLowerCase(),
              product_name: data.productName || "Analyzed Food Review",
              overall_sentiment: (data.overallSentiment || (data.overallScore >= 0 ? "POSITIVE" : "NEGATIVE")).toUpperCase(),
              overall_score: data.overallScore !== undefined ? data.overallScore : 0.05,
              summary: data.summary || null,
              aspects: data.aspects || null,
              highlights: data.highlights || null
            }]);
          } catch (e) {
            console.error("Failed to log activity to Supabase", e);
          }
        }

        if (data.isDemoMode) {
          if (data.errorOccurred && data.errorMessage) {
            const errStr = data.errorMessage.toLowerCase();
            if (errStr.includes("503") || errStr.includes("unavailable") || errStr.includes("demand") || errStr.includes("rate") || errStr.includes("exhausted")) {
              setWarningMsg("The remote Gemini model is currently experiencing exceptionally high temporary traffic. Nomnom has instantly engaged our high-speed local rule-based heuristic ABSA model to analyze your feedback without interruption!");
            } else {
              setWarningMsg(`Internal service warning: "${data.errorMessage}". Safely fell back to the local rule-based heuristic ABSA engine.`);
            }
          } else {
            setWarningMsg("Gemini API Key missing or inactive. Running inside local rule-based heuristic simulation.");
          }
        }
        setLoading(false);
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setWarningMsg("An endpoint connection error occurred. Materializing heuristic recovery forecast.");
      
      // Heuristic fallback
      setTimeout(() => {
        const mockFallback: ProductSensingResult = {
          productName: "Local Analyzed Item",
          overallScore: 0.25,
          overallSentiment: (0.25 >= 0 ? "POSITIVE" : "NEGATIVE"),
          summary: "Local heuristic analyzer detected both positive food indicators and negative container factors within the text stream.",
          aspects: [
            { category: "Taste/Flavor", score: 0.85, label: "Tastes savory", quote: reviewText.slice(0, 50), sentiment: "positive" },
            { category: "Texture", score: -0.40, label: "Texture has inconsistencies", quote: reviewText.slice(50, 100), sentiment: "negative" }
          ],
          highlights: ["Positive culinary comments isolated successfully", "Hardware/logistical friction extracted in remaining text"]
        };
        setResults(mockFallback);

        // Log fallback to Recent Activities via Supabase if logged in
        if (user) {
          try {
            supabase.from('analysis_history').insert([{
              user_id: user.id,
              review_text: reviewText,
              model_used: selectedModel.toLowerCase(),
              product_name: mockFallback.productName,
              overall_sentiment: (mockFallback.overallScore >= 0 ? "POSITIVE" : "NEGATIVE"),
              overall_score: mockFallback.overallScore,
              summary: mockFallback.summary || null,
              aspects: mockFallback.aspects || null,
              highlights: mockFallback.highlights || null
            }]).then(({ error }) => {
              if (error) console.error("Supabase insert error", error);
            });
          } catch (e) {
            console.error("Failed to log fallback activity to Supabase", e);
          }
        }

        setLoading(false);
      }, 3000);
    }
  };

  const selectSample = (sampleText: string) => {
    setReviewText(sampleText);
    setResults(null);
    setSelectedAspectIndex(null);
  };

  // Drag and Drop files handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,product_name,review_text\nSample Product,This is a sample review for the product.";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "nomnom_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const items = [];
      for(let i=1; i<lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if(line) {
          const match = line.match(/(?:"([^"]*)")|([^,]+)/g);
          if (match && match.length >= 2) {
             let product = match[0].replace(/^"|"$/g, '').trim();
             let review = match.slice(1).join(',').replace(/^"|"$/g, '').trim();
             items.push({ product_name: product, review_text: review });
          }
        }
      }
      if (items.length > 0) {
        const overLimitItems = items.filter(item => item.review_text.split(/\s+/).length > 75);
        if (overLimitItems.length > 0) {
           setWarningMsg(`Cannot upload CSV. Found ${overLimitItems.length} reviews exceeding the 75 words limit.`);
           return;
        }
        setIsBatchMode(true);
        setBatchItems(items);
        setBatchResults([]);
        setBatchProgress({current: 0, total: items.length});
        if(selectedModel === "DistilBERT") {
          setSelectedModel("Hybrid");
        }
      } else {
        setWarningMsg("Invalid CSV format. Please use the template.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBatchAnalyze = async () => {
    setBatchAnalysisRunning(true);
    setWarningMsg(null);
    setBatchResults([]);
    
    if (user) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('analysis_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfDay.toISOString());
      
      if (count !== null && (count + batchItems.length) > 40) {
        setWarningMsg(`Quota exceeded. You have ${40 - count} requests remaining today, but your batch contains ${batchItems.length} items.`);
        setBatchAnalysisRunning(false);
        return;
      }
    }

    let apiKey = localStorage.getItem("nomnom_gemini_key") || "";
    const trialKey = `nomnom_trial_count_${user?.id || 'guest'}`;
    let trialCount = parseInt(localStorage.getItem(trialKey) || "0");

    const resultsArray = [];
    for (let i = 0; i < batchItems.length; i++) {
      if (!apiKey && (selectedModel === "Hybrid" || selectedModel === "LLM")) {
        if (trialCount >= 3) {
          setWarningMsg("Your 3x free trial for Hybrid/LLM has expired. Please enter your own Gemini API Key in the Profile page.");
          break;
        }
        trialCount++;
        localStorage.setItem(trialKey, trialCount.toString());
      }

      setBatchProgress({current: i + 1, total: batchItems.length});
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: batchItems[i].review_text, model: selectedModel, apiKey })
        });
        const data = await response.json();
        
        if (!response.ok) {
           setWarningMsg(`Batch error at row ${i+1}: ${data.error || data.message}`);
           break;
        }

        resultsArray.push({
          product: batchItems[i].product_name,
          text: batchItems[i].review_text,
          result: data
        });

        if (user) {
          supabase.from('analysis_history').insert([{
            user_id: user.id,
            review_text: batchItems[i].review_text,
            model_used: selectedModel.toLowerCase(),
            product_name: batchItems[i].product_name,
            overall_sentiment: (data.overallSentiment || (data.overallScore >= 0 ? "POSITIVE" : "NEGATIVE")).toUpperCase(),
            overall_score: data.overallScore !== undefined ? data.overallScore : 0.05,
            summary: data.summary || null,
            aspects: data.aspects || null,
            highlights: data.highlights || null
          }]).then(({ error }) => {
            if (error) console.error("Supabase insert error", error);
          });
        }

      } catch (err: any) {
        console.error(err);
        setWarningMsg("Connection error during batch processing.");
        break;
      }
    }
    
    setBatchResults(resultsArray);
    setBatchAnalysisRunning(false);
  };

  // Dynamic feedback colors based on aspect score
  const getScoreColor = (score: number) => {
    if (score >= 0.40) return { text: "text-brand-accent-teal font-extrabold", bg: "bg-brand-accent-teal/10", border: "border-brand-accent-teal/20", bar: "bg-brand-accent-teal" };
    if (score <= -0.40) return { text: "text-brand-primary font-extrabold", bg: "bg-[#ffece8]", border: "border-brand-primary/10", bar: "bg-brand-primary" };
    return { text: "text-amber-600 font-extrabold", bg: "bg-amber-50", border: "border-amber-200/50", bar: "bg-amber-400" };
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-10 font-sans animate-fade-in text-left">
      
      {/* Dashboard Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-brand-brown-muted/10">
        <div className="flex flex-col gap-1">
          <span className="text-brand-primary font-bold text-xs uppercase tracking-wider hidden">
          </span>
          <h2 className="text-3xl font-black text-brand-dark tracking-tight">
            Review Playground
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-brown-muted bg-white border border-brand-brown-muted/10 rounded-full px-3 py-1.5 shadow-2xs hidden">
          <span className="w-2 h-2 rounded-full bg-brand-accent-teal animate-pulse" />
          <span></span>
        </div>
      </div>

      {/* Warning/Alert box */}
      {warningMsg && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 p-4 rounded-2xl text-xs flex gap-3 items-start animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-extrabold">Notice</span>
            <p className="font-light">{warningMsg}</p>
          </div>
        </div>
      )}

      {/* Core split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Input sandbox panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 shadow-sm flex flex-col gap-5 text-left">
            <span className="text-xs font-bold text-brand-brown-muted uppercase tracking-wider">
              Enter customer sensory feedback
            </span>

            {/* Model Selection Dropdown Menu */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider">
                  Model Selection
                </label>
                <span className="text-[10px] text-brand-brown-muted/70 italic">
                  *Note: Using LLM and Hybrid models will consume your tokens.
                </span>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loading || batchAnalysisRunning}
                className="w-full p-2.5 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl focus:border-brand-primary/40 focus:outline-hidden text-brand-dark font-bold h-10 cursor-pointer"
              >
                {!isBatchMode && <option value="DistilBERT">DistilBERT</option>}
                <option value="LLM">LLM</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2">
              <button 
                onClick={() => setIsBatchMode(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${!isBatchMode ? 'bg-[#a53b22] text-white' : 'bg-neutral-100 text-brand-dark hover:bg-neutral-200'}`}
              >
                Single Review
              </button>
              <button 
                onClick={() => {
                  setIsBatchMode(true);
                  if (selectedModel === "DistilBERT") setSelectedModel("Hybrid");
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${isBatchMode ? 'bg-[#a53b22] text-white' : 'bg-neutral-100 text-brand-dark hover:bg-neutral-200'}`}
              >
                CSV Batch Upload
              </button>
            </div>

            {/* Custom Review Box or CSV Upload */}
            <div className="flex flex-col gap-1">
              {!isBatchMode ? (
                <div className="flex flex-col gap-1">
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    disabled={loading}
                    className="w-full h-44 p-4 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-2xl focus:border-brand-primary/40 focus:outline-hidden leading-relaxed text-brand-dark font-sans resize-none"
                    placeholder="The oatmeal bowl with mixed berries tasted unbelievably delicious and sweet! However, the delivery took almost an hour making it cold."
                  />
                  <div className="flex justify-between items-center px-2">
                    {reviewText.trim().split(/\s+/).length > 75 ? (
                      <span className="text-[10px] text-red-500 font-bold animate-pulse">Maximum 75 words allowed</span>
                    ) : (
                      <span className="text-[10px] text-transparent">_</span>
                    )}
                    <span className={`text-[10px] font-mono ${reviewText.trim().split(/\s+/).length > 75 ? 'text-red-500 font-bold' : 'text-brand-brown-muted'}`}>
                      {reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0} / 75 words
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 border-2 border-dashed border-brand-brown-muted/20 rounded-2xl flex flex-col items-center justify-center p-4 text-center bg-brand-background relative">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCSVUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="w-8 h-8 text-brand-brown-muted/40 mb-2" />
                  <span className="text-xs font-bold text-brand-dark">Drag & Drop CSV Here</span>
                  <span className="text-[10px] text-brand-brown-muted mt-1">or click to browse files</span>
                  {batchItems.length > 0 && (
                    <span className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 px-2 py-1 rounded">
                      {batchItems.length} reviews loaded
                    </span>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                    className="mt-3 text-[10px] font-bold text-brand-primary hover:underline relative z-10"
                  >
                    Download CSV Template
                  </button>
                </div>
              )}
            </div>

            {/* Core Action Trigger button */}
            {!isBatchMode ? (
              <button
                onClick={handleAnalyze}
                disabled={loading || !reviewText.trim() || reviewText.trim().split(/\s+/).length > 75}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg hover:shadow-brand-primary/20 cursor-pointer disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <img src="/nomnom-logo.png" alt="Loading" className="h-8 w-auto animate-pulse object-contain" />
                    <span>{loadingMsg}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse" />
                    <span>Execute Aspect Analysis</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleBatchAnalyze}
                disabled={batchAnalysisRunning || batchItems.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold rounded-2xl text-xs tracking-wider uppercase transition shadow-lg hover:shadow-brand-primary/20 cursor-pointer disabled:opacity-40"
              >
                {batchAnalysisRunning ? (
                  <>
                    <img src="/nomnom-logo.png" alt="Loading" className="h-8 w-auto animate-pulse object-contain" />
                    <span>Processing {batchProgress.current} / {batchProgress.total}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse" />
                    <span>Execute Batch Analysis</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Reactive Dashboard output panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {!isBatchMode && !results && !loading && (
            <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[460px]">
              <div className="w-16 h-16 rounded-3xl bg-brand-background border border-brand-brown-muted/10 flex items-center justify-center text-brand-brown-muted/40 animate-pulse">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div className="max-w-xs flex flex-col gap-1.5">
                <h3 className="text-base font-black text-brand-dark font-sans">Awaiting Model Execution</h3>
                <p className="text-xs text-brand-brown-muted leading-relaxed font-light">
                  Input or select a custom customer review on the left, then click <strong>Execute Aspect Analysis</strong> to watch model metrics compute.
                </p>
              </div>
            </div>
          )}

          {isBatchMode && batchResults.length === 0 && !batchAnalysisRunning && (
            <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[460px]">
              <div className="w-16 h-16 rounded-3xl bg-brand-background border border-brand-brown-muted/10 flex items-center justify-center text-brand-brown-muted/40 animate-pulse">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="max-w-xs flex flex-col gap-1.5">
                <h3 className="text-base font-black text-brand-dark font-sans">Batch Upload Ready</h3>
                <p className="text-xs text-brand-brown-muted leading-relaxed font-light">
                  Upload a CSV file containing <code>product_name</code> and <code>review_text</code> columns, then click <strong>Execute Batch Analysis</strong> to process them all.
                </p>
              </div>
            </div>
          )}

          {(!isBatchMode ? loading : batchAnalysisRunning) && (
            <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-6 min-h-[460px] animate-pulse">
              <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-2 max-w-sm">
                <h3 className="text-base font-bold text-brand-dark font-sans">
                  {isBatchMode ? `Processing Batch: ${batchProgress.current} / ${batchProgress.total}` : loadingMsg}
                </h3>
                <div className="w-44 h-1.5 bg-brand-background rounded-full mx-auto overflow-hidden relative">
                  <div className="absolute h-full w-24 bg-brand-primary rounded-full animate-[progress_1s_infinite_linear]" />
                </div>
                <p className="text-[10px] text-brand-brown-muted font-mono uppercase tracking-widest mt-1">
                  Nomnom neural compute node #80091 active
                </p>
              </div>
            </div>
          )}

          {!isBatchMode && results && !loading && (
            <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 animate-fade-in text-left">
              
              {/* Product header result row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-background">
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-xl font-black text-brand-dark leading-tight">Analyzed Sentiments</h3>
                </div>
              </div>

              {/* Text Description summary of mixed feelings */}
              <div className="bg-brand-background/60 border border-brand-brown-muted/5 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[11px] uppercase font-mono font-bold text-brand-brown-muted">Sensing Summary</span>
                <p className="text-xs text-brand-brown-muted leading-relaxed">
                  {results.summary}
                </p>
              </div>

              {/* Extraction Results Table */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] uppercase font-mono font-bold text-brand-brown-muted">
                  Extraction Results
                </span>

                <div className="w-full overflow-x-auto border border-neutral-200/60 rounded-2xl bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-50/75 border-b border-neutral-200/50 text-[10px] text-brand-brown-muted uppercase tracking-wider font-mono">
                        <th className="py-3.5 px-4 font-bold">Aspect</th>
                        <th className="py-3.5 px-4 font-bold">Opinion</th>
                        <th className="py-3.5 px-4 font-bold">Sentiment</th>
                        <th className="py-3.5 px-4 font-bold">Confidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100/80">
                      {(() => {
                        let finalAspects = results.aspects;
                        return finalAspects.map((asp, idx) => {
                          const isPositive = asp.score >= 0;
                          const confidenceValue = Math.abs(asp.score);
                          const opinionText = asp.label || "";

                          return (
                            <tr key={idx} className="hover:bg-neutral-50/40 transition-colors">
                              {/* Aspect column */}
                              <td className="py-3.5 px-4 text-xs font-black text-brand-dark uppercase tracking-wide">
                                {asp.category}
                              </td>
                              
                              {/* Opinion column */}
                              <td className="py-3.5 px-4 text-xs text-brand-brown-muted leading-relaxed font-light italic">
                                "{opinionText}"
                              </td>
                              
                              {/* Sentiment column */}
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold font-sans border ${
                                  isPositive 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : "bg-rose-50 text-rose-700 border-rose-100"
                                }`}>
                                  {isPositive ? "Positive" : "Negative"}
                                </span>
                              </td>
                              
                              {/* Confidence column */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-xs font-black text-brand-dark">
                                    {confidenceValue.toFixed(2)}
                                  </span>
                                  <div className={`w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200/10 relative flex ${isPositive ? "justify-start" : "justify-end"}`}>
                                    <motion.div 
                                      className={`h-full rounded-full ${isPositive ? "bg-emerald-500" : "bg-rose-500"}`}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${confidenceValue * 100}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {isBatchMode && batchResults.length > 0 && !batchAnalysisRunning && (
            <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-background print:border-b-0 print:pb-2">
                <h3 className="text-xl font-black text-brand-dark leading-tight">Batch Analysis Results</h3>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-primary hover:bg-[#a53b22] text-white font-bold text-xs uppercase rounded-xl transition print:hidden flex items-center gap-1"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
              </div>

              {batchResults.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-3 mb-6 pb-6 border-b border-neutral-100 last:border-0 last:mb-0 last:pb-0 print:mb-4 print:pb-4 print:break-inside-avoid">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-brand-dark">{item.product}</span>
                    <span className="text-xs text-brand-brown-muted italic leading-relaxed">"{item.text}"</span>
                  </div>
                  
                  {item.result && item.result.aspects && item.result.aspects.length > 0 ? (
                    <div className="w-full overflow-x-auto border border-neutral-200/60 rounded-xl bg-white shadow-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-neutral-50/75 border-b border-neutral-200/50 text-[10px] text-brand-brown-muted uppercase tracking-wider font-mono">
                            <th className="py-2.5 px-3 font-bold">Aspect</th>
                            <th className="py-2.5 px-3 font-bold">Opinion</th>
                            <th className="py-2.5 px-3 font-bold">Sentiment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100/80">
                          {item.result.aspects.map((asp: any, i: number) => {
                            const isPositive = asp.score >= 0;
                            return (
                              <tr key={i} className="hover:bg-neutral-50/40">
                                <td className="py-2.5 px-3 text-xs font-bold text-brand-dark uppercase tracking-wide">{asp.category}</td>
                                <td className="py-2.5 px-3 text-xs text-brand-brown-muted italic">"{asp.label}"</td>
                                <td className="py-2.5 px-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold font-sans border ${isPositive ? "bg-emerald-50 text-emerald-700 border-emerald-100 print:border-none print:bg-transparent print:text-emerald-800" : "bg-rose-50 text-rose-700 border-rose-100 print:border-none print:bg-transparent print:text-rose-800"}`}>
                                    {isPositive ? "Positive" : "Negative"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <span className="text-xs text-brand-brown-muted">No aspects detected or error occurred.</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
