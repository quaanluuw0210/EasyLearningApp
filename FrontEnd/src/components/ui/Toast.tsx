"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Loader2, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "loading";

interface ToastProps {
  show: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
  position?: "bottom" | "center" | "top" | "bottom-left";
}

export default function Toast({ show, type, message, duration = 3000, onClose, position = "top" }: ToastProps) {
  useEffect(() => {
    if (show && type !== "loading" && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, type, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-brand-lagoon" size={20} />,
    loading: <Loader2 className="animate-spin text-brand-flame" size={20} />,
  };

  const backgrounds = {
    success: "bg-white/95 border-emerald-100",
    error: "bg-white/95 border-rose-100",
    info: "bg-white/95 border-blue-100",
    loading: "bg-white/95 border-slate-100",
  };

  const getPositionClasses = () => {
    switch (position) {
      case "center": return "items-center justify-center";
      case "bottom": return "items-end justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-12";
      case "bottom-left": return "items-end justify-start px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pl-8 sm:pb-8";
      case "top": return "items-start justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-24";
      default: return "items-start justify-center px-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:pt-24";
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <div className={`fixed inset-0 z-[300] flex ${getPositionClasses()} pointer-events-none`}>
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.9, 
              y: (position === 'top' || position === 'bottom-left') ? -20 : 20 
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.9, 
              y: (position === 'top' || position === 'bottom-left') ? -20 : 20 
            }}
            className={`pointer-events-auto flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-[24px] border px-4 py-3 shadow-2xl backdrop-blur-xl sm:max-w-[min(90vw,32rem)] sm:px-6 sm:py-4 ${backgrounds[type]}`}
          >
            <div className="mt-0.5 flex-shrink-0">{icons[type]}</div>
            <p className="min-w-0 break-words text-sm font-bold leading-5 text-slate-800">
              {message}
            </p>
            {type !== "loading" && (
              <button
                onClick={onClose}
                className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
