"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Toast, { ToastType } from "@/components/ui/Toast";
import { learningApi, CourseItem, TopicItem } from "@/lib/api";

type SidebarNavProps = {
  onOpenProfileSettings: () => void;
  onTabChange?: (tab: "itinerary" | "detail") => void;
  currentChatId?: string | null;
  selectedCourseId?: string;
  selectedTopicId?: string;
  onCourseSelect?: (courseId: string, courseTitle: string) => void;
  onTopicSelect?: (topicId: string, topicTitle: string) => void;
};

export default function SidebarNav({
  onOpenProfileSettings,
  onTabChange,
  currentChatId,
  selectedCourseId,
  selectedTopicId,
  onCourseSelect,
  onTopicSelect,
}: SidebarNavProps) {
  const { user, logout } = useAuth();

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; chatId: string }>({
    isOpen: false,
    chatId: ""
  });
  const [toast, setToast] = useState<{ show: boolean; type: ToastType; message: string }>({
    show: false,
    type: "success",
    message: ""
  });
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const currentCourse = courses.find((course) => course.courseId === selectedCourseId) || courses[0];

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        setFetchError(null);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setFetchError("Không thể tải danh sách bộ từ vựng. Vui lòng thử lại sau.");
      } finally {
        if (active) setIsLoadingCourses(false);
      }
    };

    loadCourses();
    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (!selectedCourseId) return;

    let active = true;

    const loadTopics = async () => {
      try {
        setIsLoadingTopics(true);
        setFetchError(null);
        const data = await learningApi.getTopics(selectedCourseId);
        if (!active) return;
        setTopics(data);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setFetchError("Không thể tải danh sách chủ đề. Vui lòng thử lại sau.");
      } finally {
        if (active) setIsLoadingTopics(false);
      }
    };

    loadTopics();
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (!topics.length) return;
    if (!selectedTopicId || !topics.some((topic) => topic.topicId === selectedTopicId)) {
      const firstTopic = topics[0];
      onTopicSelect?.(firstTopic.topicId, firstTopic.title);
    }
  }, [topics, selectedTopicId, onTopicSelect]);


  const handleTopicClick = (topic: TopicItem) => {
    onTopicSelect?.(topic.topicId, topic.title);
  };
  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-5">
        {
          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/55 shadow-sm">
            {/* 2. Danh sách Chủ đề (Scroll Area) */}
            <div className="app-sidebar-scrollbar min-h-0 flex-1 space-y-4 overflow-y-scroll px-4 py-4">
              {fetchError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700">
                  {fetchError}
                </div>
              )}

              {/* Phần tiêu đề danh sách - Giờ nằm trực tiếp trên sidebar */}
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-sm font-bold text-slate-900">Danh sách chủ đề</p>
                <span className="text-[11px] font-semibold text-slate-400">
                  {topics.length} mục
                </span>
              </div>

              {isLoadingTopics ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Đang tải chủ đề...
                </div>
              ) : topics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  Chưa có chủ đề nào trong bộ từ vựng này.
                </div>
              ) : (
                /* Đổi space-y-2 thành space-y-1 cho gọn và hiện đại hơn */
                <div className="space-y-1">
                  {topics.map((topic) => {
                    const isActive = topic.topicId === selectedTopicId;
                    return (
                      <button
                        key={topic.topicId}
                        type="button"
                        onClick={() => handleTopicClick(topic)}
                        /* Đã loại bỏ border hoàn toàn, dùng màu nền phẳng dịu mắt */
                        className={`w-full rounded-xl px-3.5 py-2.5 text-left text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-800 font-semibold shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                       <div className="flex items-start justify-between gap-2">
                        <span className="whitespace-normal break-words text-sm font-medium leading-snug">
                          {topic.title}
                        </span>
                        {topic.totalWords ? (
                          <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium transition ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {topic.totalWords} từ
                          </span>
                        ) : null}
                      </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        }
      </div>
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        position="bottom-left"
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
