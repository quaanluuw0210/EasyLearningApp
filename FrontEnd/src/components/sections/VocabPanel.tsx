"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Search, Volume2 } from "lucide-react";
import { learningApi, VocabularyWithSRS } from "@/lib/api";

type VocabWordItem = VocabularyWithSRS;

type VocabPanelProps = {
  courseId?: string;
  courseTitle?: string;
  topicId?: string;
  topicTitle?: string;
};

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function VocabPanel({
  courseId,
  courseTitle,
  topicId,
  topicTitle,
}: VocabPanelProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [vocabList, setVocabList] = useState<VocabWordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadVocabularies = async () => {
      if (!courseId || !topicId) {
        setVocabList([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await learningApi.getVocabularies(courseId, topicId, user?.uid);
        if (!active) return;
        setVocabList(data || []);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("Không thể tải danh sách từ vựng cho chủ đề này.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadVocabularies();
    return () => {
      active = false;
    };
  }, [courseId, topicId, user?.uid]);

  const filteredWords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return vocabList;

    return vocabList.filter((item) => {
      const word = item.word.toLowerCase();
      const meaning = String(item.meaningVi || "").toLowerCase();
      const example = String(item.exampleSentence || "").toLowerCase();
      return word.includes(term) || meaning.includes(term) || example.includes(term);
    });
  }, [searchTerm, vocabList]);

  return (
    /* ĐÃ SỬA: Đổi flex-col gap-5 thành h-full flex flex-col gap-4 overflow-hidden */
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      
      {/* 1. Header Banner (Chiều cao cố định) */}
      <div className="flex shrink-0 items-center gap-3.5 rounded-[28px] border border-slate-200/80 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-indigo-500/10 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
          <BookOpen size={20} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Danh sách từ vựng của bạn
          </p>
        </div>
      </div>

      {/* 2. Thanh tìm kiếm (Chiều cao cố định) */}
      <div className="relative shrink-0">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm từ vựng hoặc nghĩa tiếng Việt..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
        />
      </div>

      {/* 3. Danh sách từ vựng (Tự động co giãn & có thanh cuộn mượt) */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Đang tải danh sách từ vựng...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : (
        /* ĐÃ SỬA: Thay max-h-[500px] bằng flex-1 min-h-0 overflow-y-auto */
        <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1.5 custom-scrollbar">
          {filteredWords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Không tìm thấy từ vựng phù hợp với từ khóa "{searchTerm}"
            </div>
          ) : (
            filteredWords.map((item) => {
              const wordStr = String(item.word || "");
              const phoneticStr = String(item.phonetic || "");
              const posStr = String(item.partOfSpeech || "");
              const meaningStr = String(item.meaningVi || "");
              const exampleStr = String(item.exampleSentence || "");

              return (
                <div
                  key={`${wordStr}-${item.stt}`}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 transition hover:border-teal-500/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => speakText(wordStr)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-teal-500 hover:text-white"
                      title="Nghe phát âm"
                    >
                      <Volume2 size={18} />
                    </button>

                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-base font-bold text-slate-900">{wordStr}</span>
                      {phoneticStr && (
                        <span className="text-xs font-medium text-teal-600">{phoneticStr}</span>
                      )}
                      {posStr && (
                        <span className="text-[11px] font-semibold italic text-slate-400">
                          ({posStr})
                        </span>
                      )}
                    </div>
                  </div>

                  {meaningStr && (
                    <p className="pl-12 text-sm font-semibold text-slate-700">{meaningStr}</p>
                  )}

                  {exampleStr && (
                    <p className="rounded-xl border-l-2 border-teal-500/40 bg-slate-50 p-2.5 pl-3 text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-slate-700">Ví dụ: </span>
                      {exampleStr}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}