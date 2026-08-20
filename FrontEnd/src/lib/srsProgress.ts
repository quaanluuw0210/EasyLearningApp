import { learningApi } from "@/lib/api";

export type SrsRating = "again" | "hard" | "good" | "easy";

export type VocabularyItem = {
  id: string;
  word: string;
  partOfSpeech?: string;
  meaning: string;
  phonetic?: string;
  exampleSentence?: string;
  // SRS parameters (Backend source of truth)
  step?: number;
  interval?: number;
  easeFactor?: number;
  nextReview?: string | Date;
  nextReviewDate?: string | Date;
  repetitions?: number;
  lastReviewedAt?: string | Date;
  quality?: number;
  srs_progress?: {
    ef?: number;
    repetitions?: number;
    interval?: number;
    nextReviewDate?: string;
    lastReviewedAt?: string;
    quality?: number;
  } | null;
  // Extra fields for compatibility
  meaningVi?: string;
  courseId?: string;
  topicId?: string;
};

export interface PendingSrsReview {
  courseId: string;
  topicId: string;
  vocabId: string;
  rating: SrsRating;
  quality: number;
  reviewedAt: string;
}

const srsFlushInFlight = new Map<string, Promise<boolean>>();

export const SRS_DEBOUNCE_COUNT_THRESHOLD = 5;
export const SRS_DEBOUNCE_TIME_MS = 10_000;

export const RATING_TO_QUALITY: Record<SrsRating, number> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

export const RATING_INTERVAL_LABELS: Record<SrsRating, string> = {
  again: "<1m",
  hard: "<6m",
  good: "<10m",
  easy: "5d",
};

export interface Sm2Result {
  ef: number;
  repetitions: number;
  interval: number;
  nextReviewDate: string;
}

/**
 * Exact mirror of backend `_calculate_sm2()`.
 * Backend is SOURCE OF TRUTH — this must stay in sync.
 */
export function calculateSm2(
  quality: number,
  ef: number,
  repetitions: number,
  interval: number,
): Sm2Result {
  const now = new Date();

  // 1. Cập nhật Ease Factor (giới hạn EF_min = 1.3)
  let efPrime = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  efPrime = Math.max(1.3, efPrime);

  let newReps = repetitions;
  let newInterval = interval;
  let nextReviewDate = now;

  // 2. Phân loại theo Phase
  if (repetitions === 0) {
    // Learning Phase (Học từ mới/thẻ học lại)
    if (quality === 1) {        // AGAIN
      newReps = 0;
      newInterval = 0;
      nextReviewDate = new Date(now.getTime() + 1 * 60_000);
    } else if (quality === 2) { // HARD
      newReps = 0;
      newInterval = 0;
      nextReviewDate = new Date(now.getTime() + 6 * 60_000);
    } else if (quality === 3) { // GOOD (Tốt nghiệp Learning Phase)
      newReps = 1;
      newInterval = 1;
      nextReviewDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    } else if (quality === 4) { // EASY (Tốt nghiệp nhảy vọt)
      newReps = 1;
      newInterval = 4;
      nextReviewDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
    }
  } else {
    // Review Phase (Ôn tập theo ngày)
    if (quality === 1) {        // AGAIN (Reset về Learning Phase)
      newReps = 0;
      newInterval = 0;
      nextReviewDate = new Date(now.getTime() + 1 * 60_000);
    } else if (quality === 2) { // HARD
      newReps = repetitions + 1;
      newInterval = Math.max(1, Math.round(interval * 1.2));
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    } else if (quality === 3) { // GOOD
      newReps = repetitions + 1;
      newInterval = Math.max(1, Math.round(interval * efPrime));
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    } else if (quality === 4) { // EASY
      newReps = repetitions + 1;
      newInterval = Math.max(1, Math.round(interval * efPrime * 1.3));
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
    }
  }

  return {
    ef: efPrime,
    repetitions: newReps,
    interval: newInterval,
    nextReviewDate: nextReviewDate.toISOString(),
  };
}

/**
 * Compute preview interval labels for each rating button.
 */
export function getIntervalLabelsForItem(
  ef: number,
  repetitions: number,
  interval: number,
): Record<SrsRating, string> {
  const resultAgain = calculateSm2(1, ef, repetitions, interval);
  const resultHard = calculateSm2(2, ef, repetitions, interval);
  const resultGood = calculateSm2(3, ef, repetitions, interval);
  const resultEasy = calculateSm2(4, ef, repetitions, interval);

  const format = (res: Sm2Result, quality: number) => {
    if (res.interval > 0) {
      return `${res.interval}d`;
    }
    if (quality === 1) return "1m";
    if (quality === 2) return "6m";
    return "10m";
  };

  return {
    again: format(resultAgain, 1),
    hard: format(resultHard, 2),
    good: format(resultGood, 3),
    easy: format(resultEasy, 4),
  };
}


/**
 * Storage keys helper
 */
function getPendingLogsKey(userId: string): string {
  const userSegment = userId && userId !== "guest" ? `${userId}` : "guest";
  return `srs_pending_logs_${userSegment}`;
}

function getLocalSrsStateKey(courseId: string, topicId: string, userId: string): string {
  const userSegment = userId && userId !== "guest" ? `${userId}` : "guest";
  return `srs_items_state_${userSegment}_${courseId}_${topicId}`;
}

/**
 * Load pending review logs from LocalStorage
 */
export function getPendingSrsLogs(userId: string): PendingSrsReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getPendingLogsKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading pending SRS logs from LocalStorage:", err);
    return [];
  }
}

/**
 * Save pending review logs to LocalStorage
 */
export function savePendingSrsLogs(userId: string, logs: PendingSrsReview[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getPendingLogsKey(userId), JSON.stringify(logs));
  } catch (err) {
    console.error("Error saving pending SRS logs to LocalStorage:", err);
  }
}

/**
 * Push a new rating review into LocalStorage pending queue (Local-First)
 */
export function enqueueSrsReview(
  userId: string,
  review: PendingSrsReview
): PendingSrsReview[] {
  const currentLogs = getPendingSrsLogs(userId);
  const updatedLogs = [...currentLogs, review];
  savePendingSrsLogs(userId, updatedLogs);
  return updatedLogs;
}

/**
 * Clear pending SRS logs from LocalStorage
 */
export function clearPendingSrsLogs(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(getPendingLogsKey(userId));
  } catch (err) {
    console.error("Error clearing pending SRS logs:", err);
  }
}

function removePendingSrsLogs(userId: string, sentLogs: PendingSrsReview[]): void {
  const currentLogs = getPendingSrsLogs(userId);
  const remainingLogs = [...currentLogs];

  sentLogs.forEach((sentLog) => {
    const matchingIndex = remainingLogs.findIndex(
      (log) =>
        log.courseId === sentLog.courseId &&
        log.topicId === sentLog.topicId &&
        log.vocabId === sentLog.vocabId &&
        log.quality === sentLog.quality &&
        log.reviewedAt === sentLog.reviewedAt
    );
    if (matchingIndex >= 0) remainingLogs.splice(matchingIndex, 1);
  });

  if (remainingLogs.length === 0) {
    clearPendingSrsLogs(userId);
  } else {
    savePendingSrsLogs(userId, remainingLogs);
  }
}

/**
 * Flush all pending SRS review logs from LocalStorage to backend/Firebase.
 * Safe to call on debounce, timer, queue end, unmount or beforeunload.
 */
export async function flushPendingSrsLogs(userId: string): Promise<boolean> {
  const existingFlush = srsFlushInFlight.get(userId);
  if (existingFlush) return existingFlush;

  const logs = getPendingSrsLogs(userId);
  if (logs.length === 0) return true;

  const flushPromise = (async () => {
    try {
      const payload = {
        user_id: userId,
        reviews: logs.map((log) => ({
          course_id: log.courseId,
          topic_id: log.topicId,
          vocab_id: log.vocabId,
          quality: log.quality,
          reviewed_at: log.reviewedAt,
        })),
      };

      await learningApi.syncGuestProgress(payload);

      removePendingSrsLogs(userId, logs);

      const remainingTopics = new Set(
        getPendingSrsLogs(userId).map((log) => `${log.courseId}\u0000${log.topicId}`)
      );
      const affectedTopics = new Set(logs.map((log) => `${log.courseId}\u0000${log.topicId}`));
      affectedTopics.forEach((topicKey) => {
        if (remainingTopics.has(topicKey)) return;
        const separatorIndex = topicKey.indexOf("\u0000");
        clearLocalSrsStateMap(
          topicKey.slice(0, separatorIndex),
          topicKey.slice(separatorIndex + 1),
          userId
        );
      });

      return true;
    } catch (err) {
      console.error("Failed to flush SRS review logs to Firebase:", err);
      return false;
    }
  })();

  srsFlushInFlight.set(userId, flushPromise);
  try {
    return await flushPromise;
  } finally {
    srsFlushInFlight.delete(userId);
  }
}

export function clearLocalSrsStateMap(courseId: string, topicId: string, userId: string): void {
  if (typeof window === "undefined" || !courseId || !topicId) return;
  try {
    const key = getLocalSrsStateKey(courseId, topicId, userId);
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Error clearing local SRS state map:", err);
  }
}

export function getLocalSrsItemState(
  courseId: string,
  topicId: string,
  userId: string,
  vocabId: string
): Partial<VocabularyItem> | null {
  if (typeof window === "undefined" || !courseId || !topicId) return null;
  try {
    const key = getLocalSrsStateKey(courseId, topicId, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const map: Record<string, Partial<VocabularyItem>> = JSON.parse(raw);
    return map[vocabId] || null;
  } catch (err) {
    console.error("Error getting local SRS item state:", err);
    return null;
  }
}

/**
 * Save updated local item state to LocalStorage for instant UI recovery
 */
export function saveLocalSrsItemState(
  courseId: string,
  topicId: string,
  userId: string,
  vocabId: string,
  updatedFields: Partial<VocabularyItem>
): void {
  if (typeof window === "undefined" || !courseId || !topicId) return;
  try {
    const key = getLocalSrsStateKey(courseId, topicId, userId);
    const raw = localStorage.getItem(key);
    const map: Record<string, Partial<VocabularyItem>> = raw ? JSON.parse(raw) : {};
    map[vocabId] = { ...(map[vocabId] || {}), ...updatedFields };
    localStorage.setItem(key, JSON.stringify(map));
  } catch (err) {
    console.error("Error saving local SRS item state:", err);
  }
}
export function isItemDue(
  item: VocabularyItem,
  sessionRatedIds: Set<string> = new Set(),
  now: Date = new Date()
): boolean {
  // Đã đánh giá trong session → cho phép quay lại queue
  if (sessionRatedIds.has(item.id)) {
    return true;
  }

  const nextReviewRaw =
    item.nextReviewDate ??
    item.nextReview ??
    item.srs_progress?.nextReviewDate;

  // Chưa từng học
  if (!nextReviewRaw) {
    return true;
  }

  const nextReview = new Date(nextReviewRaw);

  if (isNaN(nextReview.getTime())) {
    return true;
  }

  return nextReview <= now;
}

export function calculateAnkiCounts(
  items: VocabularyItem[],
  sessionRatedIds: Set<string> = new Set()
): {
  newCount: number;
  learningCount: number;
  reviewCount: number;
} {
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;

  const now = new Date();
  const processedIds = new Set<string>();

  items.forEach((item) => {
    if (processedIds.has(item.id)) return;
    processedIds.add(item.id);

    const repetitions =
      item.repetitions ??
      item.srs_progress?.repetitions ??
      0;

    const nextReviewRaw =
      item.nextReviewDate ||
      item.nextReview ||
      item.srs_progress?.nextReviewDate;

    // =========================
    // 1. TỪ MỚI
    // =========================
    if (repetitions === 0 && !nextReviewRaw) {
      newCount++;
      return;
    }

    // =========================
    // 2. ĐÃ HỌC → kiểm tra lịch
    // =========================
    if (nextReviewRaw) {
      const reviewDate = new Date(nextReviewRaw);

      if (!isNaN(reviewDate.getTime())) {
        if (reviewDate <= now) {
          learningCount++;
          return;
        }

        reviewCount++;
        return;
      }
    }

    // =========================
    // 3. Đã học nhưng không có lịch
    // =========================
    if (repetitions > 0) {
      learningCount++;
      return;
    }

    // fallback
    newCount++;
  });

  return {
    newCount,
    learningCount,
    reviewCount,
  };
}