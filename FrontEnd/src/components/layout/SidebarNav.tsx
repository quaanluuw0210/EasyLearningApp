"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Plus, MessageSquare, LogOut, HeartPulse, User, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardState } from "./MainDashboard";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Toast, { ToastType } from "@/components/ui/Toast";
import { learningApi, CourseItem, TopicItem } from "@/lib/api";

type ChatSession = {
  id: string;
  title: string;
  updated_at: string;
};

type SidebarNavProps = {
  state: DashboardState;
  onStateChange: (state: DashboardState) => void;
  onOpenProfileSettings: () => void;
  onOpenLocationPrompt?: () => void;
  onTabChange?: (tab: "itinerary" | "detail") => void;
  chatHistory?: ChatSession[];
  currentChatId?: string | null;
  onNewChat?: () => void;
  onChatSelect?: (id: string) => void;
  onDeleteChat?: (id: string) => void;
  selectedCourseId?: string;
  selectedTopicId?: string;
  onCourseSelect?: (courseId: string, courseTitle: string) => void;
  onTopicSelect?: (topicId: string, topicTitle: string) => void;
};

export default function SidebarNav({
  state,
  onStateChange,
  onOpenProfileSettings,
  onOpenLocationPrompt,
  onTabChange,
  chatHistory = [],
  currentChatId,
  onNewChat,
  onChatSelect,
  onDeleteChat,
  selectedCourseId,
  selectedTopicId,
  onCourseSelect,
  onTopicSelect
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
  const currentTopic = topics.find((topic) => topic.topicId === selectedTopicId) || topics[0];

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true);
        setFetchError(null);
        const data = await learningApi.getCourses();
        if (!active) return;
        setCourses(data);
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

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, chatId });
  };

  const handleConfirmDelete = () => {
    onDeleteChat?.(deleteConfirm.chatId);
    setToast({
      show: true,
      type: "success",
      message: "Đã xóa cuộc trò chuyện thành công"
    });
  };

  const handleCourseClick = (course: CourseItem) => {
    onCourseSelect?.(course.courseId, course.title);
  };

  const handleTopicClick = (topic: TopicItem) => {
    onTopicSelect?.(topic.topicId, topic.title);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-5">
        {user && (
          <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/55 shadow-sm">
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {isLoadingCourses ? "Đang tải bộ từ vựng..." : currentCourse?.title || "Chưa chọn bộ từ vựng"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {currentCourse?.description || "Chọn bộ từ vựng để xem chủ đề và từ vựng."}
                </p>
              </div>
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-700 whitespace-nowrap">
                {topics.length} chủ đề
              </span>
            </div>
            <div className="app-sidebar-scrollbar min-h-0 flex-1 space-y-4 overflow-y-scroll px-4 py-4">
              {fetchError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {fetchError}
                </div>
              ) : null}

              {courses.length > 1 && (
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Chọn bộ từ vựng</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {courses.map((course) => {
                      const isActive = course.courseId === selectedCourseId;
                      return (
                        <button
                          key={course.courseId}
                          type="button"
                          onClick={() => handleCourseClick(course)}
                          className={`rounded-2xl border px-3 py-2 text-sm transition ${
                            isActive
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700"
                          }`}
                        >
                          {course.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If a selectedCourseId prop is provided but courses just loaded, ensure topics load and selection is propagated */}
              

              <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Chủ đề</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {topics.length} mục
                  </span>
                </div>
                {isLoadingTopics ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Đang tải chủ đề...
                  </div>
                ) : topics.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Chưa có chủ đề nào trong bộ từ vựng này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topics.map((topic) => {
                      const isActive = topic.topicId === selectedTopicId;
                      return (
                        <button
                          key={topic.topicId}
                          type="button"
                          onClick={() => handleTopicClick(topic)}
                          className={`w-full rounded-3xl border px-4 py-3 text-left text-sm transition ${
                            isActive
                              ? "border-teal-500 bg-teal-50 text-teal-700"
                              : "border-slate-200 bg-white text-slate-700 hover:border-teal-500"
                          }`}
                        >
                          <span className="font-semibold">{topic.title}</span>
                          {topic.totalWords ? (
                            <span className="mt-1 block text-[11px] text-slate-500">
                              {topic.totalWords} từ
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Xác nhận xóa?"
        message="Bạn sẽ không thể khôi phục lại cuộc trò chuyện này sau khi xóa."
        confirmText="Xóa vĩnh viễn"
        cancelText="Để sau"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, chatId: "" })}
      />

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
