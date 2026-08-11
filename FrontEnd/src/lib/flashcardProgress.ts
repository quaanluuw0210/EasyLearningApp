export interface FlashcardProgressState {
  currentCardIndex: number;
  viewedCards: number[];
  updatedAt: string;
}

export const FLASHCARD_SYNC_DEBOUNCE_MS = 5_000;
export const FLASHCARD_SYNC_ACTION_THRESHOLD = 5;

export function getFlashcardProgressKey(courseId: string, topicId: string, userId?: string): string {
  const userSegment = userId && userId !== "guest" ? `${userId}_` : "";
  return `flashcard_progress_${userSegment}${courseId}_${topicId}`;
}

export function getFlashcardProgressFromStorage(
  courseId: string,
  topicId: string,
  userId?: string
): FlashcardProgressState | null {
  if (typeof window === "undefined") return null;
  const key = getFlashcardProgressKey(courseId, topicId, userId);
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.currentCardIndex === "number" && Array.isArray(parsed.viewedCards)) {
      return {
        currentCardIndex: Math.max(0, parsed.currentCardIndex),
        viewedCards: Array.from(new Set<number>(parsed.viewedCards.map(Number))).sort((a, b) => a - b),
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveFlashcardProgressToStorage(
  courseId: string,
  topicId: string,
  data: FlashcardProgressState,
  userId?: string
): void {
  if (typeof window === "undefined") return;
  const key = getFlashcardProgressKey(courseId, topicId, userId);
  localStorage.setItem(key, JSON.stringify(data));
}
