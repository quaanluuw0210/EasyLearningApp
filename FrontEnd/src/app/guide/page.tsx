"use client";

import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { MapPin, MessageSquare, Map, HeartPulse, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Thiết lập cơ bản",
    description:
      "Nhập vị trí bắt đầu bằng thanh tìm kiếm Autocomplete và đặt ngân sách tổng cho cả ngày để hệ thống cân bằng hợp lý.",
    icon: MapPin
  },
  {
    title: "Ra lệnh cho AI",
    description:
      "Nhập câu lệnh (Prompt) thể hiện rõ sở thích món ăn, phong cách quán và thứ tự bữa ăn. AI kết hợp với hồ sơ sức khỏe để gợi ý chính xác.",
    icon: MessageSquare
  },
  {
    title: "Tương tác với lộ trình",
    description:
      "Đọc thẻ thông tin quán ăn (giá, độ cay, điểm đánh giá) và xem đường đi trực quan trên bản đồ để quyết định nhanh.",
    icon: Map
  }
];

const promptCards = [
  {
    label: "Kém hiệu quả",
    tone: "from-rose-500 to-red-500",
    text: "Tôi muốn tìm quán ăn ngon ở Quận 1.",
    note: "Quá chung chung, AI tự chia đều ngân sách ngẫu nhiên."
  },
  {
    label: "Tối ưu",
    tone: "from-emerald-400 to-teal-500",
    text: "Sáng tôi muốn uống cà phê và ăn bánh ngọt nhẹ nhàng, trưa ăn quán Việt Nam tươm tất, tối ưu tiên các quán Âu có không khí lãng mạn.",
    note: "Có thứ tự bữa ăn, khẩu vị và phong cách rõ ràng."
  }
];

const healthSteps = [
  {
    title: "Mở Hồ sơ sức khỏe",
    description:
      "Bấm biểu tượng trái tim ở thanh điều hướng để mở bảng Hồ sơ sức khỏe bất cứ lúc nào.",
    icon: HeartPulse
  },
  {
    title: "Chọn bệnh nền & dị ứng",
    description:
      "Chọn nhanh các thẻ bệnh nền hoặc dị ứng. Có thể thêm ghi chú ngắn để AI hiểu rõ hơn.",
    icon: AlertTriangle
  },
  {
    title: "Chọn mức độ ăn kiêng",
    description:
      "Chọn Nghiêm ngặt hoặc Xả láng, sau đó bấm Lưu hồ sơ sức khỏe để áp dụng.",
    icon: ShieldCheck
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
              Hướng dẫn sử dụng <span className="text-gradient">BMI</span>
            </h1>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Bite Mapping Intelligent
            </div>
            <p className="max-w-3xl text-base leading-relaxed text-slate-600 md:text-lg">
              Làm chủ hệ thống gợi ý lộ trình và cá nhân hóa theo sức khỏe chỉ trong vài bước đơn giản.
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
              Hồ sơ sức khỏe
            </div>
            <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
              Cá nhân hóa gợi ý theo nhu cầu của bạn
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
              Hồ sơ sức khỏe giúp AI ưu tiên món ăn an toàn và phù hợp với tình trạng của bạn. Cập nhật càng rõ ràng,
              kết quả càng sát nhu cầu.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {healthSteps.map((step, index) => {
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
              Khi đã lưu hồ sơ, biểu tượng trái tim sẽ hiện chấm cam để bạn dễ nhận biết. Bạn có thể cập nhật lại bất cứ lúc nào.
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
              Nghệ thuật viết Prompt
            </div>
            <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
              Cách viết Prompt để AI hiểu bạn nhất
            </h2>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            {promptCards.map((card, index) => (
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
                <div className="mt-4 rounded-2xl border border-white/60 bg-slate-950/90 p-4 font-mono text-sm text-slate-200">
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
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-lagoon">
              Mẹo nâng cao
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">
              Bạn có thể mô tả không gian (view biển, yên tĩnh), khẩu vị (thích ăn cay, đồ chay) ngay trong câu lệnh để AI
              ưu tiên đúng nhu cầu. Nếu muốn trải nghiệm cao cấp hơn, hãy yêu cầu tăng ngân sách cho bữa tối hoặc toàn bộ
              lộ trình. Ví dụ tối ưu:
            </p>
            <div className="mt-4 rounded-2xl border border-white/60 bg-slate-950/90 p-4 font-mono text-sm text-slate-200">
              Tìm cho tôi lộ trình 3 bữa. Tôi thích ăn cay. Bữa tối phải là quán hải sản không gian mở và phù hợp cho gia đình.
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section-spacing pt-0 !pb-12 md:!pb-14 lg:!pb-16">
        <div className="mx-auto w-full max-w-5xl">
          <div className="glass flex flex-col items-start justify-between gap-6 rounded-3xl p-8 shadow-soft transition hover:-translate-y-2 hover:shadow-glow md:flex-row md:items-center">
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-semibold text-slate-900">
                Sẵn sàng tạo lộ trình đầu tiên?
              </h3>
              <p className="text-sm text-slate-600">
                Bắt đầu ngay để AI đề xuất tuyến đường ẩm thực phù hợp nhất.
              </p>
            </div>
            <Link
              href="/app"
              className="rounded-full bg-gradient-to-r from-brand-coral to-brand-flame px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Đã hiểu, Bắt đầu ngay!
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}