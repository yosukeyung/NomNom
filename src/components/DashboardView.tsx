import React, { useState, useEffect } from "react";
import { Sparkles, BarChart3, History, User, ArrowRight, Zap, FileText, CheckCircle2, Info, PieChart } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function DashboardView() {
  const { user, userName } = useAuth();
  const navigate = useNavigate();

  const trialKey = `nomnom_trial_count_${user?.id || 'guest'}`;
  const trialUsed = parseInt(localStorage.getItem(trialKey) || "0");
  const trialRemaining = Math.max(0, 3 - trialUsed);
  const hasApiKey = !!localStorage.getItem("nomnom_gemini_key");

  const [historyData, setHistoryData] = useState<{ day: string, date: string, count: number, rawDate: Date }[]>([]);
  const [sentimentStats, setSentimentStats] = useState({ positive: 0, negative: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('analysis_history')
        .select('created_at, overall_sentiment, overall_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching history:", error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Group by date
        const grouped: Record<string, number> = {};
        let pos = 0, neg = 0;

        data.forEach(row => {
          const d = new Date(row.created_at);
          // Grouping by YYYY-MM-DD
          const dateStr = d.toLocaleDateString('en-CA'); // e.g. 2026-06-10
          grouped[dateStr] = (grouped[dateStr] || 0) + 1;

          const sent = (row.overall_sentiment || "").toUpperCase();
          if (sent === "POSITIVE") {
            pos++;
          } else if (sent === "NEGATIVE") {
            neg++;
          } else {
            // No fallback for old MIXED data; ignore undefined sentiments.
          }
        });

        // Convert grouped object to array
        const chartData = Object.keys(grouped).map(dateStr => {
          const d = new Date(dateStr);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          const dayNum = d.getDate();
          const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
          const dateLabel = `${dayNum} ${monthStr}`;
          
          return {
            day: dayName,
            date: dateLabel,
            count: grouped[dateStr],
            rawDate: d
          };
        }).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());

        // Limit to last 7 active days if needed, or keep all to let the flexbox handle it
        // We'll take up to the last 7 active days to ensure it doesn't overflow horizontally
        setHistoryData(chartData.slice(-7));
        setSentimentStats({ positive: pos, negative: neg, total: data.length });
      }
      
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const maxCount = historyData.length > 0 ? Math.max(...historyData.map(d => d.count)) : 10;
  
  // Donut chart calculations
  const posPct = sentimentStats.total === 0 ? 0 : Math.round((sentimentStats.positive / sentimentStats.total) * 100);
  const negPct = sentimentStats.total === 0 ? 0 : 100 - posPct;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8 animate-fade-in">

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1.5"
      >
        <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight">
          Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-sm text-brand-brown-muted font-light">
          Here's your Nomnom workspace overview. Start an analysis or review your history below.
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* API & Trial Column */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col gap-1.5 shadow-sm h-full">
            <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Free Trial Remaining</span>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-extrabold text-brand-dark font-mono leading-none">
                {hasApiKey ? "∞" : trialRemaining}
              </span>
              <span className="text-xs text-brand-brown-muted mb-1 font-light">
                {hasApiKey ? "API Key active" : "/ 3 for Hybrid & LLM"}
              </span>
            </div>
            {!hasApiKey && (
              <div className="w-full h-1.5 bg-neutral-100 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${trialRemaining > 1 ? "bg-emerald-500" : trialRemaining === 1 ? "bg-amber-500" : "bg-rose-400"}`}
                  style={{ width: `${(trialRemaining / 3) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col gap-1.5 shadow-sm h-full">
            <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">API Key Status</span>
            <div className="flex items-center gap-2 mt-3">
              <span className={`w-3 h-3 rounded-full shadow-sm ${hasApiKey ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="text-base font-bold text-brand-dark">
                {hasApiKey ? "Connected" : "Using Free Trial"}
              </span>
            </div>
            {!hasApiKey && (
              <button
                onClick={() => navigate("/profile")}
                className="mt-2 text-[11px] text-[#a53b22] font-bold hover:underline text-left flex items-center gap-1"
              >
                Add API Key <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sentiment Overview (Donut Chart) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-4">
             <PieChart className="w-4 h-4 text-brand-primary" />
             <span className="text-[10px] uppercase font-mono font-extrabold text-brand-dark">Sentiment Overview</span>
          </div>
          
          {loading ? (
             <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-brand-brown-muted animate-pulse font-medium">Loading data...</span>
             </div>
          ) : sentimentStats.total === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <span className="text-xs text-brand-brown-muted font-medium">No data sentiment yet.</span>
                <button onClick={() => navigate("/playground")} className="text-[10px] font-bold text-[#a53b22] hover:underline">Start Analysis →</button>
             </div>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-4 mt-2">
              <div 
                className="relative w-28 h-28 rounded-full flex items-center justify-center shrink-0"
                style={{ 
                  background: `conic-gradient(#10b981 0% ${posPct}%, #f43f5e ${posPct}% 100%)`,
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
                }}
              >
                <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center shadow-xs">
                  <span className="text-xl font-black text-brand-dark leading-none">{sentimentStats.total}</span>
                  <span className="text-[8px] uppercase font-bold text-brand-brown-muted tracking-widest mt-1">Total</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 px-2">
                 <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                          <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wide">Positive</span>
                       </div>
                       <span className="text-xs font-black text-emerald-600">{posPct}%</span>
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                          <span className="text-[10px] font-bold text-brand-dark uppercase tracking-wide">Negative</span>
                       </div>
                       <span className="text-xs font-black text-rose-600">{negPct}%</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Overview */}
        <div className="lg:col-span-5 bg-white border border-neutral-200/60 rounded-3xl p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-primary" />
                <span className="text-[10px] uppercase font-mono font-extrabold text-brand-dark">Recent Activity Overview</span>
             </div>
             {historyData.length > 0 && (
                <span className="text-[9px] font-bold bg-neutral-100 text-brand-brown-muted px-2 py-0.5 rounded-full">
                  
                </span>
             )}
          </div>
          
          <div className="flex-1 flex items-end justify-around pb-2 gap-3 h-32 border-b border-neutral-100 relative mt-2">
            {loading ? (
               <div className="w-full h-full flex items-center justify-center">
                 <span className="text-xs text-brand-brown-muted animate-pulse font-medium">Loading chart...</span>
               </div>
            ) : historyData.length === 0 ? (
               <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                 <span className="text-xs text-brand-brown-muted font-medium">No history yet.</span>
               </div>
            ) : (
              historyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-2.5 group max-w-[45px]">
                  <div className="w-full relative flex items-end justify-center h-[90px] bg-neutral-50/50 rounded-t-md hover:bg-neutral-100 transition-colors">
                    <div 
                      className="w-full bg-brand-primary/80 hover:bg-brand-primary transition-all rounded-t-md shadow-sm"
                      style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: '10%' }}
                    />
                    <span className="absolute -top-7 bg-brand-dark text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      {d.count}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-black text-brand-dark uppercase tracking-wider">{d.day}</span>
                    <span className="text-[8px] font-semibold text-brand-brown-muted">{d.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Models Info */}
      <div className="bg-[#fbf9f8] border border-brand-brown-muted/10 rounded-3xl p-6 flex flex-col gap-4 mt-2 shadow-xs">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-brown-muted" />
          <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted tracking-wider">Available Models</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "DistilBERT", tag: "Free Unlimited", color: "bg-emerald-50 text-emerald-800 border-emerald-100", desc: "Local BERT fine-tuned. No API needed. Single text only." },
            { name: "Hybrid", tag: "3x Trial / API Key", color: "bg-amber-50 text-amber-800 border-amber-100", desc: "Gemini extracts aspects, DistilBERT assigns sentiment. Supports CSV batch." },
            { name: "LLM (Gemini)", tag: "3x Trial / API Key", color: "bg-blue-50 text-blue-800 border-blue-100", desc: "Full Gemini 2.5 Flash end-to-end. Supports CSV batch." },
          ].map(m => (
            <div key={m.name} className="bg-white border border-neutral-100 rounded-2xl p-4 flex flex-col gap-2 shadow-xs hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-brand-dark">{m.name}</span>
                <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${m.color}`}>{m.tag}</span>
              </div>
              <span className="text-[11px] text-brand-brown-muted font-medium leading-relaxed">{m.desc}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
