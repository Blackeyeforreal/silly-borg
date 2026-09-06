'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none no-print">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-3.5 rounded-xs border border-[#E7E4DC] border-l-3 bg-[#FDFCFB] text-[#141413] paper-shadow animate-in slide-in-from-right-8 duration-200 w-84 font-sans text-xs
              ${toast.type === 'success' ? 'border-l-[#2E5A36]' : 
                toast.type === 'error' ? 'border-l-[#993322]' : 
                'border-l-[#141413]'}
            `}
          >
            <div className="mr-2.5 mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-[#2E5A36]" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#993322]" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#141413]" />}
            </div>
            <div className="flex-1">
              <div className="font-mono text-[9px] uppercase tracking-wider font-bold mb-0.5 text-[#76736C]">
                {toast.type === 'success' ? 'Confirmed' : toast.type === 'error' ? 'Notice' : 'System'}
              </div>
              <p className="text-xs leading-snug text-[#141413] font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-[#76736C] hover:text-[#141413] cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
