"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const members = [
  {
    name: "Nguyễn Công Lãm",
    role: "App Developer",
    image: "/assets/images/NguyenCongLam.jpg",
    tags: ["Ticket Export", "User Management", "Fallback Logic", "UX/UI"]
  },
  {
    name: "Trần Thành Nam",
    role: "App Developer",
    image: "/assets/images/TranThanhNam.png",
    tags: ["Anti-Spam Caching", "QR Scanner", "Health Features", "UX/UI"]
  },
  {
    name: "Nguyễn Xuân Lộc",
    role: "App Developer",
    image: "/assets/images/NguyenXuanLoc.jpg",
    tags: ["Maps Integration", "API Development", "Auth & History", "UX/UI"]
  },
  {
    name: "Ngô Hoàng Minh",
    role: "Project Leader | App Developer",
    image: "/assets/images/NgoHoangMinh.jpg",
    tags: ["System Design", "Core Algorithm", "AI Chatbot", "Database & Deploy", "UX/UI"]
  },
  {
    name: "Lưu Đình Quân",
    role: "App Developer",
    image: "/assets/images/LuuDinhQuan.png",
    tags: ["AI Chatbot", "Data Filtering", "Health Features", "API & DB"]
  },
  {
    name: "Nguyễn Huy Thành",
    role: "App Developer",
    image: "/assets/images/NguyenHuyThanh.jpg",
    tags: ["Maps Render", "Health Features", "UX/UI"]
  }
];

export default function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(3); // Start with Ngô Hoàng Minh centered between Lộc and Quân
  const [isMobile, setIsMobile] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % members.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + members.length) % members.length);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-brand-coral/30 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-lagoon/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-coral/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-brand-coral animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">About the Team</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold text-slate-900 leading-[1.1]"
            >
              The minds behind <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-lagoon to-brand-coral">
                Bite Mapping Intelligent
              </span>
            </motion.h1>
          </div>
          
          <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
          >
            <Link 
              href="/" 
              className="group flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-full shadow-soft transition-all duration-300"
            >
              <Home size={18} className="text-slate-600 group-hover:text-brand-lagoon transition-colors" />
              <span className="text-sm font-semibold text-slate-900">Back Home</span>
            </Link>
          </motion.div>
        </div>

        {/* Horizontal Slider Area */}
        <div className="relative mt-10">
          <div className="flex items-center justify-center h-[550px] md:h-[600px] overflow-visible">
            <motion.div 
              className="flex gap-6 md:gap-10"
              animate={{ 
                x: windowWidth === 0 ? 0 : isMobile 
                   ? `calc(50% - ${activeIndex * (windowWidth * 0.8 + 24) + (windowWidth * 0.4)}px)`
                   : `calc(50% - ${activeIndex * (320 + 40) + 160}px)` 
              }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              {members.map((member, index) => {
                const isActive = index === activeIndex;
                return (
                  <motion.div
                    key={member.name}
                    animate={{ 
                      scale: isActive ? 1.05 : 0.9,
                      opacity: isActive ? 1 : 0.4,
                      y: isActive ? 0 : 20
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex-shrink-0 w-[80vw] md:w-[320px] bg-white rounded-[2.5rem] overflow-hidden shadow-soft border border-slate-100 group cursor-pointer"
                    onClick={() => setActiveIndex(index)}
                  >
                    {/* Member Image Container */}
                    <div className="relative h-[320px] md:h-[350px] overflow-hidden">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&size=512`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-brand-lagoon transition-colors">{member.name}</h3>
                        <p className="text-brand-coral text-xs font-bold uppercase tracking-[0.2em]">{member.role}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {member.tags.map(tag => (
                          <span 
                            key={tag} 
                            className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-xl uppercase tracking-wider border border-slate-100 group-hover:border-brand-lagoon/20 group-hover:bg-brand-lagoon/5 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-4 md:-px-10">
            <button 
              onClick={prev}
              className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-soft pointer-events-auto hover:bg-brand-lagoon hover:text-white transition-all duration-300 border border-slate-100 group"
            >
              <ChevronLeft className="text-slate-600 group-hover:text-white transition-colors" size={24} />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/80 backdrop-blur-md rounded-full shadow-soft pointer-events-auto hover:bg-brand-lagoon hover:text-white transition-all duration-300 border border-slate-100 group"
            >
              <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar / Pagination */}
        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="flex gap-3">
            {members.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === activeIndex ? "w-12 bg-brand-lagoon" : "w-3 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
          
          <div className="text-slate-400 text-sm font-medium">
            <span className="text-slate-900">{activeIndex + 1}</span>
            <span className="mx-2">/</span>
            {members.length}
          </div>
        </div>
      </div>
    </div>
  );
}