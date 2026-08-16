"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Bước 1",
    detail: "Vào trang Khám phá & chọn bộ từ.",
    note: "Chọn khóa học và chủ đề từ vựng phù hợp với trình độ, mục tiêu của bạn."
  },
  {
    title: "Bước 2",
    detail: "Chọn phương pháp học yêu thích.",
    note: "Xem danh sách từ vựng, học bằng Flashcard hoặc ôn theo Học ngắt quãng (SRS)."
  },
  {
    title: "Bước 3",
    detail: "Ôn tập & ghi nhớ lâu dài.",
    note: "Tiến trình học được lưu tự động, tiếp tục học mọi lúc mà không mất tiến độ."
  }
];

export default function HowItWorks() {
  return (
    <section className="section-spacing !pt-10" id="how">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-2xl space-y-3"
        >
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-flame">
            Hướng dẫn nhanh
          </div>
          <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
            3 bước để có lộ trình học từ vựng hiệu quả.
          </h2>
        </motion.div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
              className="glass rounded-2xl p-5 shadow-sm transition hover:-translate-y-2 hover:shadow-glow lg:rounded-3xl lg:p-6 lg:shadow-soft"
            >
              <div className="text-sm font-semibold text-brand-coral">
                {step.title}
              </div>
              <div className="mt-4 text-lg font-semibold text-slate-900">
                {step.detail}
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {step.note}
              </div>
              <div className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-coral to-brand-flame" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}