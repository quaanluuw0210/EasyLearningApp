"use client";

import { Brain, Volume2 } from "lucide-react";
import { srsMock } from "@/lib/learningMockData";

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function SrsPanel() {
  const totalDue = Number(srsMock?.totalDue || 0);
  const dueWords = Array.isArray(srsMock?.dueWords) ? srsMock.dueWords : [];

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-[28px] border border-emerald-200/60 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-green-500/10 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
            <Brain size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Spaced Repetition
            </p>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Hôm nay có <span className="text-emerald-600">{totalDue}</span> từ cần ôn
            </h2>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98]"
        >
          Ôn tập ngay
        </button>
      </div>

      {/* 2. Danh sách từ cần ôn */}
      <div className="space-y-3">
        {dueWords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Không có từ nào cần ôn tập hôm nay
          </div>
        ) : (
          dueWords.map((item, index) => {
            const wordStr = String(item?.word || "");
            const meaningStr = String(item?.meaning || "");
            const phoneticStr = String(item?.phonetic || "");

            return (
              <div
                key={wordStr || index}
                className="group relative flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-emerald-500/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => speakText(wordStr)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-emerald-500 hover:text-white"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={18} />
                  </button>

                  <div className="flex flex-col gap-0.5">
                    {/* Từ vựng + Phiên âm nằm cạnh nhau */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">{wordStr}</span>
                      {phoneticStr && (
                        <span className="text-xs font-medium text-emerald-600">
                          {phoneticStr}
                        </span>
                      )}
                    </div>
                    {/* Dịch nghĩa */}
                    {meaningStr && (
                      <p className="text-sm font-medium text-slate-600">{meaningStr}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}