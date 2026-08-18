"use client";

import { useAuth } from "@/context/AuthContext";
import type { LearningMethodId } from "@/lib/learningMockData";
import FlashcardPanel from "@/components/sections/FlashcardPanel";
import SrsPanel from "@/components/sections/SrsPanel";
import VocabPanel from "@/components/sections/VocabPanel";
import MatchingGamePanel from "@/components/sections/MatchingGamePanel";
import { LogIn } from "lucide-react";
import Link from "next/link";
type LearningContentPanelProps = {
  mode: LearningMethodId;
  selectedCourseId?: string;
  selectedCourseTitle?: string;
  selectedTopicId?: string;
  selectedTopicTitle?: string;
};

export default function LearningContentPanel({
  mode,
  selectedCourseId,
  selectedCourseTitle,
  selectedTopicId,
  selectedTopicTitle
}: LearningContentPanelProps) {
  const { user } = useAuth();

  if (mode === "flashcard") {
    if (!user) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-blue-50/50 to-slate-50/50 p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25">
            <Link
              href="/login"
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:bg-blue-600 active:scale-95"
            >
              <LogIn size={32} />
            </Link>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Đăng nhập để dùng Flashcard
            </h3>
            <p className="text-sm text-slate-600">
              Vui lòng đăng nhập để sử dụng phương pháp học Flashcard. Bạn có thể xem danh sách từ vựng mà không cần đăng nhập.
            </p>
          </div>
        </div>
      );
    }
    return (
      <FlashcardPanel
        courseId={selectedCourseId}
        courseTitle={selectedCourseTitle}
        topicId={selectedTopicId}
        topicTitle={selectedTopicTitle}
      />
    );
  }

  if (mode === "srs") {
    if (!user) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-purple-50/50 to-slate-50/50 p-8 text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/25">
           <Link
              href="/login"
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:bg-blue-600 active:scale-95"
            >
              <LogIn size={32} />
            </Link>
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-xl font-bold text-slate-900">
              Đăng nhập để dùng Học ngắt quãng
            </h3>
            <p className="text-sm text-slate-600">
              Vui lòng đăng nhập để sử dụng phương pháp học SRS. Bạn có thể xem danh sách từ vựng mà không cần đăng nhập.
            </p>
          </div>
        </div>
      );
    }
    return (
      <SrsPanel
        courseId={selectedCourseId}
        topicId={selectedTopicId}
      />
    );
  }

  if (mode === "matchingGame") {
    return (
      <MatchingGamePanel
        courseId={selectedCourseId}
        courseTitle={selectedCourseTitle}
        topicId={selectedTopicId}
        topicTitle={selectedTopicTitle}
      />
    );
  }

  return (
    <VocabPanel
      courseId={selectedCourseId}
      courseTitle={selectedCourseTitle}
      topicId={selectedTopicId}
      topicTitle={selectedTopicTitle}
    />
  );
}