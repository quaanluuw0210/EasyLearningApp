
"use client";

import LearningContentPanel from "@/components/sections/LearningContentPanel";
import type { LearningMethodId } from "@/lib/learningMockData";
import type { Restaurant } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isCompact?: boolean;
  restaurants?: Restaurant[];
  metadata?: {
    restaurants?: Restaurant[];
  };
};

type ChatInterfaceProps = {
  placeId: string;
  chatId?: string | null;
  messages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onRestaurantsSelect?: (restaurants: Restaurant[]) => void;
  onRestaurantSelect?: (restaurantId: string) => void;
  onRefreshHistory?: () => void;
  onAutoCreateChat?: () => Promise<string | null>;
  currentItinerary?: any[];
  onSelectMeal?: (meal: string, restaurant: Restaurant) => void;
  fetchItinerary?: () => Promise<void>;
  input?: string;
  onInputChange?: (value: string) => void;
  hasHealthProfile?: boolean;
  onOpenHealthProfile?: () => void;
  onLocationResolved?: (location: { location: string; placeId: string }) => void;
  selectedLearningMethod: LearningMethodId;
  selectedCourseId?: string;
  selectedCourseTitle?: string;
  selectedTopicId?: string;
  selectedTopicTitle?: string;
};

export default function ChatInterface({
  selectedLearningMethod,
  selectedCourseId,
  selectedCourseTitle,
  selectedTopicId,
  selectedTopicTitle
}: ChatInterfaceProps) {
  return (
    /* 1. Trả lại h-full & flex-1 cho Wrapper ngoài cùng */
    <div className="flex h-full w-full min-h-0 flex-1 flex-col gap-5 p-4 md:p-6 overflow-hidden">
      
      {/* 2. Đổi h-fit thành h-full min-h-0 flex-1 để ôm trọn viewport còn lại */}
      <div className="flex h-full min-h-0 flex-1 flex-col rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/40 overflow-hidden">
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <LearningContentPanel
            mode={selectedLearningMethod}
            selectedCourseId={selectedCourseId}
            selectedCourseTitle={selectedCourseTitle}
            selectedTopicId={selectedTopicId}
            selectedTopicTitle={selectedTopicTitle}
          />
        </div>
      </div>
    </div>
  );
}