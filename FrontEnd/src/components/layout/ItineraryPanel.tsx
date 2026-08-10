"use client";

import { ArrowRight } from "lucide-react";
import { learningMethods, LearningMethodId } from "@/lib/learningMockData";

type ItineraryPanelProps = {
  selectedLearningMethod: LearningMethodId;
  onSelectLearningMethod: (method: LearningMethodId) => void;
};

export default function ItineraryPanel({
  selectedLearningMethod,
  onSelectLearningMethod,
}: ItineraryPanelProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Header gọn gàng */}
      <div className="shrink-0 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
          Phương pháp học
        </p>
        <h2 className="text-base font-bold text-slate-900">
          Chọn cách học phù hợp
        </h2>
      </div>

      {/* Danh sách các phương pháp học (Dạng List gọn, không chiếm diện tích) */}
      <div className="flex flex-col gap-2.5 overflow-y-auto">
        {learningMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = method.id === selectedLearningMethod;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectLearningMethod(method.id)}
              className={`group flex items-center justify-between rounded-2xl p-3.5 text-left transition-all duration-200 focus:outline-none ${
                isSelected
                  ? "bg-emerald-50 text-emerald-900 shadow-sm"
                  : "bg-white text-slate-700 hover:bg-slate-100/80"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Icon Box */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${isSelected
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                    }`}
                >
                  <Icon size={20} />
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-slate-900">
                      {method.label}
                    </h3>
                  </div>
                  <p className="truncate text-xs text-slate-500 mt-0.5">
                    {method.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}