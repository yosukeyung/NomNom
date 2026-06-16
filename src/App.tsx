import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Smile, User, Sparkles, Heart, Key, ArrowRight, History, LayoutDashboard } from "lucide-react";

import HomeView from "./components/HomeView";
import WhyView from "./components/WhyView";
import PipelineView from "./components/PipelineView";
import ModelsView from "./components/ModelsView";
import PlaygroundView from "./components/PlaygroundView";
import ProfileView from "./components/ProfileView";
import DashboardView from "./components/DashboardView";
import RecentActivitiesView from "./components/RecentActivitiesView";
import ForgotPasswordView from "./components/ForgotPasswordView";
import ResetPasswordPage from "./components/ResetPasswordPage";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";

type TabId = "home" | "playground" | "profile" | "activities";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname === "/" ? "home" : location.pathname.substring(1);
  const [previousTab, setPreviousTab] = useState<string>("home");
  const [selectedEngineId, setSelectedEngineId] = useState<string>("nomnom-pro");
  
  // Custom states for modals & dropdown
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<TabId | null>(null);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; type: "login" | "register" | "forgot" }>({ isOpen: false, type: "login" });
  const [authNotification, setAuthNotification] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { isLoggedIn, userName, userEmail, signOut, loading } = useAuth();

  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRePassword, setAuthRePassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active section in view on the Home view
  const [currentSectionId, setCurrentSectionId] = useState<string>("hero");
  const isScrollingRef = useRef(false);

  // Check for password reset hash
  React.useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setIsResettingPassword(true);
    }
  }, []);

  // IntersectionObserver to auto-update active nav section on scroll
  useEffect(() => {
    if (activeTab !== "home") return;
    const sections = ["hero", "why-section", "pipeline-section", "models-section"];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      
      const obs = new IntersectionObserver(
        ([entry]) => {
          // JIKA SEDANG SCROLL MANUAL VIA KLIK NAVBAR, JANGAN TIMPA STATUS SECTIONS
          if (isScrollingRef.current) return;

          if (entry.isIntersecting) {
            setCurrentSectionId(id);
          }
        },
        { 
          // Menggunakan rentang yang lebih aman untuk mendeteksi elemen di layar
          rootMargin: "-20% 0px -50% 0px" 
        }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [activeTab]);

  const handleNavigateToTab = (tabId: string) => {
    if (tabId === "activities" && !isLoggedIn) {
      setPendingTabAfterAuth(tabId as any);
      setAuthModal({ isOpen: true, type: "login" });
      setAuthEmail("");
      setAuthPassword("");
      setAuthRePassword("");
      setAuthError(null);
      return;
    }
    setPreviousTab(activeTab);
    navigate(tabId === "home" ? "/" : `/${tabId}`);
  };

  // Smooth scroll handler targeting sections on the Home landing screen
  const handleScrollToSection = (sectionId: string) => {
    handleNavigateToTab("home");
    setCurrentSectionId(sectionId);
    
    // 1. Kunci observer agar tidak mendeteksi section lain di tengah jalan
    isScrollingRef.current = true; 
    
    setTimeout(() => {
      if (sectionId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      
      // 2. Buka kembali kunci setelah animasi smooth scroll selesai
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    }, 100);
  };

  const handleNavigateToPlayground = () => {
    if (!isLoggedIn) {
      setPendingTabAfterAuth("playground");
      setAuthModal({ isOpen: true, type: "login" });
      setAuthEmail("");
      setAuthPassword("");
      setAuthRePassword("");
      setAuthError(null);
      return;
    }
    handleNavigateToTab("playground");
  };

  const handleSelectedEngineChange = (engineId: string) => {
    setSelectedEngineId(engineId);
    // Move to playground automatically after selecting a model weight
    handleNavigateToPlayground();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (authModal.type === "register") {
      if (authPassword !== authRePassword) {
        setAuthError("Passwords do not match.");
        setAuthLoading(false);
        return;
      }
      if (!authName) {
        setAuthError("Name is required.");
        setAuthLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: { name: authName }
        }
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }
      
      setAuthNotification(`Successfully registered! Please check your email to verify your account if required.`);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
        return;
      }
      
      setAuthNotification(`Successfully logged in!`);
    }

    setAuthLoading(false);
    setAuthModal({ isOpen: false, type: "login" });
    
    setTimeout(() => {
      setAuthNotification(null);
    }, 4000);

    // Redirect to pending tab after successful authentication
    if (pendingTabAfterAuth) {
      setPreviousTab(activeTab);
      navigate(`/${pendingTabAfterAuth}`);
      setPendingTabAfterAuth(null);
    } else {
      setPreviousTab(activeTab);
      navigate("/dashboard");
    }
  };

  if (isResettingPassword) {
    return <ResetPasswordPage onSuccess={() => {
      setIsResettingPassword(false);
      setAuthNotification("Password updated successfully. Please log in.");
      setAuthModal({ isOpen: true, type: "login" });
      setTimeout(() => setAuthNotification(null), 4000);
    }} />;
  }

  if (loading) return <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans select-none antialiased">
      
      {/* Floating Authentication Alert Notification */}
      {authNotification && (
        <div className="fixed bottom-6 right-6 bg-[#006a65] text-white border border-[#004d49] p-4 rounded-2xl text-xs flex gap-3 items-center shadow-2xl z-50 animate-fade-in">
          <Sparkles className="w-5 h-5 text-brand-secondary shrink-0" />
          <span className="font-semibold">{authNotification}</span>
        </div>
      )}

      {activeTab === "home" ? (
        /* ==================== LAYOUT 1: LANDING PAGE LAYOUT ==================== */
        <div className="flex flex-col min-h-screen">
          {/* Glassmorphic Header Nav bar */}
          <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-brand-brown-muted/10">
            <div className="w-full max-w-[1440px] mx-auto px-8 md:px-12 h-16 flex items-center justify-between relative">
              
              {/* Logo Brand block */}
              <button 
                onClick={() => handleScrollToSection("hero")}
                className="flex items-center gap-2 cursor-pointer group focus:outline-hidden"
              >
                <img src="/nomnom-logo.png" alt="Nomnom Logo" className="h-9 w-auto object-contain group-hover:scale-110 transition-transform" />
                <span className="text-xl font-bold tracking-tight text-[#a53b22]">
                  Nomnom
                </span>
              </button>

              {/* Navigation Links centered inside the screen */}
              <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-full items-center gap-8 justify-center">
                {/* HOME */}
                <button
                  onClick={() => handleScrollToSection("hero")}
                  className={`relative h-full px-1 text-sm font-semibold transition-all duration-300 cursor-pointer focus:outline-hidden hover:text-[#a53b22] ${
                    currentSectionId === "hero" ? "text-[#a53b22]" : "text-brand-brown-muted/80"
                  }`}
                >
                  <span>Home</span>
                  <div 
                    className={`absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-[#a53b22] rounded-full transition-all duration-300 origin-center ${
                      currentSectionId === "hero" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    }`} 
                    style={{ transform: "translateY(1px)" }} 
                  />
                </button>

                {/* WHY */}
                <button
                  onClick={() => handleScrollToSection("why-section")}
                  className={`relative h-full px-1 text-sm font-semibold transition-all duration-300 cursor-pointer focus:outline-hidden hover:text-[#a53b22] ${
                    currentSectionId === "why-section" ? "text-[#a53b22]" : "text-brand-brown-muted/80"
                  }`}
                >
                  <span>Why</span>
                  <div 
                    className={`absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-[#a53b22] rounded-full transition-all duration-300 origin-center ${
                      currentSectionId === "why-section" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    }`} 
                    style={{ transform: "translateY(1px)" }} 
                  />
                </button>

                {/* PIPELINE */}
                <button
                  onClick={() => handleScrollToSection("pipeline-section")}
                  className={`relative h-full px-1 text-sm font-semibold transition-all duration-300 cursor-pointer focus:outline-hidden hover:text-[#a53b22] ${
                    currentSectionId === "pipeline-section" ? "text-[#a53b22]" : "text-brand-brown-muted/80"
                  }`}
                >
                  <span>Pipeline</span>
                  <div 
                    className={`absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-[#a53b22] rounded-full transition-all duration-300 origin-center ${
                      currentSectionId === "pipeline-section" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    }`} 
                    style={{ transform: "translateY(1px)" }} 
                  />
                </button>

                {/* MODELS */}
                <button
                  onClick={() => handleScrollToSection("models-section")}
                  className={`relative h-full px-1 text-sm font-semibold transition-all duration-300 cursor-pointer focus:outline-hidden hover:text-[#a53b22] ${
                    currentSectionId === "models-section" ? "text-[#a53b22]" : "text-brand-brown-muted/80"
                  }`}
                >
                  <span>Models</span>
                  <div 
                    className={`absolute bottom-[-1.5px] left-0 right-0 h-[2px] bg-[#a53b22] rounded-full transition-all duration-300 origin-center ${
                      currentSectionId === "models-section" ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                    }`} 
                    style={{ transform: "translateY(1px)" }} 
                  />
                </button>
              </nav>

              {/* Far Right Action profile elements with Click trigger */}
              <div className="flex items-center gap-4 relative">


                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 focus:outline-hidden ${
                      isLoggedIn 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : "border-brand-brown-muted/15 bg-neutral-150 text-neutral-400 hover:bg-neutral-200"
                    }`}
                    title="Account menu"
                  >
                    {isLoggedIn ? (
                      <span className="text-xs font-black font-mono">
                        {(userName || userEmail || "U")[0].toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>

                  {showProfileDropdown && (
                    isLoggedIn ? (
                      <div className="absolute right-0 top-12 w-72 bg-white border border-brand-brown-muted/15 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3.5 text-left animate-fade-in">
                        <div className="pb-2.5 border-b border-brand-background">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#006a65] font-black">
                            Account
                          </span>
                          <div className="font-extrabold text-xs text-brand-dark mt-0.5">{userName}</div>
                          <div className="text-[10px] text-brand-brown-muted truncate">{userEmail}</div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              handleNavigateToTab("profile");
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-left py-2 px-3 bg-brand-background text-brand-dark hover:bg-brand-peach-tag/20 transition rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Edit Profile
                          </button>

                          <button
                            onClick={async () => {
                              await signOut();
                              handleNavigateToTab("home");
                              setShowProfileDropdown(false);
                              setAuthNotification("Logged out successfully.");
                              setTimeout(() => setAuthNotification(null), 3000);
                            }}
                            className="w-full text-left py-2 px-3 bg-red-50 text-[#a53b22] hover:bg-red-100 transition rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Log Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute right-0 top-12 w-64 bg-white border border-brand-brown-muted/15 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3 text-left animate-fade-in flex-col">
                        <div className="pb-2 border-b border-brand-background">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[#a53b22]/70 font-black">
                            Gateway
                          </span>
                          <div className="font-extrabold text-xs text-brand-dark mt-0.5">Not Signed In</div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              setAuthModal({ isOpen: true, type: "login" });
                              setAuthEmail("");
                              setAuthPassword("");
                              setAuthRePassword("");
                              setAuthError(null);
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-center py-2 px-3 bg-[#a53b22]/5 text-[#a53b22] hover:bg-[#a53b22]/10 transition rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Login
                          </button>

                          <button
                            onClick={() => {
                              setAuthModal({ isOpen: true, type: "register" });
                              setAuthEmail("");
                              setAuthPassword("");
                              setAuthRePassword("");
                              setAuthError(null);
                              setShowProfileDropdown(false);
                            }}
                            className="w-full text-center py-2 px-3 bg-[#a53b22] text-white hover:bg-brand-primary-light transition rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Register
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full flex flex-col">
            <div id="hero" className="w-full">
              <HomeView onNavigateToPlayground={() => handleNavigateToTab("playground")} />
            </div>

            <div id="why-section" className="bg-[#fbf9f8] border-t border-brand-brown-muted/5 scroll-mt-12">
              <WhyView />
            </div>

            <div id="pipeline-section" className="bg-white border-t border-brand-brown-muted/5 scroll-mt-12">
              <PipelineView />
            </div>

            <div id="models-section" className="bg-[#fbf9f8] border-t border-brand-brown-muted/5 scroll-mt-12">
              <ModelsView 
                selectedEngineId={selectedEngineId} 
                onSelectedEngineChange={handleSelectedEngineChange} 
              />
            </div>

            {/* Sandbox sign up / go-to-dashboard CTA pane */}
            <div className="w-full bg-white py-20 px-6 border-t border-brand-brown-muted/10">
              <div className="max-w-4xl mx-auto text-center bg-[#fbf9f8] border border-brand-brown-muted/10 rounded-3xl p-8 md:p-12 shadow-xs flex flex-col items-center gap-6">
                <span className="text-xs uppercase tracking-widest font-mono font-black text-brand-primary">
                  {isLoggedIn ? `Welcome, ${userName?.split(" ")[0] || "there"}` : "Portal"}
                </span>
                <h3 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight leading-none">
                  {isLoggedIn ? "Your workspace is ready." : "Ready to decode your next meal?"}
                </h3>
                <p className="text-sm text-brand-brown-muted max-w-xl font-light leading-relaxed">
                  {isLoggedIn
                    ? "Head to your dashboard to start analyzing food reviews or check your history."
                    : "Join hundreds of food scientists, product developers, and sensory analysts who use Nomnom.ai to isolate and capture contrasting sub-sentence reviews."
                  }
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                  {isLoggedIn ? (
                    <button
                      onClick={() => handleNavigateToTab("dashboard")}
                      className="px-8 py-3 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md flex items-center gap-2"
                    >
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => setAuthModal({ isOpen: true, type: "login" })}
                        className="px-6 py-3 border border-brand-brown-muted/15 hover:bg-[#ffece8]/20 bg-white text-brand-dark text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Login
                      </button>
                      <button 
                        onClick={() => setAuthModal({ isOpen: true, type: "register" })}
                        className="px-8 py-3 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-md"
                      >
                        Register Now
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="w-full bg-white border-t border-brand-brown-muted/10 py-10 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-brand-brown-muted">
              <div className="flex flex-col items-center md:items-start gap-1">
                <span className="font-bold text-brand-dark">© {new Date().getFullYear()} Nomnom.ai</span>
              </div>
              <div className="flex items-center gap-6 font-medium">
                <span className="text-xs text-brand-brown-muted/80 cursor-default">Privacy Policy</span>
                <span className="text-xs text-brand-brown-muted/80 cursor-default">Terms of Use</span>
                <span className="text-xs text-brand-brown-muted/80 cursor-default">Contact Us</span>
                <span className="text-xs text-brand-brown-muted/80 cursor-default">About</span>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* ==================== LAYOUT 2: DASHBOARD SIDEBAR LAYOUT ==================== */
        <div className="flex flex-col md:flex-row min-h-screen bg-[#fbf9f8] w-full">
          
          {/* Mobile navigation strip */}
          <div className="flex md:hidden bg-white border-b border-brand-brown-muted/10 px-4 py-3 items-center justify-between sticky top-0 z-40 w-full shrink-0">
            <button 
              onClick={() => handleNavigateToTab("home")}
              className="flex items-center gap-1.5 text-xs"
            >
              <img src="/nomnom-logo.png" alt="Nomnom Logo" className="h-8 w-auto object-contain" />
              <span className="font-black text-[#a53b22]">Nomnom</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleNavigateToTab("dashboard")}
                className={`text-[11px] font-bold ${activeTab === "dashboard" ? "text-[#a53b22]" : "text-brand-brown-muted"}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => handleNavigateToTab("playground")}
                className={`text-[11px] font-bold ${activeTab === "playground" ? "text-[#a53b22]" : "text-brand-brown-muted"}`}
              >
                Playground
              </button>
              {isLoggedIn && (
                <button 
                  onClick={() => handleNavigateToTab("activities")}
                  className={`text-[11px] font-bold ${activeTab === "activities" ? "text-[#a53b22]" : "text-brand-brown-muted"}`}
                >
                  Activities
                </button>
              )}
              {isLoggedIn ? (
                <button 
                  onClick={() => handleNavigateToTab("profile")}
                  className={`text-[11px] font-bold ${activeTab === "profile" ? "text-[#a53b22]" : "text-brand-brown-muted"}`}
                >
                  Profile
                </button>
              ) : (
                <button 
                  onClick={() => setAuthModal({ isOpen: true, type: "login" })}
                  className="text-[11px] text-brand-primary font-bold"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Left Vertical Workspace Sidebar */}
          <aside className="w-64 bg-white border-r border-brand-brown-muted/10 h-screen sticky top-0 overflow-y-auto flex flex-col justify-between py-6 px-4 shrink-0 hidden md:flex">
            <div className="flex flex-col gap-6">
              {/* Brand Logo & title */}
              <div className="pb-6 border-b border-brand-brown-muted/10">
                <button 
                  onClick={() => handleNavigateToTab("home")}
                  className="flex items-center gap-2.5 cursor-pointer group focus:outline-hidden text-left"
                >
                  <img src="/nomnom-logo.png" alt="Nomnom Logo" className="h-11 w-auto object-contain group-hover:scale-110 transition-transform shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight text-[#a53b22] leading-none mt-1.5">Nomnom</span>
                  </div>
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleNavigateToTab("dashboard")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-[#a53b22]/5 text-[#a53b22]"
                      : "text-brand-brown-muted hover:bg-neutral-50 hover:text-brand-dark"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => handleNavigateToTab("playground")}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "playground"
                      ? "bg-[#a53b22]/5 text-[#a53b22]"
                      : "text-brand-brown-muted hover:bg-neutral-50 hover:text-brand-dark"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Review Playground</span>
                </button>

                {isLoggedIn && (
                  <button
                    onClick={() => handleNavigateToTab("activities")}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "activities"
                        ? "bg-[#a53b22]/5 text-[#a53b22]"
                        : "text-brand-brown-muted hover:bg-neutral-50 hover:text-brand-dark"
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>Recent Activities</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sidebar Account status footer */}
            <div className="border-t border-brand-background pt-4 flex flex-col gap-3">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <div 
                    onClick={() => handleNavigateToTab("profile")}
                    className="flex items-center gap-2.5 p-2 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl cursor-pointer transition border border-neutral-200/40"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                      {userName ? userName[0].toUpperCase() : "U"}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden min-w-0">
                      <span className="text-xs font-bold text-brand-dark truncate">{userName}</span>
                      <span className="text-[10px] text-brand-brown-muted truncate">{userEmail}</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await signOut();
                      handleNavigateToTab("home");
                      setAuthNotification("Logged out successfully.");
                      setTimeout(() => setAuthNotification(null), 3000);
                    }}
                    className="w-full text-center py-2 text-[10px] uppercase font-bold tracking-wider text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-brand-brown-muted/60 ml-2 mb-1">
                    Anonymous Guest
                  </span>
                    <button
                      onClick={() => setAuthModal({ isOpen: true, type: "login" })}
                      className="w-full text-center py-2 bg-[#a53b22] hover:bg-brand-primary-light text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Access Portal
                    </button>
                </div>
              )}
              <div className="text-[9px] text-brand-brown-muted/70 text-center font-mono mt-1">
                Nomnom
              </div>
            </div>
          </aside>

          {/* Right Main Content Panel */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* View Switch */}
            <div className="flex-1 pt-12 md:pt-16 pb-12">
              <Routes>
                <Route path="/dashboard" element={<DashboardView />} />
                <Route path="/playground" element={<PlaygroundView />} />
                <Route path="/activities" element={<RecentActivitiesView />} />
                <Route path="/profile" element={
                  <ProfileView onBackToHome={() => handleNavigateToTab("home")} />
                } />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Overlay */}
      {authModal.isOpen && authModal.type !== "forgot" && (
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-fade-in text-left flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-2 border-b border-brand-background">
              <Key className="w-5 h-5 text-brand-primary" />
              <h3 className="text-base font-black text-brand-dark uppercase tracking-tight">
                {authModal.type === "login" ? "Sign In to Nomnom" : "Register Credentials"}
              </h3>
            </div>
            
            {authError && (
              <div className="text-xs bg-red-50 text-brand-primary border border-red-200/20 p-2.5 rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {authModal.type === "register" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Full Name</span>
                  <input 
                    type="text" 
                    required 
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Jane Doe" 
                    className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Email Address</span>
                <input 
                  type="email" 
                  required 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="hello@mavorly.com" 
                  className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Password</span>
                <input 
                  type="password" 
                  required 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••" 
                  className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                />
              </div>

              {authModal.type === "register" && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-[#a53b22]">Re-enter Password</span>
                  <input 
                    type="password" 
                    required 
                    value={authRePassword}
                    onChange={(e) => setAuthRePassword(e.target.value)}
                    placeholder="••••••••••••" 
                    className="w-full p-3 text-xs bg-brand-background border border-[#a53b22]/20 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
                  />
                </div>
              )}

              {authModal.type === "login" && (
                <button 
                  type="button"
                  onClick={() => setAuthModal({ isOpen: true, type: "forgot" })}
                  className="text-[10px] text-right font-bold text-brand-brown-muted hover:text-brand-primary transition"
                >
                  Forgot Password?
                </button>
              )}

              <button 
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-2 shadow-md disabled:opacity-50"
              >
                {authLoading ? "Processing..." : authModal.type === "login" ? "Login" : "Register"}
              </button>
            </form>

            <button 
              onClick={() => setAuthModal({ isOpen: false, type: "login" })}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-brand-dark font-bold text-xs rounded-xl transition cursor-pointer text-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {authModal.isOpen && authModal.type === "forgot" && (
        <ForgotPasswordView 
          onClose={() => setAuthModal({ isOpen: false, type: "login" })}
          onBackToLogin={() => setAuthModal({ isOpen: true, type: "login" })}
        />
      )}

      {/* About Modal Overlay */}
      {aboutModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in text-left flex flex-col gap-4">
            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-brand-primary font-black">
                Design Manifest
              </span>
              <h3 className="text-xl font-black text-brand-dark">About Nomnom.ai</h3>
            </div>
            <p className="text-xs text-brand-brown-muted leading-relaxed">
              Nomnom is a production-ready food review engine engineered to isolate contrasting sentiments in real-time. By utilizing Aspect-Based Sentiment Analysis (ABSA) powered by Google Gemini, we prevent flavor accolades from neutralizing packaging or temperature defects.
            </p>
            <p className="text-xs text-brand-brown-muted leading-relaxed">
              Traditional metrics average everything out: if a meal tastes perfect (+1.0) but is served cold (-1.0), traditional sentiment scores it as neutral (0) or average (0.50). Nomnom maps these independently so logistics and recipe teams can react with speed.
            </p>
            <button 
              onClick={() => setAboutModalOpen(false)}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-light text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
            >
              Close Design Manifest
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
