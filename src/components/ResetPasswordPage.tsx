import React, { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export default function ResetPasswordPage({ onSuccess }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear URL hash after component mounts
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.updateUser({ password });
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-background z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-fade-in text-left flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-2 border-b border-brand-background">
          <Key className="w-5 h-5 text-brand-primary" />
          <h3 className="text-base font-black text-brand-dark uppercase tracking-tight">
            Set New Password
          </h3>
        </div>
        
        {error && (
          <div className="text-xs bg-red-50 text-brand-primary border border-red-200/20 p-2.5 rounded-xl font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">New Password</span>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••" 
              className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Confirm Password</span>
            <input 
              type="password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••" 
              className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-2 shadow-md disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
