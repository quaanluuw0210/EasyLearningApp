import { authStorage } from "@/lib/auth";
import { getApiOrigin } from "@/lib/apiBase";

export interface CourseItem {
  courseId: string;
  title: string;
  description?: string;
  coverImage?: string;
  totalTopics?: number;
  totalWords?: number;
  isSystem?: boolean;
  fileName?: string;
}

export interface TopicItem {
  topicId: string;
  courseId: string;
  title: string;
  order?: number;
  totalWords?: number;
}

export interface SRSProgress {
  ef: number;
  repetitions: number;
  interval: number;
  nextReviewDate: string;
  lastReviewedAt: string;
  quality: number;
}

export interface VocabularyItem {
  vocabId: string;
  courseId: string;
  topicId: string;
  stt: number;
  word: string;
  wordDisplay: string;
  partOfSpeech?: string;
  phonetic?: string;
  meaningVi?: string;
  exampleSentence?: string;
}

export interface VocabularyWithSRS extends VocabularyItem {
  srs_progress?: SRSProgress | null;
}

export interface SRSReviewRequest {
  user_id: string;
  course_id: string;
  topic_id: string;
  vocab_id: string;
  quality: number;
}

export interface GuestSyncItem {
  course_id: string;
  topic_id: string;
  vocab_id: string;
  quality: number;
  reviewed_at?: string;
}

export interface GuestSyncRequest {
  user_id: string;
  reviews: GuestSyncItem[];
}

export const apiFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const headers = new Headers(init.headers || {});
  const googleUid = authStorage.getGoogleUid();
  const idToken = authStorage.getIdToken();

  if (googleUid) {
    headers.set("x-user-id", googleUid);
  }
  
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  return fetch(input, {
    ...init,
    headers
  });
};

const API_BASE_URL = getApiOrigin();

const vocabCache = new Map<string, Promise<VocabularyWithSRS[]>>();
const progressCache = new Map<string, Promise<FlashcardTopicProgress>>();

export const clearVocabCache = (courseId: string, topicId: string, userId?: string) => {
  const prefix = `${courseId}_${topicId}_${userId || ""}_`;
  for (const key of vocabCache.keys()) {
    if (key.startsWith(prefix)) {
      vocabCache.delete(key);
    }
  }
};

export const learningApi = {
  getCourses: async (fileName?: string) => {
    const url = new URL(`${API_BASE_URL}/api/v1/learning/courses`);
    if (fileName) url.searchParams.set("file_name", fileName);
    const res = await apiFetch(url.toString());
    return res.json() as Promise<CourseItem[]>;
  },

  getTopics: async (courseId: string, fileName?: string) => {
    const url = new URL(`${API_BASE_URL}/api/v1/learning/courses/${courseId}/topics`);
    if (fileName) url.searchParams.set("file_name", fileName);
    const res = await apiFetch(url.toString());
    return res.json() as Promise<TopicItem[]>;
  },

  getAllVocabularies: async (fileName?: string) => {
    const url = new URL(`${API_BASE_URL}/api/v1/learning/vocabularies`);
    if (fileName) url.searchParams.set("file_name", fileName);
    const res = await apiFetch(url.toString());
    return res.json() as Promise<VocabularyItem[]>;
  },

  getVocabularies: async (
    courseId: string,
    topicId: string,
    userId?: string,
    fileName?: string
  ) => {
    const cacheKey = `${courseId}_${topicId}_${userId || ""}_${fileName || ""}`;
    if (vocabCache.has(cacheKey)) {
      return vocabCache.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        const url = new URL(`${API_BASE_URL}/api/v1/learning/courses/${courseId}/topics/${topicId}/vocabularies`);
        if (userId) url.searchParams.set("user_id", userId);
        if (fileName) url.searchParams.set("file_name", fileName);
        const res = await apiFetch(url.toString());
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return await res.json() as VocabularyWithSRS[];
      } catch (err) {
        vocabCache.delete(cacheKey);
        throw err;
      }
    })();

    vocabCache.set(cacheKey, promise);
    return promise;
  },

  getDueCards: async (userId: string, fileName?: string) => {
    const url = new URL(`${API_BASE_URL}/api/v1/learning/srs/due-cards/${userId}`);
    if (fileName) url.searchParams.set("file_name", fileName);
    const res = await apiFetch(url.toString());
    return res.json() as Promise<VocabularyWithSRS[]>;
  },

  reviewSrs: async (payload: SRSReviewRequest) => {
    clearVocabCache(payload.course_id, payload.topic_id, payload.user_id);
    const res = await apiFetch(`${API_BASE_URL}/api/v1/learning/srs/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  syncGuestProgress: async (payload: GuestSyncRequest) => {
    const affected = new Set<string>();
    payload.reviews.forEach(r => affected.add(`${r.course_id}_${r.topic_id}`));
    affected.forEach(key => {
      const [cId, tId] = key.split("_");
      clearVocabCache(cId, tId, payload.user_id);
    });

    const res = await apiFetch(`${API_BASE_URL}/api/v1/learning/progress/sync-guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getTopicFlashcardProgress: async (courseId: string, topicId: string, userId: string) => {
    const cacheKey = `${courseId}_${topicId}_${userId}`;
    if (progressCache.has(cacheKey)) {
      return progressCache.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        const url = new URL(`${API_BASE_URL}/api/v1/learning/courses/${courseId}/topics/${topicId}/flashcard-progress`);
        url.searchParams.set("user_id", userId);
        const res = await apiFetch(url.toString());
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return await res.json() as FlashcardTopicProgress;
      } catch (err) {
        progressCache.delete(cacheKey);
        throw err;
      }
    })();

    progressCache.set(cacheKey, promise);
    return promise;
  },

  saveTopicFlashcardProgress: async (
    courseId: string,
    topicId: string,
    payload: SaveFlashcardTopicProgressRequest
  ) => {
    const cacheKey = `${courseId}_${topicId}_${payload.user_id}`;
    progressCache.set(cacheKey, Promise.resolve({
      flashcardCurrentIndex: payload.flashcardCurrentIndex,
      flashcardViewedCards: payload.flashcardViewedCards,
      flashcardUpdatedAt: payload.flashcardUpdatedAt || new Date().toISOString(),
    }));

    try {
      const res = await apiFetch(`${API_BASE_URL}/api/v1/learning/courses/${courseId}/topics/${topicId}/flashcard-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      return res.json();
    } catch (err) {
      progressCache.delete(cacheKey);
      throw err;
    }
  },
};

export interface FlashcardTopicProgress {
  flashcardCurrentIndex: number;
  flashcardViewedCards: number[];
  flashcardUpdatedAt?: string | null;
}

export interface SaveFlashcardTopicProgressRequest {
  user_id: string;
  flashcardCurrentIndex: number;
  flashcardViewedCards: number[];
  flashcardUpdatedAt?: string;
}

export const itineraryApi = {


  get: async (userId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/${userId}`);
    return res.json();
  },
  select: async (userId: string, meal: string, restaurantData: any) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, meal, restaurant_data: restaurantData }),
    });
    return res.json();
  },
  deleteMeal: async (userId: string, itemId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/${userId}/${itemId}`, {
      method: "DELETE",
    });
    return res.json();
  },
  reset: async (userId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/${userId}`, {
      method: "DELETE",
    });
    return res.json();
  },
  reorder: async (userId: string, orderedItems: { id: string }[]) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ordered_items: orderedItems }),
    });
    return res.json();
  },
  share: async (userId: string, itineraryData: any[]) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, itinerary_data: itineraryData }),
    });
    return res.json();
  },
  importShared: async (userId: string, shareId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/api/v1/itinerary/import-shared`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, share_id: shareId }),
    });
    return res.json();
  },
  getPublic: async (shareId: string) => {
    const res = await apiFetch(`${API_BASE_URL}/public/${shareId}`);
    return res.json();
  },
};
