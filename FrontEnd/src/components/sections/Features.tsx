"use client";

import { motion } from "framer-motion";
import { Layers, Repeat, HelpCircle } from "lucide-react";

const features = [
  {
    title: "Flashcard Trực Quan",
    description:
      "Học từ vựng qua thẻ ghi nhớ kèm phát âm chuẩn, phiên âm, câu ví dụ thực tế và hình ảnh minh họa sinh động.",
    icon: Layers
  },
  {
    title: "Thuật Toán Lặp Lại Ngắt Quãng",
    description:
      "Áp dụng phương pháp Spaced Repetition tự động tính toán thời điểm vàng để nhắc bạn ôn tập trước khi kịp quên.",
    icon: Repeat
  },
  {
    title: "Bài Tập Ôn Tập Tương Tác",
    description:
      "Củng cố phản xạ với đa dạng dạng bài tập như chọn đáp án đúng, điền từ vào khoảng trống và luyện ghép câu.",
    icon: HelpCircle
  }
];

export default function Features() {
  return (
    <section className="section-spacing !pb-12 !pt-12" id="features">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Phần tiêu đề */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-2xl space-y-3"
        >
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-lagoon">
            Phương pháp hiệu quả
          </div>
          <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
            Học từ vựng nhanh hơn, ghi nhớ lâu hơn.
          </h2>
        </motion.div>

        {/* Danh sách 3 tính năng */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="glass group rounded-2xl p-5 shadow-sm transition hover:-translate-y-2 hover:shadow-glow lg:rounded-3xl lg:p-6 lg:shadow-soft"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-lagoon text-white lg:h-12 lg:w-12 lg:bg-gradient-to-br lg:from-brand-teal lg:to-brand-lagoon">
                  <Icon size={22} />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}