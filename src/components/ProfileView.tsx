import React, { useState, useEffect } from "react";
import { User, Mail, Sparkles, Save, Shield, Check, Key, Activity } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

interface ProfileViewProps {
  onBackToHome: () => void;
}

export default function ProfileView({ 
  onBackToHome
}: ProfileViewProps) {
  const { userName, userEmail } = useAuth();
  
  // Configured user details
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState(userEmail || "");
  const [notificationFrequency, setNotificationFrequency] = useState("daily");
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("nomnom_gemini_key") || "");
  const [apiSaved, setApiSaved] = useState(false);

  // Secure email popup states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailModalError, setEmailModalError] = useState("");
  const [emailModalSuccess, setEmailModalSuccess] = useState("");

  const [dailyUsage, setDailyUsage] = useState(0);

  // Sync state if props change from global state
  useEffect(() => {
    setName(userName || "");
  }, [userName]);

  useEffect(() => {
    setEmail(userEmail || "");
  }, [userEmail]);

  useEffect(() => {
    async function fetchUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from('analysis_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfDay.toISOString());
        setDailyUsage(count || 0);
      }
    }
    fetchUsage();
  }, []);

  const quotaLimit = 40;
  const slotsTotal = 4;
  const usagePerSlot = quotaLimit / slotsTotal;
  const remainingQuota = Math.max(0, quotaLimit - dailyUsage);
  const activeSlots = Math.ceil(remainingQuota / usagePerSlot);

  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const hoursRemaining = Math.max(1, Math.floor((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.updateUser({
      data: { name: name }
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleSaveApiKey = () => {
    localStorage.setItem("nomnom_gemini_key", apiKey.trim());
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2000);
  };

  const handleEmailUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setEmailModalError("Please enter a valid email address.");
      return;
    }
    if (!currentPassword) {
      setEmailModalError("Please provide your current password to authorize.");
      return;
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: currentPassword,
    });

    if (signInError) {
      setEmailModalError("Incorrect password.");
      return;
    }

    // Update email
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail.trim()
    });

    if (updateError) {
      setEmailModalError(updateError.message);
      return;
    }
    
    setEmailModalSuccess("Email update link sent to new address! Please verify to complete.");
    setEmailModalError("");
    setNewEmail("");
    setCurrentPassword("");

    setTimeout(() => {
      setShowEmailModal(false);
      setEmailModalSuccess("");
    }, 3000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-6 flex flex-col gap-6 font-sans animate-fade-in text-left">
      
      {/* Page Header */}
      <div className="flex flex-col pb-2 border-b border-brand-brown-muted/10">
        <h2 className="text-2xl font-black text-brand-dark tracking-tight">
          User Account Profile
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Side: Form Controls & Notices */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <form onSubmit={handleSave} className="bg-white border border-brand-brown-muted/10 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-brand-dark flex items-center gap-2">
            <User className="w-4 h-4 text-brand-primary" />
            Personal Identification
          </h3>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-brand-brown-muted uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full py-2 pl-9 pr-3 text-sm bg-brand-background border border-brand-brown-muted/15 rounded-xl focus:border-brand-primary/40 focus:outline-hidden text-brand-dark font-medium"
              />
              <User className="absolute left-3 top-2.5 w-4 h-4 text-brand-brown-muted/55" />
            </div>
          </div>

          {/* Email (Read-Only with Change Email Link) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-brand-brown-muted uppercase tracking-wider">
                Email
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowEmailModal(true);
                  setNewEmail("");
                  setCurrentPassword("");
                  setEmailModalError("");
                  setEmailModalSuccess("");
                }}
                className="text-[10px] text-[#a53b22] hover:text-brand-primary font-extrabold focus:outline-hidden transition"
              >
                Change Email
              </button>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                readOnly
                className="w-full py-2 pl-9 pr-3 text-sm bg-neutral-100 cursor-not-allowed border border-brand-brown-muted/10 rounded-xl focus:outline-hidden text-brand-brown-muted font-medium"
              />
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-brand-brown-muted/40" />
            </div>
          </div>

          {/* Notification Frequency */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-brand-brown-muted uppercase tracking-wider">
              Sentiment Alert Frequency
            </span>
            <div className="flex gap-4 mt-1">
              {["daily", "weekly", "never"].map((freq) => (
                <label key={freq} className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-brand-dark uppercase tracking-wide">
                  <input
                    type="radio"
                    name="notification"
                    value={freq}
                    checked={notificationFrequency === freq}
                    onChange={(e) => setNotificationFrequency(e.target.value)}
                    className="accent-brand-primary w-3.5 h-3.5"
                  />
                  <span>{freq}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex pt-3 mt-1 border-t border-brand-background">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary hover:bg-brand-primary-light text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-md hover:shadow-brand-primary/25 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="w-full border border-emerald-100 rounded-xl p-3 flex items-start gap-2.5 bg-emerald-50/50 shadow-xs">
          <span className="text-base leading-none mt-0.5">🛡️</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Private Local Sandbox</span>
            <span className="text-[10px] text-emerald-700 leading-relaxed">
              Your credentials and API usage remain inside your private local browser container. No data is shared with third-party advertisers.
            </span>
          </div>
        </div>
      </div>

        {/* Right Side: API Quota & Config */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* API Quota Card */}
          <div className="bg-white border border-brand-brown-muted/10 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-brand-brown-muted/10">
              <span className="text-[10px] font-extrabold text-brand-dark uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Activity className="w-3.5 h-3.5 text-[#a53b22]" />
                API Quota
              </span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold tracking-wider">
                Active Tier
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span className="text-xs font-extrabold text-brand-dark">Gemini 2.5 Flash</span>
                <span className="text-[9px] font-mono text-brand-brown-muted">Refreshes in {hoursRemaining} hours</span>
              </div>
              
              <div className="flex gap-1 h-2 mt-0.5">
                {[...Array(slotsTotal)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-colors ${i < activeSlots ? 'bg-emerald-500' : 'bg-neutral-200'}`}
                  />
                ))}
              </div>

              <div className="flex justify-between items-start mt-1">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeSlots > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-[9px] font-bold tracking-wide ${activeSlots > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {activeSlots > 2 ? 'Abundant Capacity' : activeSlots > 0 ? 'Low Capacity' : 'Exhausted'}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-brand-brown-muted">{activeSlots} slots active</span>
              </div>
            </div>
            <p className="text-[9px] text-brand-brown-muted leading-relaxed mt-1">
              Quota utilizes an automated segmented credit policy. Keys default to green levels, preventing throttling.
            </p>
          </div>

          {/* API Key Configuration */}
          <div className="bg-white border border-brand-brown-muted/10 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-brand-brown-muted/10">
              <span className="text-[10px] font-extrabold text-brand-dark uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Key className="w-3.5 h-3.5 text-brand-primary" />
                Gemini API Key
              </span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-bold">
                Integration
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-brand-brown-muted uppercase tracking-wider">
                Your API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full py-2 pl-9 pr-3 text-sm bg-brand-background border border-brand-brown-muted/15 rounded-xl focus:border-brand-primary/40 focus:outline-hidden text-brand-dark font-medium"
                />
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-brand-brown-muted/55" />
              </div>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="w-full py-2 mt-1 bg-neutral-100 hover:bg-neutral-200 text-brand-dark font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                {apiSaved ? "Saved!" : "Save API Key"}
              </button>
            </div>

            <div className="pt-2 border-t border-brand-background">
              <p className="text-[11px] text-brand-brown-muted leading-relaxed font-semibold mb-2">
                How to get a free API Key:
              </p>
              <ol className="list-decimal pl-4 text-[11px] text-brand-brown-muted leading-relaxed flex flex-col gap-1">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-primary underline hover:text-[#a53b22]">Google AI Studio</a>.</li>
                <li>Sign in with your Google Account.</li>
                <li>Click <strong>"Create API key"</strong> in the top left.</li>
                <li>Copy the generated key and paste it here.</li>
              </ol>
              <p className="text-[10px] text-brand-brown-muted leading-relaxed mt-3">
                Note: Hybrid & LLM models require an API Key after your 3x trial.
              </p>
            </div>
          </div>

        </div>
      </div>



      {/* Secure Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-fade-in text-left flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-background">
              <Mail className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-black text-brand-dark uppercase tracking-tight">
                Change Secure Email
              </h3>
            </div>

            {emailModalError && (
              <div className="text-xs bg-red-50 text-brand-primary border border-red-200/20 p-2.5 rounded-xl font-medium">
                {emailModalError}
              </div>
            )}

            {emailModalSuccess && (
              <div className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200/20 p-2.5 rounded-xl font-medium">
                {emailModalSuccess}
              </div>
            )}

            <form onSubmit={handleEmailUpdateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">New Email Address</span>
                <input 
                  type="email" 
                  required 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="new-email@example.com" 
                  className="w-full p-2 text-sm bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Current Password</span>
                <input 
                  type="password" 
                  required 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full p-2 text-sm bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-2 shadow-md"
              >
                Confirm Change
              </button>
            </form>

            <button 
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-brand-dark font-bold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
