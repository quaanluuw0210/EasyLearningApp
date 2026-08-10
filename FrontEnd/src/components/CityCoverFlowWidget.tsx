"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Trophy, Users, Briefcase, Plane, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Đề xuất thay thế tên file ảnh phù hợp với chủ đề học Tiếng Anh:
import communicationImg from "@/assets/images/communication.png";
import ieltsImg from "@/assets/images/toeic.png";
import businessImg from "@/assets/images/business.png";
import travelImg from "@/assets/images/travel.png";
import academicImg from "@/assets/images/academic.png";

const topics = [
  {
    id: "communication",
    name: "Tiếng anh giao tiếp",
    subtitle: "Daily Conversations",
    description: "Phản xạ nhanh với từ vựng giao tiếp thông dụng và phát âm chuẩn.",
    accent: "from-emerald-400 to-teal-300",
    count: "Nhiều bài học",
    icon: Users,
    image: communicationImg,
  },
  {
    id: "ielts",
    name: "Ôn tập từ vựng TOEIC",
    subtitle: "Vocabulary for TOEIC",
    description: "Nhiều bộ từ vựng theo chủ đề, luyện tập nghe, đọc và viết để đạt điểm cao trong kỳ thi TOEIC.",
    accent: "from-amber-300 to-orange-400",
    count: "Nhiều bộ từ vựng",
    icon: Trophy,
    image: ieltsImg,
  },
  {
    id: "business",
    name: "Tiếng Anh Công Sở",
    subtitle: "Business English",
    description: "Viết email chuyên nghiệp, thuyết trình tự tin và đàm phán hiệu quả trong môi trường làm việc.",
    accent: "from-blue-400 to-indigo-500",
    count: "Nhiều bài học",
    icon: Briefcase,
    image: businessImg,
  },
  {
    id: "travel",
    name: "Tiếng Anh Du Lịch",
    subtitle: "English for Travel",
    description: "Tự tin hỏi đường, đặt phòng khách sạn, gọi món và xử lý các tình huống tại sân bay.",
    accent: "from-sky-300 to-cyan-400",
    count: "Nhiều bài học",
    icon: Plane,
    image: travelImg,
  },
  {
    id: "academic",
    name: "Từ Vựng Chuyên Ngành",
    subtitle: "Advanced Vocabulary",
    description: "Mở rộng vốn từ chuyên sâu theo từng lĩnh vực: IT, Marketing, Tài chính và Y tế.",
    accent: "from-purple-300 to-pink-400",
    count: "Nhiều bài học",
    icon: GraduationCap,
    image: academicImg,
  },
];

export default function TopicCoverFlowWidget() {
  const [activeTopicId, setActiveTopicId] = useState("communication");
  const activeTopic = topics.find((topic) => topic.id === activeTopicId) || topics[0];
  const ActiveIcon = activeTopic.icon;

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/15 bg-indigo-500/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
              <Sparkles size={14} />
              Lộ trình học tập
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
              Nhiều chủ đề hấp dẫn.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-600 md:text-base">
              Khám phá các khóa học được thiết kế theo mục tiêu cá nhân. Chọn một chủ đề để xem chi tiết bài học.
            </p>
          </div>

          {/* Active Highlight Card */}
          <div className="hidden min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:block">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Đang chọn
            </div>
            <div className="mt-2 flex items-center gap-2 text-slate-900">
              <ActiveIcon size={18} className="text-indigo-600" />
              <span className="text-lg font-bold">{activeTopic.name}</span>
            </div>
            <div className="mt-1 text-sm text-slate-500">{activeTopic.count}</div>
          </div>
        </div>

        {/* Desktop Accordion / Cover Flow */}
        <div className="hidden h-[430px] gap-4 md:flex">
          {topics.map((topic) => {
            const isActive = activeTopicId === topic.id;
            const TopicIcon = topic.icon;

            return (
              <motion.div
                key={topic.id}
                animate={{ flex: isActive ? 1.7 : 0.78 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className="min-w-0"
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveTopicId(topic.id)}
                  onFocus={() => setActiveTopicId(topic.id)}
                  onClick={() => setActiveTopicId(topic.id)}
                  className={cn(
                    "group relative h-full w-full overflow-hidden rounded-[28px] border text-left shadow-sm outline-none transition duration-300",
                    isActive
                      ? "border-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]"
                      : "border-white/70 hover:border-white hover:shadow-[0_18px_45px_rgba(15,23,42,0.18)]"
                  )}
                >
                  <img
                    src={topic.image.src}
                    alt={topic.name}
                    className={cn(
                      "h-full w-full object-cover transition duration-700",
                      isActive ? "scale-100" : "scale-105 group-hover:scale-100"
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                  
                  {/* Top Accent Gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-60",
                      topic.accent
                    )}
                  />

                  {/* Badge */}
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm backdrop-blur">
                    <BookOpen size={13} className="text-indigo-600" />
                    {topic.count}
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div
                      className={cn(
                        "mb-4 h-1.5 rounded-full bg-gradient-to-r transition-all duration-300",
                        topic.accent,
                        isActive ? "w-20" : "w-10"
                      )}
                    />
                    <div
                      className={cn(
                        "font-display font-semibold leading-tight",
                        isActive ? "text-2xl" : "text-lg"
                      )}
                    >
                      {topic.name}
                    </div>
                    <div className="mt-1 text-xs font-medium text-white/80">{topic.subtitle}</div>
                    
                    {/* Expandable description */}
                    <div
                      className={cn(
                        "grid transition-all duration-300",
                        isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <p className="mt-3 min-h-0 overflow-hidden text-sm leading-6 text-white/80">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile Horizontal Carousel */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollSnapType: "x mandatory" }}>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => setActiveTopicId(topic.id)}
                className="relative h-[320px] w-[78vw] max-w-[310px] shrink-0 overflow-hidden rounded-[28px] border border-white/70 text-left shadow-sm"
                style={{ scrollSnapAlign: "center" }}
              >
                <img src={topic.image.src} alt={topic.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />
                
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-sm">
                  {topic.count}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className={cn("mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r", topic.accent)} />
                  <div className="font-display text-xl font-semibold drop-shadow">
                    {topic.name}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-white/85 drop-shadow">
                    {topic.subtitle}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/80 line-clamp-3">{topic.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}