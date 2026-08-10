"use client";

import MainDashboard from "@/components/layout/MainDashboard";

type Props = {
  params: {
    courseId: string;
  };
};

export default function CoursePage({ params }: Props) {
  return <MainDashboard courseIdFromUrl={params.courseId} />;
}
