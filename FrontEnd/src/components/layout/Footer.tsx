import Link from "next/link";
import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/70 px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-semibold text-slate-900">
              ELA
            </span>
            <span>© 2026. Bảo lưu mọi quyền.</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            EASY LEARNING ASSISTANT
          </span>
        </div>
        <Link
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
        >
          <Github size={18} />
          Github
        </Link>
      </div>
    </footer>
  );
}
