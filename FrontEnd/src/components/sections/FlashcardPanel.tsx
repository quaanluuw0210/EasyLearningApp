"use client";

import { ArrowLeft, ArrowRight, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { learningApi, VocabularyWithSRS } from "@/lib/api";
import {
  createProgressCache,
  FlashcardProgressCache,
  FlashcardProgressItem,
  getProgressCacheFromStorage,
  mergeProgressItem,
  saveProgressCacheToStorage,
  SYNC_ACTION_THRESHOLD,
  SYNC_INTERVAL_MS,
} from "@/lib/flashcardProgress";

type FlashcardPanelProps = {
  courseId?: string;
  courseTitle?: string;
  topicId?: string;
  topicTitle?: string;
};

type ReviewAction = "again" | "hard" | "good" | "easy";

const reviewQualityMap: Record<ReviewAction, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

const defaultProgressItem: FlashcardProgressItem = {
  vocabId: "",
  status: "new",
  repetitions: 0,
  interval: 0,
  easeFactor: 2.5,
  quality: null,
  lastReviewedAt: null,
  nextReviewAt: null,
  updatedAt: new Date().toISOString(),
};

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function FlashcardPanel({ courseId, courseTitle, topicId, topicTitle }: FlashcardPanelProps) {
  const { user } = useAuth();
  const userId = user?.uid ?? "guest";
  const [vocabList, setVocabList] = useState<VocabularyWithSRS[]>([]);
  const [progressCache, setProgressCache] = useState<FlashcardProgressCache | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncRef = useRef<number>(Date.now());
  const pendingSyncRef = useRef<number | null>(null);

  const hasValidSelection = Boolean(courseId && topicId);

  const loadVocabularies = useCallback(async () => {
    if (!hasValidSelection) {
      setVocabList([]);
      setProgressCache(null);
      setActiveIndex(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await learningApi.getVocabularies(courseId!, topicId!, userId === "guest" ? undefined : userId);
      setVocabList(data || []);

      const nowIso = new Date().toISOString();
      const localCache = getProgressCacheFromStorage(userId, courseId!, topicId!);
      const mergedItems: Record<string, FlashcardProgressItem> = {};
      const dirtySet = new Set(localCache?.dirtyItems || []);

      data.forEach((vocab) => {
        const localItem = localCache?.items?.[vocab.vocabId];
        const { item, localWins } = mergeProgressItem(localItem, vocab, nowIso);
        mergedItems[vocab.vocabId] = item;
        if (localWins) {
          dirtySet.add(vocab.vocabId);
        }
      });

      const nextCache = createProgressCache(
        userId,
        courseId!,
        topicId!,
        localCache?.currentIndex ?? 0,
        mergedItems,
        Array.from(dirtySet),
        localCache?.lastSyncedAt ?? null
      );

      setProgressCache(nextCache);
      setActiveIndex(nextCache.currentIndex);
      saveProgressCacheToStorage(nextCache);
      setStatusMessage("Đã tải dữ liệu flashcard.");
    } catch (err) {
      console.error(err);
      setError("Không thể tải flashcard cho chủ đề này.");
      setVocabList([]);
      setProgressCache(null);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, topicId, userId, hasValidSelection]);

  const syncProgressToServer = useCallback(async () => {
    if (!progressCache || !user || userId === "guest") {
      return;
    }

    const dirtyIds = progressCache.dirtyItems;
    if (!dirtyIds.length) {
      return;
    }

    setIsSyncing(true);
    setStatusMessage("Đang đồng bộ tiến trình...");

    const itemsToSync = dirtyIds
      .map((vocabId) => progressCache.items[vocabId])
      .filter((item): item is FlashcardProgressItem => Boolean(item));

    if (!itemsToSync.length) {
      setIsSyncing(false);
      return;
    }

    try {
      await learningApi.syncFlashcardProgress({
        user_id: userId,
        reviews: itemsToSync.map((item) => ({
          course_id: courseId ?? "",
          topic_id: topicId ?? "",
          vocab_id: item.vocabId,
          quality: item.quality ?? 0,
          reviewed_at: item.lastReviewedAt ?? new Date().toISOString(),
        })),
      });

      const syncedCache: FlashcardProgressCache = {
        ...progressCache,
        dirtyItems: [],
        lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setProgressCache(syncedCache);
      saveProgressCacheToStorage(syncedCache);
      lastSyncRef.current = Date.now();
      setStatusMessage("Đã đồng bộ thành công.");
    } catch (err) {
      console.error("Sync flashcard failed", err);
      setStatusMessage("Đã lưu trên thiết bị. Đồng bộ sẽ thử lại sau.");
    } finally {
      setIsSyncing(false);
    }
  }, [courseId, progressCache, topicId, user, userId]);

  const scheduleSync = useCallback(() => {
    if (pendingSyncRef.current) return;
    pendingSyncRef.current = window.setTimeout(() => {
      pendingSyncRef.current = null;
      syncProgressToServer();
    }, SYNC_INTERVAL_MS);
  }, [syncProgressToServer]);

  const updateProgressCache = useCallback(
    (updater: (current: FlashcardProgressCache) => FlashcardProgressCache) => {
      setProgressCache((current) => {
        if (!current) return current;
        const next = updater(current);
        saveProgressCacheToStorage(next);

        if (next.dirtyItems.length >= SYNC_ACTION_THRESHOLD) {
          syncProgressToServer();
        } else if (Date.now() - lastSyncRef.current >= SYNC_INTERVAL_MS) {
          syncProgressToServer();
        } else {
          scheduleSync();
        }

        return next;
      });
    },
    [scheduleSync, syncProgressToServer]
  );

  const handleReview = useCallback(
    (action: ReviewAction) => {
      if (!progressCache || vocabList.length === 0) return;
      const currentVocab = vocabList[activeIndex];
      if (!currentVocab) return;
      const quality = reviewQualityMap[action];
      const currentItem = progressCache.items[currentVocab.vocabId] ?? defaultProgressItem;
      const nowIso = new Date().toISOString();
      const updatedItem: FlashcardProgressItem = {
        ...currentItem,
        vocabId: currentVocab.vocabId,
        status: "learning",
        repetitions: currentItem.repetitions + 1,
        interval: currentItem.interval + 1,
        easeFactor: Math.max(1.3, currentItem.easeFactor + (quality === 5 ? 0.1 : quality === 4 ? 0.05 : quality === 3 ? 0 : -0.1)),
        quality,
        lastReviewedAt: nowIso,
        nextReviewAt: new Date(Date.now() + (currentItem.interval + 1) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: nowIso,
      };

      updateProgressCache((current) => {
        const nextItems = {
          ...current.items,
          [currentVocab.vocabId]: updatedItem,
        };
        const nextDirty = Array.from(new Set([...current.dirtyItems, currentVocab.vocabId]));
        return {
          ...current,
          items: nextItems,
          dirtyItems: nextDirty,
          updatedAt: nowIso,
        };
      });

      setFlipped(false);
      setStatusMessage(`Đã đánh giá: ${action}.`);

      if (activeIndex >= vocabList.length - 1) {
        syncProgressToServer();
      }
    },
    [activeIndex, progressCache, syncProgressToServer, updateProgressCache, vocabList]
  );

  const handlePrev = useCallback(() => {
    setFlipped(false);
    setActiveIndex((prev) => {
      const next = Math.max(0, prev - 1);
      if (progressCache) {
        updateProgressCache((current) => ({ ...current, currentIndex: next, updatedAt: new Date().toISOString() }));
      }
      return next;
    });
  }, [progressCache, updateProgressCache]);

  const handleNext = useCallback(() => {
    setFlipped(false);
    setActiveIndex((prev) => {
      const next = Math.min(vocabList.length - 1, prev + 1);
      if (progressCache) {
        updateProgressCache((current) => ({ ...current, currentIndex: next, updatedAt: new Date().toISOString() }));
      }
      return next;
    });
  }, [progressCache, updateProgressCache, vocabList.length]);

  const handleFlip = useCallback(() => setFlipped((prev) => !prev), []);

  useEffect(() => {
    loadVocabularies();
    return () => {
      if (pendingSyncRef.current) {
        window.clearTimeout(pendingSyncRef.current);
        pendingSyncRef.current = null;
      }
    };
  }, [loadVocabularies]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        syncProgressToServer();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    return () => window.removeEventListener("visibilitychange", handleVisibility);
  }, [syncProgressToServer]);

  const currentVocab = vocabList[activeIndex];

  const learnedCount = useMemo(
    () => vocabList.filter((vocab) => {
      const item = progressCache?.items[vocab.vocabId];
      return item !== undefined && item.quality !== null && item.quality >= 3;
    }).length,
    [progressCache, vocabList]
  );

  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Đang tải flashcard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 shadow-sm">
        <p className="text-sm text-rose-700">{error}</p>
      </div>
    );
  }

  if (!currentVocab) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Chọn một chủ đề và bật Flashcard để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{courseTitle || "Khóa học chưa chọn"}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{topicTitle || "Chủ đề chưa chọn"}</h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {learnedCount} / {vocabList.length} từ đã học
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-2xl overflow-visible">
        <button
          type="button"
          onClick={handleFlip}
          aria-label="Lật thẻ"
          className="relative h-96 w-full cursor-pointer rounded-[28px] bg-slate-50 text-left shadow-xl transition-transform duration-500 ease-out hover:shadow-2xl"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center justify-center">
              <span className="text-xs font-medium text-slate-400">Chạm để lật thẻ</span>
            </div>
            <div className="my-auto flex flex-col items-center justify-center text-center gap-4">
              <div className="space-y-3">
                <h3 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{currentVocab.word || "-"}</h3>
                {currentVocab.wordDisplay && <p className="text-base font-semibold text-teal-600">{currentVocab.wordDisplay}</p>}
                {currentVocab.phonetic && <p className="text-lg font-medium text-slate-500">{currentVocab.phonetic}</p>}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentVocab.word);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-500 hover:text-white"
              >
                <Volume2 size={16} /> Phát âm
              </button>
            </div>
            <div className="h-4" />
          </div>

          <div
            className="absolute inset-0 flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="my-auto space-y-4 text-center">
              <div>
                <p className="text-xl font-semibold text-slate-900">{currentVocab.meaningVi || "Không có nghĩa"}</p>
                {currentVocab.partOfSpeech && <p className="mt-2 text-sm font-medium uppercase tracking-[0.15em] text-slate-500">{currentVocab.partOfSpeech}</p>}
                {currentVocab.phonetic && <p className="mt-1 text-sm text-slate-500">{currentVocab.phonetic}</p>}
              </div>
              {currentVocab.exampleSentence ? (
                <div className="mx-auto max-w-md rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ví dụ</p>
                  <p className="mt-2 text-sm font-medium italic leading-relaxed text-slate-700">"{currentVocab.exampleSentence}"</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Không có ví dụ.</p>
              )}
            </div>
            <div className="h-4" />
          </div>
        </button>
      </div>

      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={activeIndex >= vocabList.length - 1}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tiếp theo <ArrowRight size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">{activeIndex + 1} / {vocabList.length}</p>
          <p className="text-slate-500">{progressCache?.dirtyItems.length ? `${progressCache.dirtyItems.length} mục chưa đồng bộ` : "Đã đồng bộ"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["again", "hard", "good", "easy"] as ReviewAction[]).map((action) => (
            <button
              type="button"
              key={action}
              onClick={() => handleReview(action)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                action === "again"
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : action === "hard"
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : action === "good"
                  ? "bg-sky-500 text-white hover:bg-sky-600"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {action === "again" ? "Again" : action === "hard" ? "Hard" : action === "good" ? "Good" : "Easy"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-600">
        <p>{statusMessage}</p>
        {isSyncing && <p className="mt-1 text-xs text-slate-500">Đang đồng bộ...</p>}
      </div>
    </div>
  );
}
