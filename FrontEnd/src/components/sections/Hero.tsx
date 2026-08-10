"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function Hero() {
  const { user } = useAuth();
  
  return (
    <section className="section-spacing !pb-10 !pt-8 lg:!pt-10" id="about">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="space-y-5 lg:space-y-6"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex items-center gap-2 rounded-2xl border border-brand-coral/20 bg-white px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-flame shadow-sm sm:text-xs lg:rounded-full lg:bg-white/70 lg:px-4 lg:tracking-[0.2em] lg:shadow-soft"
          >
            <Sparkles size={14} />
            Luyện Từ Vựng Thông Minh
          </motion.div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl md:text-5xl">
            Làm chủ vốn từ tiếng Anh cùng ELA
            <span className="text-gradient"> tối ưu</span> bằng
            <span className="text-gradient"> nhiều phương pháp</span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 md:text-lg">
            Không còn nỗi lo học trước quên sau. Thuật toán lặp lại ngắt quãng (Spaced Repetition) cùng FlashCard giúp bạn ghi nhớ nhanh và hiệu quả. Học từ vựng theo chủ đề, luyện tập với ví dụ thực tế và kiểm tra tiến độ học tập của bạn.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/explore"
              className="inline-flex min-h-12 w-full sm:w-auto shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_14px_30px_rgba(255,106,61,0.24)] transition hover:-translate-y-0.5 lg:rounded-full lg:shadow-glow"
            >
              Học ngay bây giờ
            </Link>
            
            <p className="max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
             Miễn phí, không quảng cáo.
            </p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="relative"
        >
          <div className="glass relative overflow-hidden rounded-2xl p-4 shadow-sm lg:rounded-3xl lg:p-6 lg:shadow-soft">
            <div className="absolute inset-0 hidden bg-tech-glow opacity-70 lg:block" />
            <div className="relative space-y-3 lg:space-y-4">
              
              {/* Thẻ khoá học / Bộ từ vựng nổi bật */}
              <div className="rounded-2xl bg-white p-4 shadow-sm lg:bg-white/90 lg:shadow">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Bộ từ vựng nổi bật
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">
                  1.400 Từ Vựng Luyện Thi TOEIC
                </div>
                
                {/* Danh sách tính năng/đặc điểm */}
                <div className="mt-3 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Chia theo từng chủ đề
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                      50+ Chủ đề
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Phát âm chuẩn UK/US
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                      Audio HD
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-500">✓</span> Ôn tập qua Flashcard & Quiz
                    </span>
                    <span className="rounded-full bg-brand-coral/10 px-2.5 py-0.5 text-xs font-semibold text-brand-coral">
                      Dễ ghi nhớ
                    </span>
                  </div>
                </div>
              </div>

              {/* Thẻ ghi chú phía dưới */}
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm text-slate-600 lg:border-white/60 lg:bg-white/50">
                💡 Lộ trình học được thiết kế bài bản giúp bạn tự tin đạt mục tiêu điểm số.
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
