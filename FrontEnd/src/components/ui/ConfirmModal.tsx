"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  variant?: "danger" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  onConfirm,
  onClose,
  variant = "danger"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl"
        >
          <div className="p-8">
            <button
              onClick={onClose}
              className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] shadow-inner ${
                variant === "danger" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
              }`}>
                <AlertTriangle size={28} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {message}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 rounded-2xl py-3.5 text-sm font-bold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98] ${
                  variant === "danger" 
                    ? "bg-gradient-to-r from-brand-coral to-brand-flame shadow-rose-200" 
                    : "bg-gradient-to-r from-blue-500 to-brand-lagoon shadow-blue-200"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
