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
  good: 4,
  easy: 5,
};

export const RATING_INTERVAL_LABELS: Record<SrsRating, string> = {
  again: "<1m",
  hard: "<6m",
  good: "<10m",
  easy: "5d",
};

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

export function isItemDue(item: VocabularyItem, sessionRatedIds: Set<string> = new Set(), now: Date = new Date()): boolean {
  const isSessionLearning = sessionRatedIds.has(item.id);
  const repetitions = item.repetitions ?? (item.step && item.step > 0 ? 1 : 0);
  const interval = item.interval ?? 0;
  const nextReviewRaw = item.nextReviewDate || item.nextReview || item.srs_progress?.nextReviewDate;

  let isDueTime = false;
  let hasNextReview = false;
  if (nextReviewRaw) {
    hasNextReview = true;
    const reviewDate = new Date(nextReviewRaw);
    if (!isNaN(reviewDate.getTime())) {
      isDueTime = reviewDate <= now;
    }
  }

  if (isSessionLearning || (repetitions > 0 && interval < 1)) {
    // 2. Learning
    return true;
  } else if (repetitions === 0 && interval === 0 && !hasNextReview) {
    // 1. New
    return true;
  } else if (isDueTime) {
    // 4. Review
    return true;
  }
  // 3. Đã học nhưng chưa đến hạn: false
  return false;
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

    const isRatedInSession = sessionRatedIds.has(item.id);
    const repetitions = item.repetitions ?? item.srs_progress?.repetitions ?? 0;
    const nextReviewRaw = item.nextReviewDate || item.nextReview || item.srs_progress?.nextReviewDate;

    let isDue = false;
    let hasNextReview = false;

    if (nextReviewRaw) {
      const reviewDate = new Date(nextReviewRaw);
      if (!isNaN(reviewDate.getTime())) {
        hasNextReview = true;
        isDue = reviewDate <= now; // Đã đến lịch hoặc quá hạn
      }
    }

    // 1. TỪ MỚI (Xanh dương): Chưa từng ôn tập bao giờ (repetitions = 0) và chưa bấm trong session này
    if (!isRatedInSession && repetitions === 0 && !hasNextReview) {
      newCount++;
    } 
    // 2. ĐÃ ĐẾN HẠN / CẦN ÔN (Đỏ): Đã đến/quá hạn ôn OR vừa bấm Again/Hard trong session
    else if (isDue || item.step === 1) {
      learningCount++;
    } 
    // 3. CHƯA ĐẾN LỊCH (Xanh lá): Đã học rồi (repetitions > 0) VÀ ngày hẹn ở tương lai (ReviewDate > Now)
    else {
      reviewCount++;
    }
  });

  return { newCount, learningCount, reviewCount };
}