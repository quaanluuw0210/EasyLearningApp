import { BookOpen, Brain, Sparkles, Gamepad2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type LearningMethodId = "flashcard" | "srs" | "vocab" | "matchingGame";

export type LearningMethod = {
  id: LearningMethodId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const learningMethods: LearningMethod[] = [
  {
    id: "vocab",
    label: "Từ vựng",
    description: "Xem và học toàn bộ từ trong chủ đề",
    icon: BookOpen,
  },
  {
    id: "flashcard",
    label: "Flashcard",
    description: "Học từ vựng bằng Flashcard",
    icon: Sparkles,
  },
  {
    id: "srs",
    label: "Học ngắt quãng",
    description: "Ôn lại những từ bạn sắp quên",
    icon: Brain,
  },
  {
    id: "matchingGame",
    label: "Nối từ",
    description: "Trò chơi ghép cặp từ vựng",
    icon: Gamepad2,
  },
];

export const flashcardMock = {
  word: "approach",
  phonetic: "/əˈproʊtʃ/",
  meaning: "tiếp cận",
  example: "She decided to approach the problem from a new angle.",
  learned: 32,
  total: 50,
};

export const srsMock = {
  totalDue: 12,
  summary: "Hôm nay bạn có 12 từ cần củng cố!",
  healthCards: [
    { label: "Sắp quên hẳn", count: 3, emoji: "🔴", bg: "bg-red-50" },
    { label: "Cần ôn gấp", count: 5, emoji: "🟡", bg: "bg-amber-50" },
    { label: "Ghi nhớ tốt", count: 4, emoji: "🟢", bg: "bg-emerald-50" },
  ],
  dueWords: [
    { word: "benefit", phonetic: "/ˈben.ɪ.fɪt/", pos: "noun", meaning: "lợi ích", strength: 28 },
    { word: "decline", phonetic: "/dɪˈklaɪn/", pos: "verb", meaning: "giảm sút", strength: 45 },
    { word: "expand", phonetic: "/ɪkˈspænd/", pos: "verb", meaning: "mở rộng", strength: 62 },
    { word: "strategy", phonetic: "/ˈstræt.ə.dʒi/", pos: "noun", meaning: "chiến lược", strength: 72 },
  ],
};

// 🌟 Mock data nâng cấp chuẩn UI danh sách từ vựng chuyên nghiệp
export const vocabMock = {
  topic: "Business Vocabulary",
  totalWords: 50,
  learnedCount: 32,
  sampleWords: [
    {
      word: "network",
      phonetic: "/ˈnet.wɜːk/",
      pos: "noun",
      meaning: "Mạng lưới, kết nối giao thiệp",
      example: "Building a strong professional network is crucial for career growth."
    },
    {
      word: "strategy",
      phonetic: "/ˈstræt.ə.dʒi/",
      pos: "noun",
      meaning: "Chiến lược, kế hoạch hành động",
      example: "The company developed a new marketing strategy to boost sales."
    },
    {
      word: "forecast",
      phonetic: "/ˈfɔː.kɑːst/",
      pos: "verb / noun",
      meaning: "Dự báo, sự dự đoán",
      example: "Financial experts forecast steady economic growth over the next quarter."
    },
    {
      word: "contract",
      phonetic: "/ˈkɒn.trækt/",
      pos: "noun",
      meaning: "Hợp đồng, bản cam kết",
      example: "Please read all terms carefully before signing the employment contract."
    },
    {
      word: "invoice",
      phonetic: "/ˈɪn.vɔɪs/",
      pos: "noun",
      meaning: "Hóa đơn thanh toán",
      example: "We will send you an invoice as soon as the services are rendered."
    },
  ],
};