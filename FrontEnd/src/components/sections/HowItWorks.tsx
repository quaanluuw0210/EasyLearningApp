"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Bước 1",
    detail: "Nhập vị trí và ngân sách.",
    note: "BMI sẽ ghi nhớ điểm xuất phát để tối ưu quãng đường."
  },
  {
    title: "Bước 2",
    detail: "AI phân tích & Lọc dữ liệu.",
    note: "Thuật toán cân bằng giá, khẩu vị và thời gian di chuyển."
  },
  {
    title: "Bước 3",
    detail: "Trải nghiệm lộ trình hoàn hảo.",
    note: "Xem bản đồ, lưu vé và chia sẻ ngay trong một chạm."
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
            3 bước để có lịch trình ẩm thực hoàn hảo.
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
