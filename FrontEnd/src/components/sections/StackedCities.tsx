"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const cities = [
  {
    id: "dalat",
    name: "Đà Lạt",
    subtitle: "Cao nguyên mờ sương",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    baseZ: "z-10",
    baseScale: "scale-95",
    offset: "-translate-x-16"
  },
  {
    id: "hanoi",
    name: "Hà Nội",
    subtitle: "Phố cổ & ẩm thực",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80",
    baseZ: "z-20",
    baseScale: "scale-97",
    offset: "-translate-x-8"
  },
  {
    id: "hcm",
    name: "TP Hồ Chí Minh",
    subtitle: "Nhịp sống sôi động",
    image:
      "https://images.unsplash.com/photo-1500534314209-a26db0f5b346?auto=format&fit=crop&w=900&q=80",
    baseZ: "z-30",
    baseScale: "scale-100",
    offset: "translate-x-0"
  },
  {
    id: "danang",
    name: "Đà Nẵng",
    subtitle: "Biển xanh & cầu vàng",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
    baseZ: "z-20",
    baseScale: "scale-97",
    offset: "translate-x-8"
  },
  {
    id: "vungtau",
    name: "Vũng Tàu",
    subtitle: "Hải sản & hoàng hôn",
    image:
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80",
    baseZ: "z-10",
    baseScale: "scale-95",
    offset: "translate-x-16"
  }
];

export default function StackedCities() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  return (
    <section className="px-6 pb-16">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-flame">
            Khám phá địa điểm
          </div>
          <h2 className="font-display text-3xl font-semibold text-slate-900 md:text-4xl">
            Những điểm đến được săn đón nhất.
          </h2>
        </div>

        <div className="hidden items-center justify-center md:flex">
          <div className="flex items-center">
            {cities.map((city) => {
              const isHovered = hoveredCity === city.id;
              return (
                <motion.div
                  key={city.id}
                  onMouseEnter={() => setHoveredCity(city.id)}
                  onMouseLeave={() => setHoveredCity(null)}
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                    zIndex: isHovered ? 40 : undefined
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "relative h-[320px] w-[200px] overflow-hidden rounded-3xl border border-white/70 shadow-soft transition",
                    "-ml-10 first:ml-0",
                    city.baseZ,
                    city.baseScale,
                    city.offset,
                    isHovered ? "shadow-glow" : ""
                  )}
                  style={{ backgroundImage: `url(${city.image})` }}
                >
                  <div className={cn("absolute inset-0 transition duration-300", isHovered ? "bg-white/0" : "bg-slate-900/15")} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                  <div className="absolute bottom-5 left-5 space-y-1 text-white">
                    <div className="text-base font-semibold">{city.name}</div>
                    <div className="text-xs text-white/80">{city.subtitle}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:hidden">
          {cities.map((city) => (
            <div
              key={city.id}
              className="relative h-[220px] overflow-hidden rounded-3xl border border-white/70 shadow-soft"
              style={{ backgroundImage: `url(${city.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
              <div className="absolute bottom-4 left-4 space-y-1 text-white">
                <div className="text-base font-semibold">{city.name}</div>
                <div className="text-xs text-white/80">{city.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
