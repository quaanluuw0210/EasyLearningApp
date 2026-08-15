"use client";

import { ArrowLeft, ArrowRight, Volume2, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FlashcardVocabularyItem, learningApi } from "@/lib/api";
import {
  FLASHCARD_SYNC_DEBOUNCE_MS,
  FLASHCARD_SYNC_ACTION_THRESHOLD,
  getFlashcardProgressFromStorage,
  saveFlashcardProgressToStorage,
} from "@/lib/flashcardProgress";

type FlashcardPanelProps = {
  courseId?: string;
  courseTitle?: string;
  topicId?: string;
  topicTitle?: string;
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

export default function FlashcardPanel({
  courseId,
  courseTitle,
  topicId,
  topicTitle,
}: FlashcardPanelProps) {
  const { user } = useAuth();
  const userId = user?.uid ?? "guest";

  const [vocabList, setVocabList] = useState<FlashcardVocabularyItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [viewedCards, setViewedCards] = useState<number[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation states for Page Turn
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationClass, setAnimationClass] = useState<string>("");
  const animTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync ref tracking
  const actionCounterRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestStateRef = useRef({ currentCardIndex: 0, viewedCards: [] as number[] });
  const lastSyncedStateRef = useRef<string | null>(null);
  const syncInFlightRef = useRef<Promise<void> | null>(null);
  const dirtyRef = useRef(false);
  const loadVersionRef = useRef(0);

  // Update latestStateRef whenever state changes
  useEffect(() => {
    latestStateRef.current = { currentCardIndex, viewedCards };
  }, [currentCardIndex, viewedCards]);


  const [jumpInput, setJumpInput] = useState("");

  const hasValidSelection = Boolean(courseId && topicId);

  // Sync progress to backend/Firebase
  const syncToServer = useCallback(async () => {
    if (!courseId || !topicId || !user || userId === "guest") return;
    if (!dirtyRef.current || actionCounterRef.current === 0) return;
    if (syncInFlightRef.current) return syncInFlightRef.current;

    const { currentCardIndex: idx, viewedCards: viewed } = latestStateRef.current;
    const stateKey = JSON.stringify({ currentCardIndex: idx, viewedCards: viewed });
    if (stateKey === lastSyncedStateRef.current) {
      dirtyRef.current = false;
      actionCounterRef.current = 0;
      return;
    }

    const request = learningApi
      .saveTopicFlashcardProgress(courseId, topicId, {
        user_id: userId,
        flashcardCurrentIndex: idx,
        flashcardViewedCards: viewed,
        flashcardUpdatedAt: new Date().toISOString(),
      })
      .then(() => {
        lastSyncedStateRef.current = stateKey;
        if (JSON.stringify(latestStateRef.current) === stateKey) {
          dirtyRef.current = false;
          actionCounterRef.current = 0;
        }
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ Flashcard progress:", err);
      })
      .finally(() => {
        syncInFlightRef.current = null;
        if (dirtyRef.current && actionCounterRef.current > 0) {
          debounceTimerRef.current = setTimeout(() => {
            void syncToServer();
          }, FLASHCARD_SYNC_DEBOUNCE_MS);
        }
      });

    syncInFlightRef.current = request;
    return request;
  }, [courseId, topicId, user, userId]);


  
  // Schedule debounced sync
  const scheduleSync = useCallback(() => {
    dirtyRef.current = true;
    actionCounterRef.current += 1;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Force sync if actions >= 5 or debounce after 3s
    if (actionCounterRef.current >= FLASHCARD_SYNC_ACTION_THRESHOLD) {
      void syncToServer();
    } else {
      debounceTimerRef.current = setTimeout(() => {
        void syncToServer();
      }, FLASHCARD_SYNC_DEBOUNCE_MS);
    }
  }, [syncToServer]);

  // Update progress in LocalStorage and schedule sync
  const updateProgress = useCallback(
    (newIndex: number, newViewed: number[]) => {
      if (!courseId || !topicId) return;

      const dataToSave = {
        currentCardIndex: newIndex,
        viewedCards: newViewed,
        updatedAt: new Date().toISOString(),
      };

      saveFlashcardProgressToStorage(courseId, topicId, dataToSave, userId);
      latestStateRef.current = { currentCardIndex: newIndex, viewedCards: newViewed };
      scheduleSync();
    },
    [courseId, topicId, userId, scheduleSync]
  );

  // Load vocabularies & restore progress
  const loadData = useCallback(async () => {
    const loadVersion = ++loadVersionRef.current;
    if (!hasValidSelection) {
      setVocabList([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setViewedCards([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await learningApi.getFlashcardPage(courseId!, topicId!, userId);
      const items = page.vocabularies || [];
      if (loadVersion !== loadVersionRef.current) return;
      setVocabList(items);

      if (items.length === 0) {
        setIsLoading(false);
        return;
      }

      const localProgress = getFlashcardProgressFromStorage(courseId!, topicId!, userId);
      let initialIndex = Math.min(page.flashcardCurrentIndex || 0, items.length - 1);
      let initialViewed: number[] = Array.isArray(page.flashcardViewedCards) && page.flashcardViewedCards.length > 0
        ? [...page.flashcardViewedCards]
        : [0];

      if (localProgress) {
        initialIndex = Math.min(localProgress.currentCardIndex, items.length - 1);
        initialViewed = Array.from(new Set([...localProgress.viewedCards, ...initialViewed, initialIndex]));
      }

      setCurrentCardIndex(initialIndex);
      setIsFlipped(false);
      setViewedCards(initialViewed);

      if (!localProgress) {
        saveFlashcardProgressToStorage(
          courseId!,
          topicId!,
          {
            currentCardIndex: initialIndex,
            viewedCards: initialViewed,
            updatedAt: new Date().toISOString(),
          },
          userId
        );
      }

      if (user && userId !== "guest") {
        setViewedCards((prevViewed) => {
          const merged = Array.from(new Set([...prevViewed, ...initialViewed])).sort((a, b) => a - b);
          setCurrentCardIndex((prevIdx) => {
            const finalIdx = actionCounterRef.current > 0 ? prevIdx : initialIndex;
            saveFlashcardProgressToStorage(
              courseId!,
              topicId!,
              {
                currentCardIndex: finalIdx,
                viewedCards: merged,
                updatedAt: new Date().toISOString(),
              },
              userId
            );
            return finalIdx;
          });
          return merged;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách từ vựng cho chủ đề này.");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, topicId, userId, hasValidSelection, user]);

const handleJumpToCard = useCallback(() => {
  if (vocabList.length === 0 || isAnimating) return;

  const cardNumber = Number(jumpInput);

  if (!Number.isInteger(cardNumber)) return;

  if (cardNumber < 1 || cardNumber > vocabList.length) {
    return;
  }

  const targetIndex = cardNumber - 1;

  setIsFlipped(false);
  setCurrentCardIndex(targetIndex);

  setViewedCards((prev) => {
    const nextViewed = prev.includes(targetIndex)
      ? prev
      : [...prev, targetIndex].sort((a, b) => a - b);

    updateProgress(targetIndex, nextViewed);

    return nextViewed;
  });

  setJumpInput("");
}, [
  jumpInput,
  vocabList.length,
  isAnimating,
  updateProgress,
]);
  useEffect(() => {
    loadData();
    return () => {
      loadVersionRef.current += 1;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    };
  }, [loadData]);

  // Flush remaining progress on unmount or page hide
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void syncToServer();
      }
    };
    const handleBeforeUnload = () => {
      void syncToServer();
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [syncToServer]);

  // Handle card flipping (Front ↔ Back)
  const handleFlip = useCallback(() => {
    if (isAnimating) return; // Prevent flip during page turn animation
    setIsFlipped((prev) => !prev);

    // Mark current card as viewed when flipped
    setViewedCards((prev) => {
      if (!prev.includes(currentCardIndex)) {
        const nextViewed = [...prev, currentCardIndex].sort((a, b) => a - b);
        updateProgress(currentCardIndex, nextViewed);
        return nextViewed;
      }
      return prev;
    });
  }, [currentCardIndex, isAnimating, updateProgress]);

  // Handle Next card with Page-Turn Animation
  const handleNext = useCallback(() => {
    if (vocabList.length === 0 || isAnimating) return;
    const nextIdx = Math.min(vocabList.length - 1, currentCardIndex + 1);
    if (nextIdx === currentCardIndex) return;

    setIsAnimating(true);
    setAnimationClass("animate-page-turn-next");

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);

    animTimeoutRef.current = setTimeout(() => {
      setIsFlipped(false); // Reset isFlipped to false
      setCurrentCardIndex(nextIdx);

      setViewedCards((prev) => {
        const nextViewed = prev.includes(nextIdx) ? prev : [...prev, nextIdx].sort((a, b) => a - b);
        updateProgress(nextIdx, nextViewed);
        return nextViewed;
      });

      setAnimationClass("animate-page-enter-next");

      enterTimeoutRef.current = setTimeout(() => {
        setAnimationClass("");
        setIsAnimating(false);
      }, 180);
    }, 380);
  }, [currentCardIndex, vocabList.length, isAnimating, updateProgress]);

  // Handle Previous card with Page-Turn Animation
  const handlePrev = useCallback(() => {
    if (vocabList.length === 0 || isAnimating) return;
    const prevIdx = Math.max(0, currentCardIndex - 1);
    if (prevIdx === currentCardIndex) return;

    setIsAnimating(true);
    setAnimationClass("animate-page-turn-prev");

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);

    animTimeoutRef.current = setTimeout(() => {
      setIsFlipped(false); // Reset isFlipped to false
      setCurrentCardIndex(prevIdx);

      setViewedCards((prev) => {
        const nextViewed = prev.includes(prevIdx) ? prev : [...prev, prevIdx].sort((a, b) => a - b);
        updateProgress(prevIdx, nextViewed);
        return nextViewed;
      });

      setAnimationClass("animate-page-enter-prev");

      enterTimeoutRef.current = setTimeout(() => {
        setAnimationClass("");
        setIsAnimating(false);
      }, 180);
    }, 380);
  }, [currentCardIndex, vocabList.length, isAnimating, updateProgress]);

  // Mobile swipe gestures
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (deltaX < -50) {
      handleNext();
    } else if (deltaX > 50) {
      handlePrev();
    }
  };

  const currentVocab = vocabList[currentCardIndex];
  const viewedCount = viewedCards.length;
  const totalCount = vocabList.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-[28px] border border-slate-200/80 bg-white p-12 shadow-sm min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Đang tải flashcard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button
          type="button"
          onClick={loadData}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!currentVocab || totalCount === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Vui lòng chọn một chủ đề trong thanh bên để bắt đầu xem Flashcard.
        </p>
      </div>
    );
  }
return (
  <div className="space-y-6 select-none">

    {/* 1. Header Navigation */}
    <div className="flex w-full items-center justify-between">
      <div className="text-xs font-semibold text-slate-500 sm:text-sm">
        Đã xem: {viewedCount}/{totalCount}
      </div>

      {/* ĐÃ SỬA: Tông xanh lá nhạt dịu mắt cho Badge nhảy thẻ */}
      <div className="flex items-center rounded-xl bg-emerald-50/80 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:px-3 sm:py-1.5">
        <span className="mr-1">Thẻ</span>
        <input
          type="number"
          min={1}
          max={totalCount}
          value={jumpInput}
          placeholder={`${currentCardIndex + 1}`}
          disabled={isAnimating}
          onChange={(e) => setJumpInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJumpToCard();
          }}
          className="w-7 bg-transparent p-0 text-center text-xs font-bold text-emerald-700 outline-none placeholder:text-emerald-700 sm:w-8"
        />
        <span className="mx-0.5 text-emerald-500/80">/ {totalCount}</span>
      </div>
    </div>

    {/* 2. Main 3D Flip Card Container */}
    <div
      className="relative mx-auto w-full max-w-xl overflow-visible perspective-1200"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`w-full ${animationClass}`}>
        <button
          type="button"
          onClick={handleFlip}
          aria-label="Lật thẻ"
          className="relative h-80 w-full cursor-pointer rounded-[32px] bg-transparent text-left transition-all duration-300 ease-out hover:-translate-y-1 sm:h-96"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-[32px] bg-white p-7 shadow-xl shadow-slate-200/50 ring-1 ring-slate-100"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Header nhỏ phía trên */}
            <div className="flex justify-center text-xs font-medium text-slate-400">
              <span>Chạm để lật thẻ</span>
            </div>

            {/* Nội dung chính căn giữa */}
            <div className="my-auto flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-1.5">
                {/* Từ vựng chính */}
                <h3 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                  {currentVocab.word || "-"}
                </h3>

                {/* ĐÃ SỬA: Từ loại (v) màu xanh dịu */}
                <div className="flex items-center justify-center gap-1.5 text-base font-medium text-slate-500">
                  {currentVocab.partOfSpeech && (
                    <span className="font-semibold text-emerald-600/90">
                      ({currentVocab.partOfSpeech})
                    </span>
                  )}
                  {currentVocab.phonetic && (
                    <span>{currentVocab.phonetic}</span>
                  )}
                </div>
              </div>

              {/* ĐÃ SỬA: Nút Nghe phát âm dịu nhẹ */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentVocab.word);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-100/70 px-5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              >
                <Volume2 size={16} /> Nghe phát âm
              </button>
            </div>

            {/* ĐÃ SỬA: Footer trạng thái đã xem màu xanh nhạt nhẹ nhàng */}
            <div className="flex justify-center text-xs font-medium text-slate-400">
              {viewedCards.includes(currentCardIndex) ? (
                <span className="inline-flex items-center gap-1 text-emerald-600/80 font-medium">
                  <CheckCircle2 size={14} /> Đã xem qua card này
                </span>
              ) : (
                <span>Thẻ mới</span>
              )}
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className="absolute inset-0 flex flex-col justify-between rounded-[32px] bg-gradient-to-b from-emerald-50/30 to-white p-7 shadow-xl shadow-slate-200/50 ring-1 ring-emerald-100/50"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex justify-center text-xs font-medium text-slate-400">
              <span>Chạm để xoay lại</span>
            </div>

            <div className="my-auto space-y-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {currentVocab.meaningVi || "Chưa có nghĩa"}
                </p>
              </div>

              {/* ĐÃ SỬA: Khối ví dụ dịu mắt */}
              {currentVocab.exampleSentence && (
                <div className="mx-auto max-w-md rounded-2xl bg-emerald-50/30 p-4 ring-1 ring-emerald-100/60">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700/80">
                    Ví dụ
                  </p>
                  <p className="mt-1 text-sm font-medium italic text-slate-700 leading-relaxed">
                    "{currentVocab.exampleSentence}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center text-xs font-medium text-slate-400">
              {viewedCards.includes(currentCardIndex) ? (
                <span className="inline-flex items-center gap-1 text-emerald-600/80 font-medium">
                  <CheckCircle2 size={14} /> Đã xem qua card này
                </span>
              ) : (
                <span>Thẻ mới</span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>

    {/* 3. Navigation Controls */}
    <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4">
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentCardIndex === 0 || isAnimating}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200/80 px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft size={18} /> Thẻ trước
      </button>

      {/* ĐÃ SỬA: Nút "Thẻ tiếp" tông Emerald dịu mát, không bị chói mắt */}
      <button
        type="button"
        onClick={handleNext}
        disabled={currentCardIndex >= totalCount - 1 || isAnimating}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/15 transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Thẻ tiếp <ArrowRight size={18} />
      </button>
    </div>
  </div>
);
}