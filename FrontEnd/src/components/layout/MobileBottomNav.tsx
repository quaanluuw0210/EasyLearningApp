"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Info, Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Trang chủ", href: "/", icon: Home },
  { label: "Các bộ từ vựng", href: "/explore", icon: Map },
  { label: "Tính năng", href: "/#features", icon: Star },
  { label: "Về chúng tôi", href: "/about", icon: Info },
  { label: "Hướng dẫn", href: "/guide", icon: BookOpen },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] block border-t border-slate-200/60 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href.startsWith("/#") && pathname === "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 transition-colors duration-200",
                isActive ? "text-brand-coral" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="max-w-full truncate text-[10px] font-medium">{link.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-brand-coral" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
