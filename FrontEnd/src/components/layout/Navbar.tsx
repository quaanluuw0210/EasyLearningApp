"use client";
import Link from "next/link";
import {  LogOut, User,LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import MobileBottomNav from "./MobileBottomNav";

const links = [
  { label: "Trang chủ", href: "/" },
  { label: "Các bộ từ vựng", href: "/explore" },
  { label: "Về chúng tôi", href: "/about" },
  { label: "Tính năng", href: "/#features" },
  { label: "Hướng dẫn", href: "/guide" },
];

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
             <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 via-sky-500/15 to-blue-600/20 border border-sky-500/20 shadow-sm transition-transform group-hover:scale-110">
                  <img 
                    src="/assets/images/web_logo.png" 
                    alt="ELA Logo" 
                    className="h-7 w-7 object-contain" 
                  />
                </span>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold tracking-tight text-slate-900">
                ELA
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                EASY LEARNING ASSISTANT
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* User Dropdown ... (unchanged) */}
                  <div className="relative group z-50">
                    <button className="flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white p-1 transition hover:bg-slate-50 shadow-sm sm:h-auto sm:w-auto sm:justify-start sm:pr-3.5">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=ff6b4a&color=fff`} 
                        alt="Avatar" 
                        className="h-7 w-7 rounded-full object-cover bg-slate-100 sm:h-8 sm:w-8" 
                        onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=U&background=ff6b4a&color=fff")}
                      />
                      <div className="hidden flex-col items-start text-left md:flex">
                        <span className="text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                          {user.displayName || "Người dùng"}
                        </span>
                      </div>
                    </button>
                      
                    {/* Dropdown Menu (Hover Trigger) ... (unchanged) */}
                    <div className="absolute right-0 top-full mt-2 w-56 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-out rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
                      <div className="px-3 py-3 mb-2 border-b border-slate-100 flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-slate-800 truncate">{user.displayName || "Người dùng"}</span>
                        <span className="text-[11px] text-slate-500 truncate">{user.email}</span>
                      </div>
                      
                      <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-brand-coral/10 hover:text-brand-coral transition-colors">
                        <User size={16} /> Hồ sơ cá nhân
                      </Link>
                      
                      {/* Nút Admin - Chỉ hiện khi role là admin */}
                    {user.role === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors mb-1"
                      >
                        <LayoutDashboard size={16} /> {/* Đừng quên import icon này từ lucide-react */}
                        Quản trị hệ thống
                      </Link>
                    )}

                      <button onClick={() => logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors mt-1">
                        <LogOut size={16} /> Đăng xuất
                      </button>
                    </div>
                  </div>

                    <Link
                      href="/app"
                      className="hidden rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(255,106,61,0.22)] transition hover:-translate-y-0.5 sm:inline-flex lg:rounded-full lg:px-5 lg:py-2 lg:shadow-glow"
                    >
                      Dùng ngay
                    </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/app"
                    className="hidden rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(255,106,61,0.22)] transition hover:-translate-y-0.5 sm:inline-flex lg:rounded-full lg:px-5 lg:py-2 lg:shadow-glow"
                  >
                    Dùng ngay
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-coral hover:text-brand-coral hover:shadow-sm lg:rounded-full lg:px-5"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      <MobileBottomNav />
    </>
  );
}

