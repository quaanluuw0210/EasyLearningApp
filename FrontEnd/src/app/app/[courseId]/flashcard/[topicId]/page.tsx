"use client";

import MainDashboard from "@/components/layout/MainDashboard";

type Props = {
  params: {
    courseId: string;
    topicId: string;
  };
};

export default function FlashcardTopicPage({ params }: Props) {
  return (
    <MainDashboard
      courseIdFromUrl={params.courseId}
      topicIdFromUrl={params.topicId}
      modeFromUrl="flashcard"
    />
  );
}
