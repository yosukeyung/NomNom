import React, { useState, useEffect } from "react";
import { Search, Trash2, RotateCcw, Calendar, ShoppingBag, MessageSquare, ArrowUpDown, Filter, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

interface ActivityItem {
  id: string;
  date: string;
  product: string;
  snippet: string;
  sentiment: "POSITIVE" | "NEGATIVE";
  score: number;
  aspects?: any[];
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: "act-1",
    date: "2026-06-04 10:45 AM",
    product: "Mavorly Overnight Oats",
    snippet: "The overnight oats from Mavorly tasted absolutely incredible, but the cardboard packaging was impossible to open.",
    sentiment: "POSITIVE",
    score: 0.05,
    aspects: [
      { category: "Taste & Flavor", label: "absolutely incredible", score: 0.95, sentiment: "positive", quote: "The overnight oats from Mavorly tasted absolutely incredible" },
      { category: "Packaging", label: "impossible to open", score: -0.90, sentiment: "negative", quote: "but the cardboard packaging was impossible to open" }
    ]
  },
  {
    id: "act-2",
    date: "2026-06-04 09:12 AM",
    product: "Gluten-Free Crisp Crust Pizza",
    snippet: "Insanely crisp base and holds up perfectly under our premium organic toppings. Everyone loved it!",
    sentiment: "POSITIVE",
    score: 0.95,
    aspects: [
      { category: "Crust / Base", label: "insanely crisp", score: 0.95, sentiment: "positive", quote: "Insanely crisp base" },
      { category: "Toppings", label: "premium organic", score: 0.90, sentiment: "positive", quote: "holds up perfectly under our premium organic toppings" }
    ]
  },
  {
    id: "act-3",
    date: "2026-06-03 02:35 PM",
    product: "Truffle Infused Chili Oil",
    snippet: "Way too heavy on artificial truffle aromatics. Fully dominates the clean, spicy chili heat.",
    sentiment: "NEGATIVE",
    score: -0.85,
    aspects: [
      { category: "Aroma", label: "way too heavy", score: -0.85, sentiment: "negative", quote: "Way too heavy on artificial truffle aromatics" },
      { category: "Chili Heat", label: "clean spicy", score: 0.75, sentiment: "positive", quote: "Fully dominates the clean, spicy chili heat" }
    ]
  },
  {
    id: "act-4",
    date: "2026-06-03 11:20 AM",
    product: "Artisanal Sourdough Starter",
    snippet: "Unbelievably active yeast cultures. Produced a beautiful, tall sourdough sourdough loft with exquisite sour flavor.",
    sentiment: "POSITIVE",
    score: 0.90,
    aspects: [
      { category: "Yeast Cultures", label: "unbelievably active", score: 0.95, sentiment: "positive", quote: "Unbelievably active yeast cultures" },
      { category: "Flavor", label: "exquisite sour", score: 0.90, sentiment: "positive", quote: "Produced a beautiful, tall sourdough sourdough loft with exquisite sour flavor" }
    ]
  },
  {
    id: "act-5",
    date: "2026-06-02 04:55 PM",
    product: "Nitro Cold Brew Coffee",
    snippet: "Incredible rich chocolatey taste notes, but the metal container was low on nitro pressure and failed on cascade.",
    sentiment: "NEGATIVE",
    score: -0.10,
    aspects: [
      { category: "Taste Notes", label: "incredible rich chocolatey", score: 0.90, sentiment: "positive", quote: "Incredible rich chocolatey taste notes" },
      { category: "Container", label: "low on nitro pressure", score: -0.80, sentiment: "negative", quote: "but the metal container was low on nitro pressure and failed on cascade" }
    ]
  }
];

export default function RecentActivitiesView() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("ALL");
  const [sortAscending, setSortAscending] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        const formatted = data.map((d: any) => {
          const dateObj = new Date(d.created_at);
          const formatNum = (num: number) => num.toString().padStart(2, "0");
          const dateStr = `${dateObj.getFullYear()}-${formatNum(dateObj.getMonth() + 1)}-${formatNum(dateObj.getDate())} ${formatNum(dateObj.getHours())}:${formatNum(dateObj.getMinutes())} ${dateObj.getHours() >= 12 ? "PM" : "AM"}`;
          return {
            id: d.id,
            date: dateStr,
            product: d.product_name,
            snippet: d.review_text,
            sentiment: d.overall_sentiment,
            score: d.overall_score,
            aspects: d.aspects
          };
        });
        setActivities(formatted);
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.error("Failed to fetch activities", e);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user]);

  // Supabase Realtime subscription for live refresh
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('analysis_history_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analysis_history', filter: `user_id=eq.${user.id}` },
        () => { fetchActivities(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDeleteItem = async (id: string) => {
    // If it's a mock id (act-), just remove locally
    if (id.startsWith("act-") || !user) {
      setActivities(activities.filter(item => item.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (!error) {
        setActivities(activities.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error("Failed to delete activity", e);
    }
  };

  const handleClearAllHistory = async () => {
    if (!user) {
      setActivities([]);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('user_id', user.id);
      
      if (!error) {
        setActivities([]);
      }
    } catch (e) {
      console.error("Failed to clear history", e);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort
  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.snippet.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSentiment = selectedSentiment === "ALL" || act.sentiment === selectedSentiment;

    return matchesSearch && matchesSentiment;
  }).sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return sortAscending ? timeA - timeB : timeB - timeA;
  });

  return (
    <div id="recent-activities-page" className="w-full max-w-7xl mx-auto px-6 py-12 flex flex-col gap-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-brown-muted/15">
        <div className="flex flex-col gap-1.5 text-left">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight">
            Recent Activities
          </h1>
          <p className="text-sm text-brand-brown-muted font-light max-w-xl">
            Live archive of recent evaluations parsed through the Nomnom Aspect-Based Sentiment Analysis pipeline.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAllHistory}
            disabled={activities.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-brand-brown-muted/15 hover:bg-neutral-100 bg-white text-brand-dark text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Clear all evaluation logs"
          >
            <Trash2 className="w-4 h-4 text-brand-brown-muted" />
            <span>Clear All History</span>
          </button>
        </div>
      </div>

      {/* Database Stats Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 text-left shadow-2xs">
          <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Total Evaluated</span>
          <div className="text-2xl font-extrabold text-brand-dark mt-1 font-mono">{activities.length}</div>
        </div>
        <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 text-left shadow-2xs">
          <span className="text-[10px] uppercase font-mono font-bold text-emerald-700">Positive Signals</span>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1 font-mono">
            {activities.filter(a => a.sentiment === "POSITIVE").length}
          </div>
        </div>
        <div className="bg-white border border-neutral-200/60 rounded-2xl p-4 text-left shadow-2xs">
          <span className="text-[10px] uppercase font-mono font-bold text-rose-700">Negative Inconsistencies</span>
          <div className="text-2xl font-extrabold text-rose-800 mt-1 font-mono">
            {activities.filter(a => a.sentiment === "NEGATIVE").length}
          </div>
        </div>
      </div>

      {/* Search and Filters Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-neutral-200/60 p-4 rounded-2xl shadow-2xs">
        
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-brand-brown-muted/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search evaluation text or products..."
            className="w-full pl-10 pr-4 py-2 border border-brand-brown-muted/15 rounded-xl bg-brand-background text-xs text-brand-dark font-medium placeholder-brand-brown-muted/50 focus:border-brand-primary/40 focus:outline-hidden"
          />
        </div>

        {/* Filter Badges & Sort Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-brand-brown-muted/60" />
            <span className="text-[10px] uppercase font-mono text-brand-brown-muted font-bold mr-1">Sentiment:</span>
            {["ALL", "POSITIVE", "NEGATIVE"].map((sent) => (
              <button
                key={sent}
                onClick={() => setSelectedSentiment(sent)}
                className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition cursor-pointer border ${
                  selectedSentiment === sent
                    ? "bg-[#a53b22] text-white border-brand-primary"
                    : "bg-neutral-50 hover:bg-neutral-100 text-brand-brown-muted border-neutral-200/60"
                }`}
              >
                {sent}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-neutral-200 hidden sm:block" />

          {/* Sort order chronological toggle */}
          <button
            onClick={() => setSortAscending(!sortAscending)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-brown-muted/15 hover:bg-neutral-50 bg-white text-xs font-bold rounded-xl transition cursor-pointer text-brand-brown-muted"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAscending ? "Oldest First" : "Newest First"}</span>
          </button>
        </div>
      </div>

      {/* Main activities Interactive Table */}
      <div className="border border-neutral-200/60 rounded-3xl bg-white overflow-hidden shadow-2xs relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10 gap-4">
            <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
            <span className="text-xs font-bold text-brand-dark animate-pulse">Syncing with Databank...</span>
          </div>
        ) : null}
        
        {filteredActivities.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/75 border-b border-neutral-200/50 text-[10px] text-brand-brown-muted uppercase tracking-wider font-mono">
                  <th className="py-4 px-6 font-bold" style={{ width: "160px" }}>Date</th>
                  <th className="py-4 px-6 font-bold" style={{ width: "240px" }}>Target Product</th>
                  <th className="py-4 px-6 font-bold">Feedback Snippet</th>
                  <th className="py-4 px-6 font-bold" style={{ width: "130px" }}>Status</th>
                  <th className="py-4 px-6 font-bold text-center" style={{ width: "80px" }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100/80">
                {filteredActivities.map((act) => {
                  return (
                    <tr 
                      key={act.id} 
                      onClick={() => setSelectedActivity(act)}
                      className="hover:bg-neutral-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Date details */}
                      <td className="py-4 px-6 text-xs text-brand-brown-muted font-light whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-brand-brown-muted/50" />
                          <span>{act.date}</span>
                        </div>
                      </td>

                      {/* Product display */}
                      <td className="py-4 px-6 text-xs font-extrabold text-brand-dark">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5 text-brand-primary/60 shrink-0" />
                          <span>{act.product}</span>
                        </div>
                      </td>

                      {/* Quote/Snippet snippet */}
                      <td className="py-4 px-6 text-xs text-brand-brown-muted leading-relaxed font-light italic max-w-md truncate md:whitespace-normal">
                        <div className="flex gap-2 items-start">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-brown-muted/40 mt-1.5 shrink-0" />
                          <span className="line-clamp-2">"{act.snippet}"</span>
                        </div>
                      </td>

                      {/* Status Sentiment Badge and pill */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${
                          act.sentiment === "POSITIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}>
                          {act.sentiment === "POSITIVE" ? "POSITIVE" : "NEGATIVE"}
                        </span>
                      </td>

                      {/* Explicit interactive operations */}
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteItem(act.id)}
                          className="p-2 text-neutral-400 hover:text-[#a53b22] hover:bg-red-50/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete activity record from history"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-brand-dark">No activities matched</h3>
              <p className="text-xs text-brand-brown-muted">Try adjusting your filters.</p>
            </div>
            <button
              onClick={() => { setSearchTerm(""); setSelectedSentiment("ALL"); }}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary-light transition cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Decorative prompt */}
      <div className="bg-[#ffece8]/45 border border-brand-primary/10 rounded-2xl p-4 text-left flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-brand-dark">Pro Operational Tip</span>
          <span className="text-[11px] text-brand-brown-muted leading-relaxed font-light">
            Every analysis triggered inside the <strong>Nomnom Sandbox Playground</strong> automatically records its results in the browser's persistent session storage and loads instantly in this live history view! Try evaluating other products to populate additional rows.
          </span>
        </div>
      </div>

      {/* Interactive Detail Modal Block */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setSelectedActivity(null)}>
          <div 
            className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl animate-fade-in text-left flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-brand-background">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary" />
                <h3 className="text-sm font-black text-brand-dark uppercase tracking-tight font-mono">
                  Detailed Sentiment Report
                </h3>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-xs text-brand-brown-muted hover:text-brand-dark font-mono font-bold uppercase transition cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-brand-brown-muted font-bold uppercase tracking-wider font-mono">
                Product Name
              </span>
              <div className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-brand-primary/80" />
                <span>{selectedActivity.product}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-brand-brown-muted font-bold uppercase tracking-wider font-mono font-semibold">Evaluation Date</span>
                <span className="text-xs text-brand-dark font-mono font-medium">{selectedActivity.date}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-brand-brown-muted font-bold uppercase tracking-wider font-mono font-semibold">Overall Score</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${
                    selectedActivity.score >= 0
                      ? "bg-emerald-50 text-emerald-700" 
                      : "bg-rose-50 text-rose-700"
                  }`}>
                    {selectedActivity.score > 0 ? "+" : ""}{selectedActivity.score.toFixed(2)}
                  </span>
                  <span className="text-xs text-brand-dark font-semibold">({selectedActivity.score >= 0 ? "POSITIVE" : "NEGATIVE"})</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-neutral-50 p-4 border border-neutral-100 rounded-2xl">
              <span className="text-[10px] text-brand-brown-muted font-bold uppercase tracking-wider font-mono">
                Original Input / Feedback Text
              </span>
              <p className="text-xs text-brand-dark leading-relaxed font-serif italic text-neutral-800">
                "{selectedActivity.snippet}"
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-brand-brown-muted font-bold uppercase tracking-wider font-mono">
                Extracted Aspect-Level Sentiments
              </span>
              <div className="flex flex-col gap-2.5">
                {selectedActivity.aspects && selectedActivity.aspects.length > 0 ? (
                  selectedActivity.aspects.map((asp: any, idx: number) => {
                    const isPositive = asp.score >= 0 || asp.sentiment === 'positive';
                    const scoreFormatted = (asp.score >= 0 ? "+" : "") + (typeof asp.score === 'number' ? asp.score.toFixed(2) : "0.00");
                    const label = asp.label || asp.opini || "neutral";
                    const category = asp.category || asp.aspek || "General";
                    const quote = asp.quote || "";

                    return (
                      <div 
                        key={idx} 
                        className={`flex items-start justify-between gap-2 text-xs p-3 rounded-xl border ${
                          isPositive 
                            ? "bg-emerald-50/50 border-emerald-100/30 text-emerald-800" 
                            : "bg-rose-50/50 border-rose-100/30 text-rose-800"
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 text-left min-w-0 flex-1">
                          <span className="font-extrabold uppercase tracking-wide truncate">{category}</span>
                          <span className="text-[10px] text-brand-brown-muted font-mono font-light line-clamp-2">
                            Phrase: "{label}"{quote ? ` — "${quote.length > 60 ? quote.slice(0, 60) + '...' : quote}"` : ""}
                          </span>
                        </div>
                        <span className="text-xs font-black font-mono shrink-0 ml-2">{scoreFormatted}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-brand-brown-muted italic p-4 text-center bg-neutral-50 rounded-xl border border-neutral-100">
                    No aspect-level sentiment data available for this activity.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-brand-background text-[10px] text-brand-brown-muted font-light leading-relaxed">
              <strong className="font-semibold text-brand-dark block mb-0.5">Nomnom ABSA Extraction Engine</strong>
              Sub-sentence aspects are isolated using our multi-stage extraction pipeline to avoid positive accolades canceling out negative logistics.
            </div>
            
            <button 
              onClick={() => setSelectedActivity(null)}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
            >
              Dismiss Report
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
