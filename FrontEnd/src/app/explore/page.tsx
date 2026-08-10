"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { learningApi, CourseItem } from "@/lib/api";

export default function ExplorePage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

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

  return (
    <main className="min-h-screen bg-slate-50/80">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <header className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-100/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            Khám phá kiến thức
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Các khóa học từ vựng hiện có
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-600">
            Duyệt các bộ từ vựng được tổ chức theo từng khóa và chủ đề. Nhấp vào khóa học để mở MainDashboard với bộ từ đã chọn.
          </p>
        </header>

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
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
                ⚠️
              </div>
              <p className="font-medium text-rose-800">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 transition"
              >
                Tải lại trang
              </button>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <p className="text-base font-medium text-slate-600">Chưa có khóa học nào được cấu hình.</p>
              <p className="mt-1 text-sm text-slate-400">Vui lòng quay lại sau!</p>
            </div>
          ) : (
            courses.map((course) => (
              <article
                key={course.courseId}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
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
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-2xl text-sky-600">
                        📘
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700">
                      📂 {course.totalTopics ?? 0} chủ đề
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-slate-700">
                      📝 {course.totalWords ?? 0} từ vựng
                    </span>
                    {course.fileName && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-sky-50 px-3 py-1.5 text-sky-700">
                        📄 {course.fileName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    href={`/app/${course.courseId}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition duration-200 group-hover:bg-sky-600"
                  >
                    <span>Xem chi tiết khóa</span>
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
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