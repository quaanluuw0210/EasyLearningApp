"use client";

import type { LearningMethodId } from "@/lib/learningMockData";
import FlashcardPanel from "@/components/sections/FlashcardPanel";
import SrsPanel from "@/components/sections/SrsPanel";
import VocabPanel from "@/components/sections/VocabPanel";

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
  if (mode === "flashcard") {
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
    return <SrsPanel />;
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
