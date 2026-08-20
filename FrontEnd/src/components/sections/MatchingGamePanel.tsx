// "use client";

// import { useEffect, useState, useCallback, useMemo } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { Gamepad2, RotateCcw, Trophy, CheckCircle2, AlertCircle, Heart, XCircle } from "lucide-react";
// import { learningApi, VocabularyWithSRS } from "@/lib/api";

// type MatchingGamePanelProps = {
//   courseId?: string;
//   courseTitle?: string;
//   topicId?: string;
//   topicTitle?: string;
// };

// interface MatchingCard {
//   id: string;
//   text: string;
//   type: "word" | "meaning";
// }

// // Hàm trộn mảng ngẫu nhiên
// function shuffleArray<T>(array: T[]): T[] {
//   const arr = [...array];
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// }

// // Số mạng tối đa (số lần được phép chọn sai trước khi thua)
// const MAX_LIVES = 5;

// export default function MatchingGamePanel({
//   courseId,
//   courseTitle,
//   topicId,
//   topicTitle,
// }: MatchingGamePanelProps) {
//   const { user } = useAuth();
//   const [allVocabs, setAllVocabs] = useState<VocabularyWithSRS[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // States của game
//   const [currentRoundVocabs, setCurrentRoundVocabs] = useState<VocabularyWithSRS[]>([]);
//   const [unplayedVocabs, setUnplayedVocabs] = useState<VocabularyWithSRS[]>([]);
//   const [leftCards, setLeftCards] = useState<MatchingCard[]>([]);
//   const [rightCards, setRightCards] = useState<MatchingCard[]>([]);

//   const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
//   const [selectedRight, setSelectedRight] = useState<string | null>(null);
//   const [matchedIds, setMatchedIds] = useState<string[]>([]);
//   const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);

//   const [score, setScore] = useState(0);
//   const [roundCount, setRoundCount] = useState(1);
//   const [lives, setLives] = useState(MAX_LIVES);
//   const [isGameOver, setIsGameOver] = useState(false);

//   // Số lượng từ mỗi lượt chơi
//   const BATCH_SIZE = 5;
//   const actualBatchSize = useMemo(() => {
//     if (allVocabs.length === 0) return BATCH_SIZE;
//     return Math.min(BATCH_SIZE, allVocabs.length);
//   }, [allVocabs]);

//   // Load vocabularies từ backend
//   useEffect(() => {
//     let active = true;

//     const loadVocabularies = async () => {
//       if (!courseId || !topicId) {
//         setAllVocabs([]);
//         setIsLoading(false);
//         setError(null);
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const data = await learningApi.getVocabularies(courseId, topicId, user?.uid);
//         if (!active) return;
//         setAllVocabs(data || []);
//       } catch (err) {
//         console.error(err);
//         if (!active) return;
//         setError("Không thể tải danh sách từ vựng cho trò chơi.");
//       } finally {
//         if (active) setIsLoading(false);
//       }
//     };

//     loadVocabularies();
//     return () => {
//       active = false;
//     };
//   }, [courseId, topicId, user?.uid]);

//   // Hàm khởi tạo lượt chơi mới (chơi lại từ đầu, reset toàn bộ điểm/mạng)
//   const initGame = useCallback((vocabList: VocabularyWithSRS[]) => {
//     if (vocabList.length === 0) return;

//     const size = Math.min(BATCH_SIZE, vocabList.length);
//     const shuffledPool = shuffleArray(vocabList);
//     const initialBatch = shuffledPool.slice(0, size);

//     setCurrentRoundVocabs(initialBatch);
//     setLeftCards(shuffleArray(initialBatch.map(item => ({ id: item.vocabId, text: item.word, type: "word" }))));
//     setRightCards(shuffleArray(initialBatch.map(item => ({ id: item.vocabId, text: item.meaningVi || "", type: "meaning" }))));

//     setUnplayedVocabs(shuffledPool.slice(size));
//     setMatchedIds([]);
//     setSelectedLeft(null);
//     setSelectedRight(null);
//     setWrongPair(null);
//     setIsProcessing(false);
//     setScore(0);
//     setRoundCount(1);
//     setLives(MAX_LIVES);
//     setIsGameOver(false);
//   }, []);

//   // Tự động khởi chạy game khi tải xong danh sách từ
//   useEffect(() => {
//     if (allVocabs.length > 0) {
//       initGame(allVocabs);
//     }
//   }, [allVocabs, initGame]);

//   // Hàm chuyển sang lượt tiếp theo (Next Round)
//   const nextRound = useCallback(() => {
//     if (allVocabs.length === 0) return;

//     let nextPool = [...unplayedVocabs];
//     // Nếu pool sắp hết từ, nạp thêm toàn bộ danh sách đã được xáo trộn
//     if (nextPool.length < actualBatchSize) {
//       const refilled = shuffleArray(allVocabs).filter(
//         item => !nextPool.some(p => p.vocabId === item.vocabId)
//       );
//       if (nextPool.length + refilled.length < actualBatchSize) {
//         nextPool = [...nextPool, ...shuffleArray(allVocabs)];
//       } else {
//         nextPool = [...nextPool, ...refilled];
//       }
//     }

//     const nextBatch = nextPool.slice(0, actualBatchSize);
//     const remaining = nextPool.slice(actualBatchSize);

//     setCurrentRoundVocabs(nextBatch);
//     setLeftCards(shuffleArray(nextBatch.map(item => ({ id: item.vocabId, text: item.word, type: "word" }))));
//     setRightCards(shuffleArray(nextBatch.map(item => ({ id: item.vocabId, text: item.meaningVi || "", type: "meaning" }))));

//     setUnplayedVocabs(remaining);
//     setMatchedIds([]);
//     setSelectedLeft(null);
//     setSelectedRight(null);
//     setWrongPair(null);
//     setIsProcessing(false);
//     setRoundCount(prev => prev + 1);
//   }, [allVocabs, unplayedVocabs, actualBatchSize]);

//   // Click chọn card
//   const handleCardClick = (id: string, type: "word" | "meaning") => {
//     if (isProcessing || isGameOver) return;
//     if (matchedIds.includes(id)) return;

//     if (type === "word") {
//       setSelectedLeft(prev => (prev === id ? null : id));
//     } else {
//       setSelectedRight(prev => (prev === id ? null : id));
//     }
//   };

//   useEffect(() => {
//     if (!selectedLeft || !selectedRight || isProcessing || isGameOver) return;

//     setIsProcessing(true);

//     if (selectedLeft === selectedRight) {
//       setMatchedIds(prev => [...prev, selectedLeft]);
//       setScore(prev => prev + 10);
//       setSelectedLeft(null);
//       setSelectedRight(null);
//       setIsProcessing(false);
//     } else {
//       setWrongPair({
//         leftId: selectedLeft,
//         rightId: selectedRight,
//       });

//       const nextLives = lives - 1;
//       setLives(nextLives);

//       const timer = setTimeout(() => {
//         setWrongPair(null);
//         setSelectedLeft(null);
//         setSelectedRight(null);
//         setIsProcessing(false);

//         if (nextLives <= 0) {
//           setIsGameOver(true);
//         }
//       }, 500);

//       return () => clearTimeout(timer);
//     }
//   }, [selectedLeft, selectedRight, isGameOver]);

//   // Tự động kích hoạt round mới khi hoàn thành tất cả các cặp của round hiện tại
//   useEffect(() => {
//     if (isGameOver) return;
//     if (currentRoundVocabs.length > 0 && matchedIds.length === currentRoundVocabs.length) {
//       const timer = setTimeout(() => {
//         nextRound();
//       }, 1000);
//       return () => clearTimeout(timer);
//     }
//   }, [matchedIds, currentRoundVocabs, nextRound, isGameOver]);

//   const handleResetGame = () => {
//     initGame(allVocabs);
//   };

//   // Giao diện loading
//   if (isLoading) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
//         <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu trò chơi...</p>
//       </div>
//     );
//   }

//   // Giao diện lỗi
//   if (error) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center shadow-sm">
//         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
//           <AlertCircle size={24} />
//         </div>
//         <div className="space-y-1.5 max-w-sm">
//           <h3 className="text-base font-bold text-slate-900">Không thể tải trò chơi</h3>
//           <p className="text-xs text-slate-600">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   // Trường hợp không có từ vựng nào
//   if (allVocabs.length === 0) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
//         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
//           <Gamepad2 size={24} />
//         </div>
//         <div className="space-y-1.5 max-w-sm">
//           <h3 className="text-base font-bold text-slate-900">Không có dữ liệu</h3>
//           <p className="text-xs text-slate-500">
//             Chủ đề này hiện chưa có từ vựng nào. Vui lòng quay lại hoặc chọn chủ đề khác để trải nghiệm trò chơi!
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const isRoundFinished = matchedIds.length === currentRoundVocabs.length;
//   const progressPercent = (matchedIds.length / currentRoundVocabs.length) * 100;

//   return (
//     <div className="relative flex h-full flex-col gap-3 overflow-hidden">
//       {/* 1. Header thu gọn: 1 hàng gồm icon/tiêu đề + điểm/mạng/vòng + nút chơi lại */}
//       <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 px-3 py-2">
//         <div className="flex min-w-0 items-center gap-2">
//           <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
//             <Gamepad2 size={16} />
//           </div>
//           <h2 className="truncate text-xs font-bold text-slate-800 sm:text-sm">
//             {topicTitle || "Nối từ vựng"}
//           </h2>
//         </div>

//         <div className="flex shrink-0 items-center gap-2.5 text-xs font-bold text-slate-700 sm:gap-3">
//           <span className="inline-flex items-center gap-1" title="Điểm số">
//             <Trophy size={13} className="text-amber-500" /> {score}
//           </span>
//           <span className="inline-flex items-center gap-1" title="Mạng còn lại">
//             <Heart size={13} className="text-rose-500" /> {lives}/{MAX_LIVES}
//           </span>
//           <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">
//             Vòng {roundCount}
//           </span>
//           <button
//             onClick={handleResetGame}
//             className="flex items-center gap-1 rounded-lg border border-indigo-200/60 bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95"
//             title="Chơi lại từ đầu"
//           >
//             <RotateCcw size={12} />
//           </button>
//         </div>
//       </div>

//       {/* Progress bar mỏng, gọn */}
//       <div className="shrink-0 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
//         <div
//           className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
//           style={{ width: `${progressPercent}%` }}
//         />
//       </div>

//       {/* Instruction text */}
//       <div className="shrink-0 text-center">
//         <p className="text-xs font-semibold text-slate-500">
//           Chọn một từ Tiếng Anh ở cột bên trái và Nghĩa Tiếng Việt tương ứng ở cột bên phải
//         </p>
//       </div>

//       {/* 2. Game Board Grid (Scrollable if needed, responsive columns) */}
//       <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
//         {isRoundFinished && !isGameOver ? (
//           <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-pulse">
//             <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
//               <CheckCircle2 size={32} />
//             </div>
//             <div>
//               <p className="text-sm font-bold text-slate-800">Hoàn thành lượt chơi!</p>
//               <p className="text-xs text-slate-500 mt-1">Đang chuẩn bị vòng chơi tiếp theo...</p>
//             </div>
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 gap-4">
//             {/* Cột trái: Từ Tiếng Anh */}
//             <div className="flex flex-col gap-3">
//               {leftCards.map((card) => {
//                 const isMatched = matchedIds.includes(card.id);
//                 const isSelected = selectedLeft === card.id;
//                 const isWrong = wrongPair?.leftId === card.id;

//                 let cardClasses = "border-slate-200/80 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/20";
//                 if (isMatched) {
//                   cardClasses = "opacity-0 pointer-events-none scale-95 duration-500 border-transparent bg-transparent";
//                 } else if (isWrong) {
//                   cardClasses = "border-rose-400 bg-rose-50 text-rose-700 animate-shake shadow-sm shadow-rose-100";
//                 } else if (isSelected) {
//                   cardClasses = "border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20";
//                 }

//                 return (
//                   <button
//                     key={`left-${card.id}`}
//                     onClick={() => handleCardClick(card.id, "word")}
//                     disabled={isMatched || isProcessing || isGameOver}
//                     className={`flex min-h-[70px] items-center justify-center rounded-2xl border p-4 text-center text-sm font-semibold transition-all duration-300 ease-out focus:outline-none ${cardClasses}`}
//                   >
//                     <span className="line-clamp-2">{card.text}</span>
//                   </button>
//                 );
//               })}
//             </div>

//             {/* Cột phải: Nghĩa Tiếng Việt */}
//             <div className="flex flex-col gap-3">
//               {rightCards.map((card) => {
//                 const isMatched = matchedIds.includes(card.id);
//                 const isSelected = selectedRight === card.id;
//                 const isWrong = wrongPair?.rightId === card.id;

//                 let cardClasses = "border-slate-200/80 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/20";
//                 if (isMatched) {
//                   cardClasses = "opacity-0 pointer-events-none scale-95 duration-500 border-transparent bg-transparent";
//                 } else if (isWrong) {
//                   cardClasses = "border-rose-400 bg-rose-50 text-rose-700 animate-shake shadow-sm shadow-rose-100";
//                 } else if (isSelected) {
//                   cardClasses = "border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20";
//                 }

//                 return (
//                   <button
//                     key={`right-${card.id}`}
//                     onClick={() => handleCardClick(card.id, "meaning")}
//                     disabled={isMatched || isProcessing || isGameOver}
//                     className={`flex min-h-[70px] items-center justify-center rounded-2xl border p-4 text-center text-xs font-medium transition-all duration-300 ease-out focus:outline-none ${cardClasses}`}
//                   >
//                     <span className="line-clamp-3">{card.text}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* 3. Overlay THUA GAME — hiện thông báo rõ ràng thay vì đơ màn hình */}
//       {isGameOver && (
//         <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-slate-900/50 p-4 backdrop-blur-sm">
//           <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl">
//             <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/25">
//               <XCircle size={30} />
//             </div>
//             <div className="space-y-1">
//               <h3 className="text-lg font-black text-slate-900">Bạn đã thua!</h3>
//               <p className="text-xs text-slate-500">
//                 Bạn đã chọn sai quá {MAX_LIVES} lần. Đừng lo, thử lại nhé!
//               </p>
//             </div>

//             <div className="mt-1 grid w-full grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3">
//               <div>
//                 <p className="text-[10px] font-bold uppercase text-slate-400">Điểm đạt được</p>
//                 <p className="text-base font-black text-slate-800">{score}</p>
//               </div>
//               <div>
//                 <p className="text-[10px] font-bold uppercase text-slate-400">Số vòng</p>
//                 <p className="text-base font-black text-slate-800">{roundCount}</p>
//               </div>
//             </div>

//             <button
//               onClick={handleResetGame}
//               className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
//             >
//               <RotateCcw size={16} /> Chơi lại
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }


"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Gamepad2, RotateCcw, Trophy, CheckCircle2, AlertCircle, Heart, XCircle, PartyPopper, Clock } from "lucide-react";
import { learningApi, VocabularyWithSRS } from "@/lib/api";

type MatchingGamePanelProps = {
  courseId?: string;
  courseTitle?: string;
  topicId?: string;
  topicTitle?: string;
};

interface MatchingCard {
  id: string;
  text: string;
  type: "word" | "meaning";
}

// Hàm trộn mảng ngẫu nhiên
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Số mạng tối đa (số lần được phép chọn sai trước khi thua)
const MAX_LIVES = 5;

export default function MatchingGamePanel({
  courseId,
  courseTitle,
  topicId,
  topicTitle,
}: MatchingGamePanelProps) {
  const { user } = useAuth();
  const [allVocabs, setAllVocabs] = useState<VocabularyWithSRS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States của game
  const [currentRoundVocabs, setCurrentRoundVocabs] = useState<VocabularyWithSRS[]>([]);
  const [unplayedVocabs, setUnplayedVocabs] = useState<VocabularyWithSRS[]>([]);
  const [leftCards, setLeftCards] = useState<MatchingCard[]>([]);
  const [rightCards, setRightCards] = useState<MatchingCard[]>([]);

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<{ leftId: string; rightId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [score, setScore] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isGameOver, setIsGameOver] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // State đánh dấu đã hoàn thành toàn bộ từ vựng trong topic
  const [isCompleted, setIsCompleted] = useState(false);

  // Số lượng từ mỗi lượt chơi
  const BATCH_SIZE = 5;
  const actualBatchSize = useMemo(() => {
    if (allVocabs.length === 0) return BATCH_SIZE;
    return Math.min(BATCH_SIZE, allVocabs.length);
  }, [allVocabs]);

  // Load vocabularies từ backend
  useEffect(() => {
    let active = true;

    const loadVocabularies = async () => {
      if (!courseId || !topicId) {
        setAllVocabs([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await learningApi.getVocabularies(courseId, topicId, user?.uid);
        if (!active) return;
        setAllVocabs(data || []);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setError("Không thể tải danh sách từ vựng cho trò chơi.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadVocabularies();
    return () => {
      active = false;
    };
  }, [courseId, topicId, user?.uid]);
  const speakWord = useCallback((word: string) => {
    if (!word || typeof window === "undefined") return;

    // Dừng audio trước đó nếu người dùng click liên tục
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);

    // Phát âm tiếng Anh
    utterance.lang = "en-US";

    // Tốc độ đọc
    utterance.rate = 0.9;

    // Độ cao giọng
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  }, []);


  // Hàm khởi tạo lượt chơi mới (chơi lại từ đầu, reset toàn bộ điểm/mạng/trạng thái)
  const initGame = useCallback((vocabList: VocabularyWithSRS[]) => {
    if (vocabList.length === 0) return;

    const size = Math.min(BATCH_SIZE, vocabList.length);
    const shuffledPool = shuffleArray(vocabList);
    const initialBatch = shuffledPool.slice(0, size);

    setCurrentRoundVocabs(initialBatch);
    setLeftCards(shuffleArray(initialBatch.map(item => ({ id: item.vocabId, text: item.word, type: "word" }))));
    setRightCards(shuffleArray(initialBatch.map(item => ({ id: item.vocabId, text: item.meaningVi || "", type: "meaning" }))));

    setUnplayedVocabs(shuffledPool.slice(size));
    setMatchedIds([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
    setIsProcessing(false);
    setScore(0);
    setRoundCount(1);
    setLives(MAX_LIVES);
    setIsGameOver(false);
    setIsCompleted(false);
    setElapsedSeconds(0); // Reset thời gian
  }, []);
  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if (allVocabs.length === 0) return;
    if (isGameOver || isCompleted) return;

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [allVocabs.length, isGameOver, isCompleted]);

  // Tự động khởi chạy game khi tải xong danh sách từ
  useEffect(() => {
    if (allVocabs.length > 0) {
      initGame(allVocabs);
    }
  }, [allVocabs, initGame]);

  // Đếm thời gian đã chơi (tăng dần mỗi giây)
  useEffect(() => {
    if (allVocabs.length === 0) return; // chưa có ván chơi thì không đếm
    if (isCompleted) return; // đã hoàn thành thì dừng đếm

    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [allVocabs.length, isCompleted]);

  // Hàm chuyển sang lượt tiếp theo (Next Round)
  const nextRound = useCallback(() => {
    if (allVocabs.length === 0) return;

    // Nếu không còn từ nào chưa chơi -> Kích hoạt màn hình Chúc mừng Hoàn thành
    if (unplayedVocabs.length === 0) {
      setIsCompleted(true);
      return;
    }

    const nextBatch = unplayedVocabs.slice(0, actualBatchSize);
    const remaining = unplayedVocabs.slice(actualBatchSize);

    setCurrentRoundVocabs(nextBatch);
    setLeftCards(shuffleArray(nextBatch.map(item => ({ id: item.vocabId, text: item.word, type: "word" }))));
    setRightCards(shuffleArray(nextBatch.map(item => ({ id: item.vocabId, text: item.meaningVi || "", type: "meaning" }))));

    setUnplayedVocabs(remaining);
    setMatchedIds([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setWrongPair(null);
    setIsProcessing(false);
    setRoundCount(prev => prev + 1);
  }, [allVocabs, unplayedVocabs, actualBatchSize]);

  // Click chọn card
  const handleCardClick = (id: string, type: "word" | "meaning") => {
    if (isProcessing || isGameOver || isCompleted) return;
    if (matchedIds.includes(id)) return;

    if (type === "word") {
      setSelectedLeft(prev => (prev === id ? null : id));
    } else {
      setSelectedRight(prev => (prev === id ? null : id));
    }
  };

  useEffect(() => {
    if (
      !selectedLeft ||
      !selectedRight ||
      isProcessing ||
      isGameOver ||
      isCompleted
    ) {
      return;
    }

    setIsProcessing(true);

    if (selectedLeft === selectedRight) {
      setMatchedIds((prev) => [...prev, selectedLeft]);
      setScore((prev) => prev + 10);

      setSelectedLeft(null);
      setSelectedRight(null);
      setIsProcessing(false);

      return;
    }

    setWrongPair({
      leftId: selectedLeft,
      rightId: selectedRight,
    });

    setLives((prevLives) => {
      const nextLives = prevLives - 1;

      if (nextLives <= 0) {
        setIsGameOver(true);
      }

      return nextLives;
    });

    const timer = window.setTimeout(() => {
      setWrongPair(null);
      setSelectedLeft(null);
      setSelectedRight(null);
      setIsProcessing(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    selectedLeft,
    selectedRight,
    isGameOver,
    isCompleted,
  ]);

  // Tự động kích hoạt round mới hoặc kết thúc trò chơi khi chọn xong round hiện tại
  useEffect(() => {
    if (isGameOver || isCompleted) return;
    if (currentRoundVocabs.length > 0 && matchedIds.length === currentRoundVocabs.length) {
      const timer = setTimeout(() => {
        nextRound();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [matchedIds, currentRoundVocabs, nextRound, isGameOver, isCompleted]);

  const handleResetGame = () => {
    initGame(allVocabs);
  };

  // Giao diện loading
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu trò chơi...</p>
      </div>
    );
  }

  // Giao diện lỗi
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/20">
          <AlertCircle size={24} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-slate-900">Không thể tải trò chơi</h3>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // Trường hợp không có từ vựng nào
  if (allVocabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Gamepad2 size={24} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-slate-900">Không có dữ liệu</h3>
          <p className="text-xs text-slate-500">
            Chủ đề này hiện chưa có từ vựng nào. Vui lòng quay lại hoặc chọn chủ đề khác để trải nghiệm trò chơi!
          </p>
        </div>
      </div>
    );
  }

  const isRoundFinished = matchedIds.length === currentRoundVocabs.length;
  const progressPercent = (matchedIds.length / currentRoundVocabs.length) * 100;

  return (
    <div className="relative flex h-full flex-col gap-3 overflow-hidden">
      {/* 1. Header thu gọn: 1 hàng gồm icon/tiêu đề + điểm/mạng/vòng + nút chơi lại */}
      <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Gamepad2 size={16} />
          </div>
          <h2 className="truncate text-xs font-bold text-slate-800 sm:text-sm">
            {topicTitle || "Nối từ vựng"}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 text-xs font-bold text-slate-700 sm:gap-3">
          <span className="inline-flex items-center gap-1" title="Điểm số">
            <Trophy size={13} className="text-amber-500" /> {score}
          </span>
          <span className="inline-flex items-center gap-1" title="Mạng còn lại">
            <Heart size={13} className="text-rose-500" /> {lives}/{MAX_LIVES}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums" title="Thời gian chơi">
            <Clock size={13} className="text-indigo-500" /> {formatTime(elapsedSeconds)}
          </span>
          <span className="hidden text-[10px] font-semibold text-slate-400 sm:inline">
            Vòng {roundCount}
          </span>
          <button
            onClick={handleResetGame}
            className="flex items-center gap-1 rounded-lg border border-indigo-200/60 bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50 active:scale-95"
            title="Chơi lại từ đầu"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar mỏng, gọn */}
      <div className="shrink-0 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Instruction text */}
      <div className="shrink-0 text-center">
        <p className="text-xs font-semibold text-slate-500">
          Chọn một từ Tiếng Anh ở cột bên trái và Nghĩa Tiếng Việt tương ứng ở cột bên phải
        </p>
      </div>

      {/* 2. Game Board Grid (Scrollable if needed, responsive columns) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
        {isRoundFinished && !isGameOver && !isCompleted ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center animate-pulse">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Hoàn thành lượt chơi!</p>
              <p className="text-xs text-slate-500 mt-1">Đang chuẩn bị vòng chơi tiếp theo...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Cột trái: Từ Tiếng Anh */}
            <div className="flex flex-col gap-3">
              {leftCards.map((card) => {
                const isMatched = matchedIds.includes(card.id);
                const isSelected = selectedLeft === card.id;
                const isWrong = wrongPair?.leftId === card.id;

                let cardClasses = "border-slate-200/80 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/20";
                if (isMatched) {
                  cardClasses = "opacity-0 pointer-events-none scale-95 duration-500 border-transparent bg-transparent";
                } else if (isWrong) {
                  cardClasses = "border-rose-400 bg-rose-50 text-rose-700 animate-shake shadow-sm shadow-rose-100";
                } else if (isSelected) {
                  cardClasses = "border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20";
                }

                return (
                  <button
                    key={`left-${card.id}`}
                    onClick={() => {
                      speakWord(card.text);
                      handleCardClick(card.id, "word");
                    }}
                    disabled={isMatched || isProcessing || isGameOver || isCompleted}
                    className={`flex min-h-[70px] items-center justify-center rounded-2xl border p-4 text-center text-sm font-semibold transition-all duration-300 ease-out focus:outline-none ${cardClasses}`}
                  >
                    <span className="line-clamp-2">{card.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Cột phải: Nghĩa Tiếng Việt */}
            <div className="flex flex-col gap-3">
              {rightCards.map((card) => {
                const isMatched = matchedIds.includes(card.id);
                const isSelected = selectedRight === card.id;
                const isWrong = wrongPair?.rightId === card.id;

                let cardClasses = "border-slate-200/80 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50/20";
                if (isMatched) {
                  cardClasses = "opacity-0 pointer-events-none scale-95 duration-500 border-transparent bg-transparent";
                } else if (isWrong) {
                  cardClasses = "border-rose-400 bg-rose-50 text-rose-700 animate-shake shadow-sm shadow-rose-100";
                } else if (isSelected) {
                  cardClasses = "border-indigo-500 bg-indigo-50/70 text-indigo-900 font-bold shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20";
                }

                return (
                  <button
                    key={`right-${card.id}`}
                    onClick={() => handleCardClick(card.id, "meaning")}
                    disabled={isMatched || isProcessing || isGameOver || isCompleted}
                    className={`flex min-h-[70px] items-center justify-center rounded-2xl border p-4 text-center text-xs font-medium transition-all duration-300 ease-out focus:outline-none ${cardClasses}`}
                  >
                    <span className="line-clamp-3">{card.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Overlay HOÀN THÀNH TẤT CẢ TỪ VỰNG (Win/Completed Game) */}
      {isCompleted && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
              <PartyPopper size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Xuất sắc! 🎉</h3>
              <p className="text-xs text-slate-500">
                Bạn đã hoàn thành nối toàn bộ từ vựng trong chủ đề này!
              </p>
            </div>

            <div className="mt-1 grid w-full grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-3">
              {/* Điểm */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Tổng điểm
                </p>
                <p className="text-base font-black text-amber-600">
                  {score}
                </p>
              </div>

              {/* Số vòng */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Số vòng
                </p>
                <p className="text-base font-black text-indigo-600">
                  {roundCount}
                </p>
              </div>

              {/* Mạng còn lại */}
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Mạng còn
                </p>

                <p className="inline-flex items-center gap-1 text-base font-black text-rose-500">
                  <Heart size={14} fill="currentColor" />
                  {lives}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian</p>
                <p className="text-base font-black text-slate-700">{formatTime(elapsedSeconds)}</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-600 mt-1">
              Bạn có muốn thử thách lại một lượt mới không?
            </p>

            <button
              onClick={handleResetGame}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
            >
              <RotateCcw size={16} /> Chơi lại từ đầu
            </button>
          </div>
        </div>
      )}

      {/* 4. Overlay THUA GAME */}
      {isGameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[28px] bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-md shadow-rose-500/25">
              <XCircle size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Bạn đã thua!</h3>
              <p className="text-xs text-slate-500">
                Bạn đã chọn sai quá {MAX_LIVES} lần. Đừng lo, thử lại nhé!
              </p>
            </div>

            <div className="mt-1 grid w-full grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Điểm đạt được</p>
                <p className="text-base font-black text-slate-800">{score}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Số vòng</p>
                <p className="text-base font-black text-slate-800">{roundCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">Thời gian</p>
                <p className="text-base font-black text-slate-800">{formatTime(elapsedSeconds)}</p>
              </div>
            </div>

            <button
              onClick={handleResetGame}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95"
            >
              <RotateCcw size={16} /> Chơi lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}