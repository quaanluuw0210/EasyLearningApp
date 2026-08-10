import type { VocabularyWithSRS } from "./api";

export type FlashcardStatus = "new" | "learning" | "review" | "mastered";

export interface FlashcardProgressItem {
  vocabId: string;
  status: FlashcardStatus;
  repetitions: number;
  interval: number;
  easeFactor: number;
  quality: number | null;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  updatedAt: string;
}

export interface FlashcardProgressCache {
  userId: string;
  courseId: string;
  topicId: string;
  currentIndex: number;
  updatedAt: string;
  lastSyncedAt?: string | null;
  items: Record<string, FlashcardProgressItem>;
  dirtyItems: string[];
}

export const SYNC_ACTION_THRESHOLD = 5;
export const SYNC_INTERVAL_MS = 20_000;

export function getFlashcardProgressKey(userId: string, courseId: string, topicId: string) {
  return `flashcard_progress_${userId || "guest"}_${courseId}_${topicId}`;
}

export function parseIsoDate(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function buildInitialProgressItem(
  vocab: VocabularyWithSRS,
  nowIso: string,
  serverProgress?: VocabularyWithSRS["srs_progress"]
): FlashcardProgressItem {
  const initial: FlashcardProgressItem = {
    vocabId: vocab.vocabId,
    status: serverProgress ? "learning" : "new",
    repetitions: serverProgress?.repetitions ?? 0,
    interval: serverProgress?.interval ?? 0,
    easeFactor: serverProgress?.ef ?? 2.5,
    quality: serverProgress?.quality ?? null,
    lastReviewedAt: serverProgress?.lastReviewedAt ?? null,
    nextReviewAt: serverProgress?.nextReviewDate ?? null,
    updatedAt: serverProgress?.lastReviewedAt ?? nowIso,
  };

  return initial;
}

export function getProgressItemUpdateTime(item: FlashcardProgressItem) {
  return parseIsoDate(item.updatedAt) || parseIsoDate(item.lastReviewedAt) || 0;
}

export function buildProgressItemFromServer(
  vocab: VocabularyWithSRS,
  nowIso: string
): FlashcardProgressItem {
  const serverProgress = vocab.srs_progress;

  return {
    vocabId: vocab.vocabId,
    status: serverProgress ? "learning" : "new",
    repetitions: serverProgress?.repetitions ?? 0,
    interval: serverProgress?.interval ?? 0,
    easeFactor: serverProgress?.ef ?? 2.5,
    quality: serverProgress?.quality ?? null,
    lastReviewedAt: serverProgress?.lastReviewedAt ?? null,
    nextReviewAt: serverProgress?.nextReviewDate ?? null,
    updatedAt: serverProgress?.lastReviewedAt ?? nowIso,
  };
}

export function mergeProgressItem(
  localItem: FlashcardProgressItem | undefined,
  vocab: VocabularyWithSRS,
  nowIso: string
): { item: FlashcardProgressItem; localWins: boolean } {
  const serverItem = buildProgressItemFromServer(vocab, nowIso);

  if (!localItem) {
    return { item: serverItem, localWins: false };
  }

  const localTime = getProgressItemUpdateTime(localItem);
  const serverTime = getProgressItemUpdateTime(serverItem);

  if (localTime >= serverTime) {
    return { item: localItem, localWins: true };
  }

  return { item: serverItem, localWins: false };
}

export function getProgressCacheFromStorage(
  userId: string,
  courseId: string,
  topicId: string
): FlashcardProgressCache | null {
  if (typeof window === "undefined") return null;
  const key = getFlashcardProgressKey(userId, courseId, topicId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as FlashcardProgressCache;
    if (
      parsed.userId !== userId ||
      parsed.courseId !== courseId ||
      parsed.topicId !== topicId ||
      typeof parsed.currentIndex !== "number" ||
      typeof parsed.items !== "object" ||
      !Array.isArray(parsed.dirtyItems)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveProgressCacheToStorage(cache: FlashcardProgressCache) {
  if (typeof window === "undefined") return;
  const key = getFlashcardProgressKey(cache.userId, cache.courseId, cache.topicId);
  localStorage.setItem(key, JSON.stringify(cache));
}

export function createProgressCache(
  userId: string,
  courseId: string,
  topicId: string,
  currentIndex: number,
  items: Record<string, FlashcardProgressItem>,
  dirtyItems: string[] = [],
  lastSyncedAt?: string | null
): FlashcardProgressCache {
  return {
    userId,
    courseId,
    topicId,
    currentIndex,
    updatedAt: new Date().toISOString(),
    lastSyncedAt: lastSyncedAt ?? null,
    items,
    dirtyItems,
  };
}

export function buildServerProgressPayload(
  userId: string,
  courseId: string,
  topicId: string,
  items: FlashcardProgressItem[]
) {
  return {
    user_id: userId,
    course_id: courseId,
    topic_id: topicId,
    reviews: items.map((item) => ({
      vocab_id: item.vocabId,
      quality: item.quality ?? 0,
      repetitions: item.repetitions,
      interval: item.interval,
      ef: item.easeFactor,
      lastReviewedAt: item.lastReviewedAt,
      nextReviewAt: item.nextReviewAt,
    })),
  };
}
