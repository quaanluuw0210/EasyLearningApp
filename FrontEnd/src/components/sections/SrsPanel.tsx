"use client";

import { CheckCircle2, PartyPopper, RefreshCw, Volume2, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { learningApi, VocabularyWithSRS } from "@/lib/api";
import {
  calculateAnkiCounts,
  calculateSm2,
  enqueueSrsReview,
  flushPendingSrsLogs,
  getIntervalLabelsForItem,
  RATING_INTERVAL_LABELS,
  RATING_TO_QUALITY,
  saveLocalSrsItemState,
  getLocalSrsItemState,
  isItemDue,
  SrsRating,
  SRS_DEBOUNCE_COUNT_THRESHOLD,
  SRS_DEBOUNCE_TIME_MS,
  VocabularyItem,
} from "@/lib/srsProgress";

export type { SrsRating, VocabularyItem };

export type SrsReviewPanelProps = {
  dueWords?: VocabularyItem[];
  allWords?: VocabularyItem[];
  courseId?: string;
  topicId?: string;
  onRate?: (word: VocabularyItem, rating: SrsRating) => void | Promise<void>;
  onFinish?: () => void;
  intervalLabels?: Partial<Record<SrsRating, string>>;
  autoPlayAudio?: boolean;
};

const RATING_CONFIG: {
  key: SrsRating;
  label: string;
  className: string;
  shortcut: string;
}[] = [
    { key: "again", label: "Again", className: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20", shortcut: "1" },
    { key: "hard", label: "Hard", className: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20", shortcut: "2" },
    { key: "good", label: "Good", className: "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20", shortcut: "3" },
    { key: "easy", label: "Easy", className: "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20", shortcut: "4" },
  ];

function speakText(text?: string) {
  if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}



export default function SrsPanel({
  dueWords = [],
  allWords = [],
  courseId,
  topicId,
  onRate,
  onFinish,
  intervalLabels,
  autoPlayAudio = false,
}: SrsReviewPanelProps) {
  const { user } = useAuth();
  const userId = user?.uid ?? "guest";

  const [queue, setQueue] = useState<VocabularyItem[]>([]);
  const [initialSessionItems, setInitialSessionItems] = useState<VocabularyItem[]>([]);
  const [sessionRatedIds, setSessionRatedIds] = useState<Set<string>>(new Set());
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [reviewedCount, setReviewedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExtraMode, setIsExtraMode] = useState<boolean>(false);
  const [sessionItems, setSessionItems] = useState<VocabularyItem[]>([]);
  const isInitializedRef = useRef<boolean>(false);
  const initializationKeyRef = useRef<string | null>(null);
  const actionCounterRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync handler with Local-First strategy
  const triggerBatchSync = useCallback(async () => {
    const requestedActionCount = actionCounterRef.current;
    try {
      const synced = await flushPendingSrsLogs(userId);
      if (synced && actionCounterRef.current === requestedActionCount) {
        actionCounterRef.current = 0;
      }
    } catch (err) {
      console.error("Batch SRS sync error:", err);
    }
  }, [userId]);

  // Schedule debounced sync (Debounce count >= 5 or Debounce time = 10s)
  const scheduleSync = useCallback(() => {
    actionCounterRef.current += 1;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (actionCounterRef.current >= SRS_DEBOUNCE_COUNT_THRESHOLD) {
      void triggerBatchSync();
    } else {
      debounceTimerRef.current = setTimeout(() => {
        void triggerBatchSync();
      }, SRS_DEBOUNCE_TIME_MS);
    }
  }, [triggerBatchSync]);


  const toIsoString = (val: any): string | undefined => {
    if (!val) return undefined;
    if (typeof val === "string") return val;
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "number") return new Date(val).toISOString();
    return undefined;
  };


  // Load vocabularies automatically if courseId & topicId are provided and dueWords is empty
  useEffect(() => {
    const initializationKey = `${courseId || ""}|${topicId || ""}|${userId}`;
    if (initializationKeyRef.current === initializationKey) return;

    initializationKeyRef.current = initializationKey;
    isInitializedRef.current = false;

    if (dueWords.length > 0 || allWords.length > 0) {
      const initial = dueWords.length > 0 ? dueWords : allWords;
      setQueue(initial);
      setInitialSessionItems(initial);
      setIsExtraMode(dueWords.length === 0 && allWords.length > 0);
      isInitializedRef.current = true;
      return;
    }

    if (courseId && topicId) {
      setIsLoading(true);
      learningApi
        .getVocabularies(courseId, topicId, userId)
        .then((data: VocabularyWithSRS[]) => {
          const mapped: VocabularyItem[] = (data || []).map((v) => {
            const vAny = v as any;
            const vocabId = v.vocabId || vAny.id || v.word;
            const meaningText = v.meaningVi || vAny.meaning || "";
            const srs = v.srs_progress;

            const localState = getLocalSrsItemState(courseId, topicId, userId, vocabId);
            let finalSrs = srs ? { ...srs } : null;

            // ✅ Dùng helper ép kiểu an toàn ngay từ đầu
            let finalNextReviewDate: string | undefined = toIsoString(srs?.nextReviewDate);
            let finalLastReviewedAt: string | undefined = toIsoString(srs?.lastReviewedAt);
            let finalInterval = srs?.interval ?? 0;
            let finalStep = srs?.repetitions ? 1 : 0;

            if (localState && localState.lastReviewedAt) {
              const localReviewTime = new Date(localState.lastReviewedAt).getTime();
              const backendReviewTime = finalLastReviewedAt ? new Date(finalLastReviewedAt).getTime() : 0;

              if (localReviewTime >= backendReviewTime) {
                // ✅ Dùng helper cho localState -> Không bao giờ bị lệch Type
                finalNextReviewDate = toIsoString(localState.nextReviewDate) || finalNextReviewDate;
                finalLastReviewedAt = toIsoString(localState.lastReviewedAt) || finalLastReviewedAt;
                finalInterval = localState.interval ?? finalInterval;
                finalStep = localState.step ?? finalStep;

                if (finalSrs) {
                  const parsedNext = toIsoString(localState.nextReviewDate);
                  const parsedLast = toIsoString(localState.lastReviewedAt);

                  if (parsedNext) finalSrs.nextReviewDate = parsedNext;
                  if (parsedLast) finalSrs.lastReviewedAt = parsedLast;

                  finalSrs.interval = localState.interval ?? finalInterval;
                  (finalSrs as any).step = localState.step ?? finalStep;
                }
              }
            }
            return {
              id: vocabId,
              word: v.word,
              partOfSpeech: v.partOfSpeech,
              meaning: meaningText,
              meaningVi: meaningText,
              phonetic: v.phonetic,
              exampleSentence: v.exampleSentence,
              step: finalStep,
              interval: finalInterval,
              easeFactor: srs?.ef ?? 2.5,
              nextReview: finalNextReviewDate,
              nextReviewDate: finalNextReviewDate,
              repetitions: srs?.repetitions ?? 0,
              lastReviewedAt: finalLastReviewedAt,
              quality: srs?.quality ?? 0,
              srs_progress: finalSrs,
              courseId: courseId,
              topicId: topicId,
            };
          });

          // Only add items to queue that are actually DUE
          const now = new Date();
          const emptySet = new Set<string>();
          const dueMapped = mapped.filter((item) => isItemDue(item, emptySet, now));

          setSessionItems(mapped);
          setInitialSessionItems(mapped);
          setQueue(dueMapped);
          isInitializedRef.current = true;
        })
        .catch((err) => {
          console.error("Lỗi khi tải từ vựng SRS:", err);
          initializationKeyRef.current = null;
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [dueWords, allWords, courseId, topicId, userId]);

  // Cleanup & flush pending logs on unmount or tab hide
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void triggerBatchSync();
      }
    };
    const handleBeforeUnload = () => {
      void triggerBatchSync();
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void triggerBatchSync();
    };
  }, [triggerBatchSync]);

  const currentWord = queue[0];
  const totalQueueCount = queue.length;

  const labels = useMemo(() => {
    if (!currentWord) return { ...RATING_INTERVAL_LABELS, ...intervalLabels };
    const ef = currentWord.easeFactor ?? currentWord.srs_progress?.ef ?? 2.5;
    const reps = currentWord.repetitions ?? currentWord.srs_progress?.repetitions ?? 0;
    const ivl = currentWord.interval ?? currentWord.srs_progress?.interval ?? 0;
    return { ...getIntervalLabelsForItem(ef, reps, ivl), ...intervalLabels };
  }, [currentWord, intervalLabels]);

  const counts = useMemo(() => {
    return calculateAnkiCounts(sessionItems, sessionRatedIds);
  }, [sessionItems, sessionRatedIds]);

  // Auto play audio when word changes
  useEffect(() => {
    if (currentWord?.word && autoPlayAudio) {
      speakText(currentWord.word);
    }
  }, [currentWord, autoPlayAudio]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRate = useCallback(
    (rating: SrsRating) => {
      if (!currentWord) return;

      const activeCourseId =
        currentWord.courseId || courseId || "default_course";
      const activeTopicId =
        currentWord.topicId || topicId || "default_topic";
      const quality = RATING_TO_QUALITY[rating];

      // 1. Compute SM2 locally (same logic as backend _calculate_sm2)
      const currentEf = currentWord.easeFactor ?? currentWord.srs_progress?.ef ?? 2.5;
      const currentReps = currentWord.repetitions ?? currentWord.srs_progress?.repetitions ?? 0;
      const currentInterval = currentWord.interval ?? currentWord.srs_progress?.interval ?? 0;
      const sm2 = calculateSm2(quality, currentEf, currentReps, currentInterval);

      const reviewedAtStr = new Date().toISOString();

      // 2. Enqueue for batch sync to backend
      enqueueSrsReview(userId, {
        courseId: activeCourseId,
        topicId: activeTopicId,
        vocabId: currentWord.id,
        rating,
        quality,
        reviewedAt: reviewedAtStr,
      });

      // 3. Save full SM2 state to localStorage for offline recovery
      saveLocalSrsItemState(
        activeCourseId,
        activeTopicId,
        userId,
        currentWord.id,
        {
          lastReviewedAt: reviewedAtStr,
          quality,
          easeFactor: sm2.ef,
          repetitions: sm2.repetitions,
          interval: sm2.interval,
          nextReviewDate: sm2.nextReviewDate,
          nextReview: sm2.nextReviewDate,
        }
      );

      // 4. Build updated word with full SM2 state for instant UI update
      const updatedWord: VocabularyItem = {
        ...currentWord,
        lastReviewedAt: reviewedAtStr,
        quality,
        easeFactor: sm2.ef,
        repetitions: sm2.repetitions,
        interval: sm2.interval,
        nextReviewDate: sm2.nextReviewDate,
        nextReview: sm2.nextReviewDate,
        srs_progress: {
          ef: sm2.ef,
          repetitions: sm2.repetitions,
          interval: sm2.interval,
          nextReviewDate: sm2.nextReviewDate,
          lastReviewedAt: reviewedAtStr,
          quality,
        },
      };

      setSessionItems((prevItems) =>
        prevItems.map((item) =>
          item.id === currentWord.id ? updatedWord : item
        )
      );

      onRate?.(currentWord, rating);
      scheduleSync();

      setSessionRatedIds((prev) => {
        const next = new Set(prev);
        next.add(currentWord.id);
        return next;
      });

      setReviewedCount((c) => c + 1);
      setIsFlipped(false);

      setQueue((prevQueue) => {
        const [, ...remaining] = prevQueue;

        let nextQueue: VocabularyItem[];

        if (rating === "again" || rating === "hard") {
          nextQueue = [
            ...remaining,
            updatedWord,
          ];
        } else {
          nextQueue = remaining;
        }

        if (nextQueue.length === 0) {
          setTimeout(() => triggerBatchSync(), 50);
        }

        return nextQueue;
      });
    },
    [
      currentWord,
      courseId,
      topicId,
      userId,
      onRate,
      scheduleSync,
      triggerBatchSync,
    ]
  );

  // Keyboard Shortcuts Handler — chỉ còn phím 1-4 để đánh giá sau khi đã lật.
  // Đã bỏ Space/Enter để lật thẻ theo yêu cầu (chỉ chạm/click vào thẻ mới lật).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (totalQueueCount === 0 || !isFlipped) return;
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "1") {
        e.preventDefault();
        handleRate("again");
      } else if (e.key === "2") {
        e.preventDefault();
        handleRate("hard");
      } else if (e.key === "3") {
        e.preventDefault();
        handleRate("good");
      } else if (e.key === "4") {
        e.preventDefault();
        handleRate("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalQueueCount, isFlipped, handleRate]);

  // Restart session or review remaining items
  const startEarlyReview = () => {
    if (initialSessionItems.length === 0) return;
    setQueue(initialSessionItems);
    setIsExtraMode(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-[28px] border border-slate-200/80 bg-white p-12 shadow-sm min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Đang tải thẻ ôn tập SRS...</p>
        </div>
      </div>
    );
  }

  // Completion screen when queue is finished
  if (totalQueueCount === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-5 rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 p-8 text-center shadow-sm overflow-y-auto min-h-[380px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
          <PartyPopper size={34} />
        </div>

        <div className="space-y-1.5 max-w-md">
          <h3 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {isExtraMode ? "Hoàn thành lượt ôn bổ sung!" : "Chúc mừng! Bạn đã ôn xong hôm nay!"}
          </h3>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <p className="text-sm text-slate-500">
            Muốn học thêm? Hãy chuyển sang <span className="font-bold text-emerald-600">Flashcard </span>
            hoặc các hoạt động học tập khác nhé.
          </p>

          {onFinish && (
            <button
              type="button"
              onClick={onFinish}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95 cursor-pointer"
            >
              Quay lại
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden p-2 select-none">
      {/* Header phụ học tập */}
      <div className="flex w-full items-center justify-between gap-3 px-1">
        {/* Giải thích nhãn - Ẩn trên mobile (hidden), Chỉ hiện từ màn hình sm trở lên (sm:flex) */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 sm:text-sm">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Từ mới</span>
          </span>

          <span className="text-slate-300">•</span>

          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Đã đến hạn / Cần ôn</span>
          </span>

          <span className="text-slate-300">•</span>

          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Chưa đến lịch</span>
          </span>
        </div>

        {/* Bộ đếm - Tự động đẩy sang phải trên mobile nhờ `ml-auto sm:ml-0` */}
        <div className="ml-auto sm:ml-0 flex shrink-0 items-center gap-1.5 rounded-2xl bg-white px-3.5 py-1.5 shadow-sm ring-1 ring-slate-200/80 font-mono text-xs sm:text-sm font-extrabold">
          <span
            className="rounded-lg bg-blue-50 px-2 py-0.5 text-blue-600 ring-1 ring-blue-200"
            title="Từ mới"
          >
            {counts.newCount}
          </span>

          <span className="text-slate-300 font-normal">+</span>

          <span
            className="rounded-lg bg-rose-50 px-2 py-0.5 text-rose-600 ring-1 ring-rose-200"
            title="Đã đến hạn / Cần ôn"
          >
            {counts.learningCount}
          </span>

          <span className="text-slate-300 font-normal">+</span>

          <span
            className="rounded-lg bg-emerald-50 px-2 py-0.5 text-emerald-600 ring-1 ring-emerald-200"
            title="Chưa đến lịch"
          >
            {counts.reviewCount}
          </span>
        </div>
      </div>

      {/* 2. Nội dung Flashcard lật 3D — tự co theo chiều cao khung, không tạo scrollbar */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden py-1">
        <div className="relative h-full w-full max-w-xl perspective-1200">
          <button
            type="button"
            onClick={handleFlip}
            aria-label="Lật thẻ"
            className="relative h-full max-h-[384px] w-full cursor-pointer rounded-[32px] bg-transparent text-left transition-all duration-300 ease-out hover:-translate-y-1"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* MẶT TRƯỚC: Từ vựng + Loại từ */}
            <div
              className="absolute inset-0 flex flex-col justify-between rounded-[32px] bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="flex justify-center text-xs font-medium text-slate-400">
                <span>Chạm để lật thẻ</span>
              </div>

              <div className="my-auto flex flex-col items-center justify-center gap-3 text-center">
                <div className="space-y-1">
                  {/* Từ vựng + Loại từ (Ví dụ: satisfy (v)) */}
                  <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                    {currentWord?.word || "-"}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-500 sm:text-base">
                    {currentWord?.partOfSpeech && (
                      <span className="font-semibold text-emerald-600/90">
                        ({currentWord.partOfSpeech})
                      </span>
                    )}
                    {currentWord?.phonetic && <span>{currentWord.phonetic}</span>}
                  </div>
                </div>

                {/* Nút phát âm */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakText(currentWord?.word);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
                >
                  <Volume2 size={16} /> Nghe phát âm
                </button>
              </div>

              <div className="flex justify-center text-xs font-medium text-slate-400">
                <span>Đang học / Ôn tập</span>
              </div>
            </div>

            {/* MẶT SAU: Nghĩa Tiếng Việt / Ví dụ minh họa */}
            <div
              className="absolute inset-0 flex flex-col justify-between rounded-[32px] bg-gradient-to-b from-emerald-50/30 to-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-emerald-100/50"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="flex justify-center text-xs font-medium text-slate-400">
                <span>Chạm để xoay lại</span>
              </div>

              <div className="my-auto space-y-3 text-center">
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {currentWord?.meaning || currentWord?.meaningVi || "Chưa có nghĩa"}
                </p>

                {currentWord?.exampleSentence && (
                  <div className="mx-auto max-w-md rounded-2xl bg-emerald-50/40 p-3.5 ring-1 ring-emerald-100/60">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/80">
                      Ví dụ minh họa
                    </p>
                    <p className="mt-1 text-xs font-medium italic text-slate-700 sm:text-sm leading-relaxed">
                      "{currentWord.exampleSentence}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-center text-xs font-medium text-emerald-600/90">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={14} /> Chọn 1 trong 4 nút đánh giá bên dưới (Phím 1, 2, 3, 4)
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Điều hướng BẮT BUỘC theo cơ chế Anki (Không có nút Next/Back).
          Trước khi lật: không hiện gì thêm (chạm thẻ để lật).
          Sau khi lật: hiện 4 nút đánh giá mức độ nhớ. */}
      {isFlipped && (
        <div className="mx-auto w-full shrink-0 max-w-xl">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {RATING_CONFIG.map((rating) => (
              <button
                key={rating.key}
                type="button"
                onClick={() => handleRate(rating.key)}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-3 text-xs font-bold text-white shadow-md transition active:scale-[0.98] cursor-pointer sm:text-sm ${rating.className}`}
              >
                <span className="text-[10px] font-semibold text-white/80">
                  {labels[rating.key]} ({rating.shortcut})
                </span>
                <span className="font-extrabold">{rating.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

