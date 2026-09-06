'use client';

import React, { useState } from 'react';
import { X, LogIn, UserCheck, Sparkles } from 'lucide-react';
import { useUserStore } from '@/store/user-store';
import { useToast } from '@/components/ui/Toast';

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login, user } = useUserStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { addToast } = useToast();

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('Please provide both name and email', 'error');
      return;
    }

    login(name, email);
    addToast(`Welcome, ${name}! You can now save your master profile & template preferences.`, 'success');
  };

  const handleDemoLogin = () => {
    login('Devang Srivastava', 'devang@example.com');
    addToast('Logged in as Devang Srivastava (Demo User)', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141413]/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div 
        className="bg-[#FDFCFB] rounded-xs shadow-2xl border border-[#E7E4DC] w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E7E4DC] bg-[#F8F7F4]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase font-bold text-[#993322] border border-[#EACDC7] bg-[#FBF3F1] px-1.5 py-0.5 rounded-xs">
              00 · ACCOUNT
            </span>
            <div>
              <h2 className="font-serif-display text-lg text-[#141413] leading-none">
                {user ? 'Switch Account' : 'Sign In to Studio'}
              </h2>
              <p className="font-mono text-[10px] text-[#76736C] uppercase tracking-wider mt-0.5">Persist master records &amp; specimens</p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-[#76736C] hover:text-[#141413] p-1.5 rounded-xs hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Candidate Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[#76736C] mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3 py-2 text-xs border border-[#DCD8CE] rounded-xs focus:border-[#141413] focus:ring-1 focus:ring-[#141413] outline-hidden text-[#141413] bg-white transition-colors font-mono"
              required
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#141413] hover:bg-[#2A2927] text-[#F8F7F4] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#141413] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#993322]" />
              <span>Authenticate &amp; Continue</span>
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-4 bg-white hover:bg-[#F8F7F4] text-[#76736C] hover:text-[#141413] font-mono text-xs uppercase tracking-wider rounded-xs border border-[#DCD8CE] hover:border-[#141413] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Sample Account (Devang Srivastava)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
