"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, LockKeyhole, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  redirectPath?: string;
}

export default function AuthPromptModal({
  open,
  onClose,
  title = "Yêu cầu đăng nhập",
  description = "Tính năng này cần phải đăng nhập để sử dụng. Đăng nhập để AI có thể cá nhân hóa trải nghiệm cho bạn nhé!",
  redirectPath,
}: AuthPromptModalProps) {
  const pathname = usePathname();
  const finalRedirect = redirectPath || pathname;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="auth-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="auth-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-sm overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-500 shadow-inner">
                <LockKeyhole size={32} />
              </div>

              {/* Text */}
              <h3 className="mb-3 font-display text-xl font-bold text-slate-900">
                {title}
              </h3>
              <p className="mb-8 text-sm leading-relaxed text-slate-500 px-2">
                {description}
              </p>

              {/* Actions */}
              <div className="flex w-full flex-col gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(finalRedirect)}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame py-4 text-sm font-bold text-white shadow-glow transition hover:opacity-90 active:scale-[0.98]"
                >
                  <LogIn size={18} /> Đăng nhập ngay
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
                >
                  Để sau
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
