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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {user ? 'Switch Account' : 'Sign In to Resume Builder'}
              </h2>
              <p className="text-xs text-gray-500">Save your work history &amp; styling preferences</p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Continue</span>
            </button>

            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium text-xs rounded-lg border border-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Demo Login</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
