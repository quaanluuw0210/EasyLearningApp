"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Compass,
  ListChecks,
  GraduationCap,
  ListOrdered,
  Layers,
  Brain,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Vào trang Khám phá",
    description:
      "Truy cập trang Khám phá để xem toàn bộ khóa học và chủ đề từ vựng hiện có, được sắp xếp theo chủ đề và trình độ.",
    icon: Compass
  },
  {
    title: "Chọn bộ từ phù hợp",
    description:
      "Chọn khóa học và chủ đề từ vựng phù hợp với mục tiêu và trình độ hiện tại của bạn để bắt đầu học.",
    icon: ListChecks
  },
  {
    title: "Chọn phương pháp học",
    description:
      "Chọn 1 trong 3 cách học: xem Danh sách từ vựng, học bằng Flashcard, hoặc ôn tập theo phương pháp Học ngắt quãng.",
    icon: GraduationCap
  }
];

const methodSteps = [
  {
    title: "Danh sách từ vựng",
    description:
      "Xem toàn bộ từ vựng của chủ đề dưới dạng danh sách: từ, loại từ, phiên âm, nghĩa và ví dụ. Phù hợp để lướt nhanh và tra cứu.",
    icon: ListOrdered
  },
  {
    title: "Flashcard",
    description:
      "Học từng thẻ một, chạm để lật thẻ xem nghĩa và ví dụ minh họa. Vuốt hoặc bấm nút để chuyển sang thẻ tiếp theo, phù hợp để làm quen từ mới.",
    icon: Layers
  },
  {
    title: "Học ngắt quãng (SRS)",
    description:
      "Ôn tập theo thuật toán lặp lại ngắt quãng: lật thẻ rồi chọn mức độ nhớ Again / Hard / Good / Easy để hệ thống tự sắp xếp lịch ôn tối ưu.",
    icon: Brain
  }
];

const methodCompareCards = [
  {
    label: "Mới bắt đầu",
    tone: "from-rose-500 to-orange-500",
    text: "Bắt đầu bằng Danh sách từ vựng hoặc Flashcard để làm quen mặt chữ, nghĩa và cách phát âm.",
    note: "Giúp bạn nắm tổng quan nhanh trước khi ôn sâu."
  },
  {
    label: "Muốn nhớ lâu dài",
    tone: "from-emerald-400 to-teal-500",
    text: "Chuyển sang Học ngắt quãng (SRS) sau khi đã quen mặt từ, để hệ thống tự nhắc ôn đúng thời điểm.",
    note: "Thuật toán SRS giúp ghi nhớ bền vững, tiết kiệm thời gian ôn tập."
  }
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-white/60">
      <Navbar />
      <section className="section-spacing !py-12 md:!py-14 lg:!py-16">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-lagoon/30 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-lagoon shadow-soft">
              Hướng dẫn nhanh
            </div>
            <h1 className="font-display text-4xl font-semibold text-slate-900 md:text-5xl">
              Hướng dẫn <span className="text-gradient">học từ vựng</span>
            </h1>
            <p className="max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              Khám phá bộ từ vựng phù hợp và chọn phương pháp học yêu thích của bạn chỉ trong vài bước đơn giản.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="glass rounded-3xl p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-coral to-brand-flame text-white">
                    <Icon size={22} />
                  </div>
                  <h2 className="mt-6 font-display text-xl font-semibold text-slate-900">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-spacing pt-0 !pb-12 md:!pb-14 lg:!pb-16">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="space-y-3"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-lagoon">
              3 phương pháp học
            </div>
            <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
              Học theo cách phù hợp với bạn
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Mỗi chủ đề từ vựng đều hỗ trợ 3 cách học khác nhau. Bạn có thể chuyển đổi qua lại giữa các phương pháp
              bất cứ lúc nào, tiến trình học luôn được lưu lại.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {methodSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="glass rounded-3xl p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="glass rounded-3xl p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-flame">
              Lưu ý nhanh
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Tiến trình học (từ đã xem, thẻ đã ôn) được lưu tự động theo từng chủ đề, bạn có thể quay lại tiếp tục
              học bất cứ lúc nào mà không mất tiến độ.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-spacing pt-0 !pb-12 md:!pb-14 lg:!pb-16">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="space-y-3"
          >
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-flame">
              Nên chọn phương pháp nào?
            </div>
            <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
              Gợi ý lộ trình học từ vựng
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {methodCompareCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="glass rounded-3xl p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
              >
                <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${card.tone} px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white`}>
                  {card.label}
                </div>
                <div className="mt-4 rounded-2xl border border-white/60 bg-slate-950/90 p-4 text-sm text-slate-200">
                  {card.text}
                </div>
                <p className="mt-3 text-sm text-slate-600">{card.note}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.4 }}
            className="glass rounded-3xl p-6 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
          >
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-lagoon">
              <Sparkles size={16} /> Mẹo nhỏ
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Với Học ngắt quãng, hãy đánh giá trung thực mức độ nhớ của mình (Again / Hard / Good / Easy) — chọn đúng
              mức giúp hệ thống xếp lịch ôn tập chính xác hơn và bạn sẽ nhớ từ lâu hơn.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-spacing pt-0 !pb-12 md:!pb-14 lg:!pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <div className="glass flex flex-col items-start justify-between gap-6 rounded-3xl p-8 shadow-soft transition hover:-translate-y-2 hover:shadow-glow md:flex-row md:items-center">
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-semibold text-slate-900">
                Sẵn sàng bắt đầu học?
              </h3>
              <p className="text-sm text-slate-600">
                Vào trang Khám phá để chọn bộ từ vựng và phương pháp học phù hợp với bạn.
              </p>
            </div>
            <Link
              href="/explore"
              className="rounded-full bg-gradient-to-r from-brand-coral to-brand-flame px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Đã hiểu, Khám phá ngay!
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}