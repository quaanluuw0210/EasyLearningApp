"use client";

import { ArrowRight } from "lucide-react";
import { learningMethods, LearningMethodId } from "@/lib/learningMockData";

type ItineraryPanelProps = {
  location?: string;
  budget?: string;
  mealStops?: any[];
  restaurants?: any[];
  selectedRestaurantId?: string | null;
  currentTab?: "itinerary" | "detail";
  onSelectRestaurant?: (id: string) => void;
  onTabChange?: (tab: "itinerary" | "detail") => void;
  onCloseDetail?: () => void;
  currentItinerary?: any[];
  onDeleteMeal?: (id: string) => void;
  onResetItinerary?: () => void;
  onReorder?: (orderedItems: { id: string }[]) => void;
  showBoardingPass?: boolean;
  onShowBoardingPassChange?: (open: boolean) => void;
  hasHealthProfile?: boolean;
  onOpenHealthProfile?: () => void;
  selectedLearningMethod: LearningMethodId;
  onSelectLearningMethod: (method: LearningMethodId) => void;
};

export default function ItineraryPanel({
  selectedLearningMethod,
  onSelectLearningMethod,
}: ItineraryPanelProps) {
  return (
    /* Khung ngoài với viền mỏng và hiệu ứng bóng đổ nhẹ */
    <div className="flex h-full max-h-screen flex-col gap-5 overflow-y-auto rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      
      {/* Header */}
      <div className="shrink-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Phương pháp học
        </p>
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Chọn cách học phù hợp với bạn
        </h2>
      </div>

      {/* Grid chứa 3 phương pháp học */}
      <div className="grid flex-1 grid-rows-3 gap-4">
        {learningMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = method.id === selectedLearningMethod;

          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelectLearningMethod(method.id)}
              className={`group flex h-full flex-col justify-between overflow-hidden rounded-[24px] border p-5 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                isSelected
                  ? "border-emerald-500/80 bg-emerald-50/50 shadow-sm"
                  : "border-slate-200/70 bg-white hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg"
              }`}
            >
              <div>
                <div className="flex items-center gap-4">
                  {/* Icon Box */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                        : "bg-slate-100 text-emerald-600 group-hover:bg-emerald-500/10"
                    }`}
                  >
                    <Icon size={24} />
                  </div>

                  {/* Label & Description */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {method.label}
                      </h3>
                      {isSelected && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {method.description}
                    </p>
                  </div>
                </div>

                {/* Meta info (chỉ giữ lại văn bản mô tả số từ, đã ẩn thanh progress) */}
                <div className="mt-4 text-left">
                  <p className="text-sm font-semibold text-slate-700">
                    {method.meta}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-3">
                <span
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "border border-emerald-500 bg-white text-emerald-600 hover:bg-emerald-500 hover:text-white"
                  }`}
                >
                  {method.buttonLabel}
                  <ArrowRight size={16} className="ml-2" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}