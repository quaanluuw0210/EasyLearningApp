"use client";

import type { LearningMethod, LearningMethodId } from "@/lib/learningMockData";

type LearningModeSelectorProps = {
  methods: LearningMethod[];
  selected: LearningMethodId;
  onSelect: (mode: LearningMethodId) => void;
};

export default function LearningModeSelector({ methods, selected, onSelect }: LearningModeSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-flame">
          Phương pháp học
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Chọn phương pháp phù hợp để xem nội dung học tập tương ứng.
        </p>
      </div>

      <div className="space-y-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`flex w-full items-start gap-4 rounded-3xl border px-4 py-4 text-left transition hover:border-brand-coral/40 hover:bg-slate-50 ${
                isSelected ? "border-brand-coral/40 bg-brand-coral/5 shadow-sm" : "border-slate-200 bg-white"
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
                isSelected ? "bg-brand-coral text-white" : "bg-slate-100 text-brand-coral"
              }`}>
                <Icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{method.label}</p>
                  {isSelected && (
                    <span className="rounded-full bg-brand-flame/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-flame">
                      Đang chọn
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{method.description}</p>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
