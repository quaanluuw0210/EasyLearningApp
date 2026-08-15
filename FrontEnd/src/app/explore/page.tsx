
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { learningApi, CourseItem } from "@/lib/api";
import { Search, BookOpen, Layers, FileText, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";

export default function ExplorePage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    console.trace("🔥 getCourses CALLED");
    learningApi
      .getCourses()
      .then((data) => {
        if (!active) return;
        setCourses(data || []);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        if (!active) return;
        setError("Không thể tải danh sách khóa học. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Lọc danh sách khóa học theo từ khóa tìm kiếm
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(query) ||
        (course.description && course.description.toLowerCase().includes(query))
    );
  }, [courses, searchQuery]);

  return (
    <main className="min-h-screen bg-slate-50/80">
      <Navbar />

      {/* Đã giảm pt-28/32 xuống pt-20 để sát ngay dưới Navbar */}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        {/* Header Section */}
        <header className="mb-8">
          {/* Thanh tìm kiếm - Đã bỏ mt-6 để đẩy lên sát trên */}
          <div className="relative max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm khóa học theo tên..."
              className="w-full rounded-2xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Xóa
              </button>
            )}
          </div>
        </header>

        {/* Danh sách khóa học */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
                    <div className="h-4 w-full rounded bg-slate-100" />
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                </div>
                <div className="mt-6 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="col-span-full rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertCircle size={24} />
              </div>
              <p className="font-medium text-rose-800">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
              >
                <RefreshCw size={14} /> Tải lại trang
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={24} />
              </div>
              <p className="text-base font-medium text-slate-600">
                {searchQuery
                  ? `Không tìm thấy khóa học nào phù hợp với "${searchQuery}"`
                  : "Chưa có khóa học nào được cấu hình."}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {searchQuery ? "Thử tìm kiếm với từ khóa khác xem sao!" : "Vui lòng quay lại sau!"}
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <article
                key={course.courseId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-sky-600">
                        {course.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {course.description ?? "Không có mô tả cho khóa học này."}
                      </p>
                    </div>
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover ring-1 ring-slate-100"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                        <BookOpen size={28} />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700">
                      <Layers size={14} className="text-slate-400" />
                      {course.totalTopics ?? 0} chủ đề
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700">
                      <BookOpen size={14} className="text-slate-400" />
                      {course.totalWords ?? 0} từ vựng
                    </span>
                    {course.fileName && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-1.5 text-sky-700">
                        <FileText size={14} className="text-sky-500" />
                        {course.fileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-4">
                  <Link
                    href={`/app/${course.courseId}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 group-hover:bg-sky-600"
                  >
                    <span>Xem chi tiết khóa</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}