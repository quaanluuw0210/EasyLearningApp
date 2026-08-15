"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Heart,
  ShieldCheck,
  BookOpen,
  Code,
  Mail,
  PhoneCall,
  Sparkles,
  Users
} from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-brand-coral/30 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-lagoon/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-coral/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-20">

        {/* Top Bar: Dynamic spacing & mobile-friendly */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 mb-8 sm:mb-12"
        >
          <Link href="/" className="group flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <img
                src="/assets/images/web_logo.png"
                alt="ELA Logo"
                className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
              />
            </div>
            <span className="text-base sm:text-lg font-display font-bold text-slate-900 group-hover:text-brand-lagoon transition-colors tracking-tight">
              VOCABMASTER
            </span>
          </Link>

          <Link
            href="/"
            className="group flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-sm transition-all duration-300 shrink-0"
          >
            <Home size={16} className="text-slate-600 group-hover:text-brand-lagoon transition-colors" />
            <span className="text-xs sm:text-sm font-semibold text-slate-900">Trang chủ</span>
          </Link>
        </motion.div>

        {/* Header Section: Căn giữa đồng bộ badge và tiêu đề */}
        <div className="mb-10 sm:mb-14 space-y-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Về Dự Án
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 leading-snug sm:leading-tight tracking-tight px-2"
          >
            Học tập tự do <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-lagoon to-brand-coral">• Hoàn toàn vì cộng đồng</span>
          </motion.h1>
        </div>

        {/* Community First Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 sm:mb-12 relative overflow-hidden"
        >
          {/* Watermark Logo */}
          <img
            src="/assets/images/web_logo.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none absolute -right-6 -bottom-6 h-32 w-32 sm:h-40 sm:w-40 object-contain opacity-[0.05]"
          />

          <div className="max-w-2xl space-y-3 sm:space-y-4 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 font-medium text-xs">
              <Users size={14} />
              <span>Dự án hoàn toàn vì người học</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900">
              Trao giá trị - Không ghi danh
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Nền tảng này được xây dựng với mục đích duy nhất là đóng góp cho cộng đồng học tập. Sản phẩm được tạo ra không hướng tới danh tiếng hay công lao cá nhân, mà mong muốn mang đến một môi trường học tập hoàn chỉnh, minh bạch và tiếp cận tự do cho tất cả mọi người.
            </p>
          </div>
        </motion.div>

        {/* Mission / Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 sm:mb-6">
              <ShieldCheck size={22} />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">100% Miễn phí & Không quảng cáo</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Cam kết không chứa quảng cáo gây phiền nhiễu, không thu phí bất kỳ khóa học nào và không thương mại hóa dữ liệu người dùng.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4 sm:mb-6">
              <Code size={22} />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Nền tảng kỹ thuật từ dự án BMI</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ứng dụng được kế thừa và phát triển dựa trên khung Framework của dự án{" "}
                <strong>Bite Mapping Intelligent (BMI)</strong> từ nhóm <strong>24CTT6-1</strong> (Môn Tư duy tính toán).{" "}
                <a
                  href="https://github.com/nhminh107/24CTT6-TDTT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-500 underline underline-offset-2 hover:text-indigo-600"
                >
                  Xem trên GitHub
                </a>
                .
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 sm:mb-6">
              <BookOpen size={22} />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Nội dung tự sưu tầm & Biên soạn</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Toàn bộ dữ liệu từ vựng và tài liệu học tập trên ứng dụng đều được chính tác giả tỉ mỉ chọn lọc, thu thập và chỉnh sửa chỉn chu.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 sm:mb-6">
              <Heart size={22} />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Sự phát triển bền vững</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nền tảng liên tục được cải tiến về giao diện và hiệu năng để đem lại trải nghiệm học tập mượt mượt nhất cho cộng đồng.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-brand-lagoon font-semibold text-xs sm:text-sm">
              <Sparkles size={16} />
              <span>Hỗ trợ & Kênh liên hệ</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Bạn cần hỗ trợ hoặc báo lỗi?</h3>
            <p className="text-slate-600 text-xs sm:text-sm max-w-lg">
              Nếu bạn có bất kỳ thắc mắc nào hoặc phát hiện vấn đề bất thường trong quá trình học tập, vui lòng liên hệ qua các kênh bên dưới.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <a
              href="mailto:luudinhquan123456@gmail.com"
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 font-semibold text-xs sm:text-sm transition-all"
            >
              <Mail size={16} className="text-blue-500 shrink-0" />
              <span className="truncate">luudinhquan123456@gmail.com</span>
            </a>

            <a
              href="tel:0833365547"
              className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl sm:rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 font-semibold text-xs sm:text-sm transition-all shrink-0"
            >
              <PhoneCall size={16} className="shrink-0" />
              <span>0833365547</span>
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}