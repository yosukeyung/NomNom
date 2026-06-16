import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ForgotPasswordViewProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

export default function ForgotPasswordView({ onClose, onBackToLogin }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    
    setLoading(false);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-brand-brown-muted/10 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-fade-in text-left flex flex-col gap-5">
        <div className="flex items-center gap-2 pb-2 border-b border-brand-background">
          <Key className="w-5 h-5 text-brand-primary" />
          <h3 className="text-base font-black text-brand-dark uppercase tracking-tight">
            Reset Password
          </h3>
        </div>
        
        {error && (
          <div className="text-xs bg-red-50 text-brand-primary border border-red-200/20 p-2.5 rounded-xl font-medium">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="flex flex-col gap-4">
            <div className="text-sm bg-brand-peach-tag text-brand-primary border border-brand-primary/20 p-4 rounded-xl font-semibold text-center">
              Check your email for a password reset link.
            </div>
            <button 
              onClick={onBackToLogin}
              className="w-full py-3.5 bg-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center shadow-md"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-xs text-brand-brown-muted">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-mono font-bold text-brand-brown-muted">Email Address</span>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@mavorly.com" 
                className="w-full p-3 text-xs bg-brand-background border border-brand-brown-muted/15 rounded-xl text-brand-dark font-medium focus:border-brand-primary/40 focus:outline-hidden" 
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-primary text-white hover:bg-brand-primary-light font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-2 shadow-md disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button 
              type="button"
              onClick={onBackToLogin}
              className="text-[10px] font-bold text-brand-brown-muted hover:text-brand-primary transition"
            >
              Back to Login
            </button>
          </form>
        )}

        <button 
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-brand-dark font-bold text-xs rounded-xl transition cursor-pointer text-center"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
