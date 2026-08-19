// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { useAuth } from "@/context/AuthContext";
// import { Keyboard, Volume2, Eye, EyeOff, Sparkles, ArrowRight, RotateCcw, Trophy, AlertCircle, CheckCircle } from "lucide-react";
// import { learningApi, VocabularyWithSRS } from "@/lib/api";

// type SpellingGamePanelProps = {
//   courseId?: string;
//   courseTitle?: string;
//   topicId?: string;
//   topicTitle?: string;
// };

// // Hàm trộn mảng ngẫu nhiên
// function shuffleArray<T>(array: T[]): T[] {
//   const arr = [...array];
//   for (let i = arr.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [arr[i], arr[j]] = [arr[j], arr[i]];
//   }
//   return arr;
// }

// function speakText(text: string) {
//   if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.lang = "en-US";
//   window.speechSynthesis.cancel();
//   window.speechSynthesis.speak(utterance);
// }

// function autocompleteHints(baseValue: string, wordStr: string, hints: number[]) {
//   let completed = baseValue;
//   while (completed.length < wordStr.length) {
//     const nextIndex = completed.length;
//     const nextChar = wordStr[nextIndex];
//     const isLetterChar = /[a-zA-Z]/.test(nextChar);

//     if (hints.includes(nextIndex) || !isLetterChar) {
//       completed += nextChar;
//     } else {
//       break;
//     }
//   }
//   return completed;
// }

// export default function SpellingGamePanel({
//   courseId,
//   courseTitle,
//   topicId,
//   topicTitle,
// }: SpellingGamePanelProps) {
//   const { user } = useAuth();
//   const [allVocabs, setAllVocabs] = useState<VocabularyWithSRS[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // States của hàng đợi chơi
//   const [playQueue, setPlayQueue] = useState<VocabularyWithSRS[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   // States của từ hiện tại
//   const [typedValue, setTypedValue] = useState("");
//   const [showMeaning, setShowMeaning] = useState(false);
//   const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
//   const [isCorrect, setIsCorrect] = useState(false);

//   // Thống kê và Điểm số
//   const [score, setScore] = useState(0);
//   const [correctCount, setCorrectCount] = useState(0);
//   const [skipCount, setSkipCount] = useState(0);
//   const [hintsUsedCount, setHintsUsedCount] = useState(0);
//   const [hasUsedHintForCurrentWord, setHasUsedHintForCurrentWord] = useState(false);

//   const inputRef = useRef<HTMLInputElement>(null);

//   // Lấy dữ liệu từ vựng
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

//   // Khởi tạo trò chơi
//   const initGame = useCallback((vocabList: VocabularyWithSRS[]) => {
//     if (vocabList.length === 0) return;
//     const shuffled = shuffleArray(vocabList);
//     setPlayQueue(shuffled);
//     setCurrentIndex(0);
//     setTypedValue("");
//     setShowMeaning(false);
//     setRevealedIndices([]);
//     setIsCorrect(false);
//     setScore(0);
//     setCorrectCount(0);
//     setSkipCount(0);
//     setHintsUsedCount(0);
//     setHasUsedHintForCurrentWord(false);
//   }, []);

//   // Tự động khởi chạy game khi tải xong từ vựng
//   useEffect(() => {
//     if (allVocabs.length > 0) {
//       initGame(allVocabs);
//     }
//   }, [allVocabs, initGame]);

//   const currentWord = playQueue[currentIndex];

//   // Phát âm khi load từ mới
//   useEffect(() => {
//     if (currentWord) {
//       speakText(currentWord.word);

//       // Tự động điền các ký tự đặc biệt/khoảng trắng ở đầu
//       const initialValue = autocompleteHints("", currentWord.word, []);
//       setTypedValue(initialValue);

//       // Auto focus input
//       setTimeout(() => {
//         if (inputRef.current) {
//           inputRef.current.focus();
//           const len = initialValue.length;
//           inputRef.current.setSelectionRange(len, len);
//         }
//       }, 50);
//     }
//   }, [currentWord]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     let value = e.target.value;

//     if (!currentWord) {
//       setTypedValue(value);
//       return;
//     }

//     const target = currentWord.word.trim().toLowerCase();
//     const wordStr = currentWord.word;

//     // Nếu người dùng xóa ký tự (Backspace)
//     if (value.length < typedValue.length) {
//       // Bỏ qua các ký tự là gợi ý (hint) hoặc ký tự đặc biệt/khoảng trắng khi xóa ngược
//       while (value.length > 0) {
//         const lastIdx = value.length - 1;
//         const lastChar = wordStr[lastIdx];
//         const isLetterChar = /[a-zA-Z]/.test(lastChar);
//         if (revealedIndices.includes(lastIdx) || !isLetterChar) {
//           value = value.slice(0, -1);
//         } else {
//           break;
//         }
//       }
//       setTypedValue(value);
//       return;
//     }

//     // Nhập thêm ký tự: tự động điền các ký tự gợi ý tiếp theo
//     const completed = autocompleteHints(value, wordStr, revealedIndices);
//     setTypedValue(completed);

//     const typed = completed.trim().toLowerCase();

//     if (typed === target) {
//       setIsCorrect(true);
//       setTimeout(() => {
//         handleNextWord(true);
//       }, 300);
//     }
//   };

//   // Hàm chuyển từ
//   const handleNextWord = useCallback((wasCorrect: boolean) => {
//     if (wasCorrect) {
//       setCorrectCount(prev => prev + 1);
//       // Tính điểm: từ không dùng hint được 10 điểm, dùng hint được 5 điểm
//       setScore(prev => prev + (hasUsedHintForCurrentWord ? 5 : 10));
//     } else {
//       setSkipCount(prev => prev + 1);
//     }

//     setTypedValue("");
//     setShowMeaning(false);
//     setRevealedIndices([]);
//     setIsCorrect(false);
//     setHasUsedHintForCurrentWord(false);
//     setCurrentIndex(prev => prev + 1);
//   }, [hasUsedHintForCurrentWord]);

//   // // Kiểm tra gõ đúng tự động chuyển từ
//   // useEffect(() => {
//   //   if (!currentWord || isCorrect) return;

//   //   const target = currentWord.word.trim().toLowerCase();
//   //   const typed = typedValue.trim().toLowerCase();

//   //   if (typed === target) {
//   //     setIsCorrect(true);
//   //     const timer = setTimeout(() => {
//   //       handleNextWord(true);
//   //     }, 300); // delay ngắn để người dùng thấy trạng thái đúng
//   //     return () => clearTimeout(timer);
//   //   }
//   // }, [typedValue, currentWord, isCorrect, handleNextWord]);

//   // 4 Nút chức năng hỗ trợ
//   const handleSpeak = () => {
//     if (!currentWord) return;
//     speakText(currentWord.word);
//     inputRef.current?.focus();
//   };

//   const handleToggleMeaning = () => {
//     setShowMeaning(prev => !prev);
//     inputRef.current?.focus();
//   };

//   const handleRevealHint = () => {
//     if (!currentWord || hasUsedHintForCurrentWord) return;

//     const wordStr = currentWord.word;
//     const letterIndices: number[] = [];

//     // Tìm các vị trí là chữ cái
//     for (let i = 0; i < wordStr.length; i++) {
//       if (/[a-zA-Z]/.test(wordStr[i])) {
//         letterIndices.push(i);
//       }
//     }

//     // Lấy 50% số chữ cái
//     const countToReveal = Math.ceil(letterIndices.length * 0.5);
//     const shuffledIndices = shuffleArray(letterIndices);
//     const hintIndices = shuffledIndices.slice(0, countToReveal);

//     setRevealedIndices(hintIndices);
//     setHasUsedHintForCurrentWord(true);
//     setHintsUsedCount(prev => prev + 1);

//     // Tự động chèn hint vào typedValue
//     const completed = autocompleteHints(typedValue, wordStr, hintIndices);
//     setTypedValue(completed);

//     // Kiểm tra hoàn thành từ ngay lập tức
//     const target = currentWord.word.trim().toLowerCase();
//     const typed = completed.trim().toLowerCase();

//     if (typed === target) {
//       setIsCorrect(true);
//       setTimeout(() => {
//         handleNextWord(true);
//       }, 300);
//     } else {
//       // Focus lại và di chuyển con trỏ xuống cuối
//       setTimeout(() => {
//         if (inputRef.current) {
//           inputRef.current.focus();
//           const len = completed.length;
//           inputRef.current.setSelectionRange(len, len);
//         }
//       }, 50);
//     }
//   };

//   const handleSkip = () => {
//     handleNextWord(false);
//   };

//   // Render các ô ký tự "_"
//   const renderBlanks = () => {
//     if (!currentWord) return null;
//     const chars = currentWord.word.split("");

//     return (
//       <div className="flex flex-wrap justify-center gap-1.5 py-4">
//         {chars.map((char, index) => {
//           const isLetterChar = /[a-zA-Z]/.test(char);
//           if (!isLetterChar) {
//             // Hiển thị trực tiếp khoảng trắng hoặc ký tự đặc biệt
//             return (
//               <div key={index} className="w-5 text-center text-xl font-bold text-slate-400 self-end">
//                 {char === " " ? "\u00A0" : char}
//               </div>
//             );
//           }

//           const isRevealed = revealedIndices.includes(index);
//           const userTypedChar = typedValue[index];

//           let displayChar = "";
//           let boxStyle = "border-slate-200 bg-slate-50 text-slate-800";

//           if (isRevealed) {
//             displayChar = char;
//             boxStyle = "border-indigo-200 bg-indigo-50/60 text-indigo-600 font-semibold";
//           } else if (userTypedChar !== undefined) {
//             displayChar = userTypedChar;
//             const isCharCorrect = userTypedChar.toLowerCase() === char.toLowerCase();
//             boxStyle = isCharCorrect
//               ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold"
//               : "border-rose-300 bg-rose-50 text-rose-700 font-bold animate-shake";
//           }

//           return (
//             <div
//               key={index}
//               className={`flex h-11 w-9 items-center justify-center rounded-xl border text-lg uppercase transition-all duration-150 ${boxStyle}`}
//             >
//               {displayChar || "_"}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   // Loading
//   if (isLoading) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
//         <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500"></div>
//         <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu trò chơi...</p>
//       </div>
//     );
//   }

//   // Lỗi tải dữ liệu
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

//   // Không có từ vựng
//   if (allVocabs.length === 0) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
//         <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
//           <Keyboard size={24} />
//         </div>
//         <div className="space-y-1.5 max-w-sm">
//           <h3 className="text-base font-bold text-slate-900">Không có dữ liệu</h3>
//           <p className="text-xs text-slate-500">
//             Chủ đề này hiện chưa có từ vựng nào. Vui lòng quay lại hoặc chọn chủ đề khác để chơi!
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Màn hình kết thúc game
//   const isGameFinished = currentIndex >= playQueue.length;

//   if (isGameFinished) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
//         <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 shadow-inner">
//           <Trophy size={48} className="animate-bounce" />
//         </div>

//         <div className="space-y-2">
//           <h2 className="text-2xl font-black text-slate-800">Hoàn thành thử thách!</h2>
//           <p className="text-sm font-semibold text-slate-500">Bạn đã hoàn thành toàn bộ từ vựng trong chủ đề này.</p>
//         </div>

//         {/* Stats card */}
//         <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
//           <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
//             <span className="font-semibold text-slate-500">Tổng số từ:</span>
//             <span className="font-bold text-slate-800">{playQueue.length}</span>
//           </div>
//           <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
//             <span className="font-semibold text-slate-500">Trả lời đúng:</span>
//             <span className="font-bold text-emerald-600">{correctCount}</span>
//           </div>
//           <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
//             <span className="font-semibold text-slate-500">Đã bỏ qua:</span>
//             <span className="font-bold text-rose-500">{skipCount}</span>
//           </div>
//           <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
//             <span className="font-semibold text-slate-500">Gợi ý đã dùng:</span>
//             <span className="font-bold text-indigo-500">{hintsUsedCount}</span>
//           </div>
//           <div className="flex items-center justify-between pt-1">
//             <span className="text-base font-black text-indigo-950">Tổng điểm số:</span>
//             <span className="text-xl font-black text-indigo-600">{score}</span>
//           </div>
//         </div>

//         <button
//           onClick={() => initGame(allVocabs)}
//           className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
//         >
//           <RotateCcw size={16} />
//           <span>Bắt đầu lại</span>
//         </button>
//       </div>
//     );
//   }

//   const progressPercent = (currentIndex / playQueue.length) * 100;

//   return (
//     <div className="flex h-full flex-col gap-4 overflow-hidden">
//       {/* 1. Header Banner & Info (Phiên bản siêu gọn) */}
//       <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 px-3 py-2">

//         {/* Stats Dashboard - Gom thành 1 hàng nhỏ gọn bên trái */}
//         <div className="flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/70 px-3 py-1 text-center backdrop-blur-sm shadow-xs">
//           <div className="flex items-center gap-1.5">
//             <span className="text-[10px] font-bold text-slate-400">Đúng:</span>
//             <span className="text-xs font-extrabold text-emerald-600">{correctCount}</span>
//           </div>

//           <span className="h-3 w-[1px] bg-slate-200" />

//           <div className="flex items-center gap-1.5">
//             <span className="text-[10px] font-bold text-slate-400">Bỏ qua:</span>
//             <span className="text-xs font-extrabold text-rose-500">{skipCount}</span>
//           </div>

//           <span className="h-3 w-[1px] bg-slate-200" />

//           <div className="flex items-center gap-1.5">
//             <span className="text-[10px] font-bold text-slate-400">Điểm:</span>
//             <span className="text-xs font-extrabold text-slate-800">{score}</span>
//           </div>
//         </div>

//         {/* Nút Chơi lại - Thu nhỏ size & icon */}
//         <button
//           onClick={() => initGame(allVocabs)}
//           className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-200/60 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-xs transition hover:bg-amber-50 active:scale-95"
//           title="Chơi lại từ đầu"
//         >
//           <RotateCcw size={12} />
//           <span>Chơi lại</span>
//         </button>

//       </div>

//       {/* 2. Main Game Card */}
//       <div className="flex-1 min-h-0 flex flex-col w-full">
//         <div className="flex-1 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

//           {/* Audio speak icon button */}
//           {/* <div className="flex justify-center py-2">
//             <button
//               onClick={handleSpeak}
//               className={`flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 hover:scale-105 active:scale-95 shadow-md shadow-indigo-100/50 ${isCorrect ? "bg-emerald-500 text-white animate-pulse" : ""
//                 }`}
//               title="Phát âm từ vựng"
//             >
//               {isCorrect ? <CheckCircle size={28} /> : <Volume2 size={28} />}
//             </button>
//           </div> */}

//           {/* Part of Speech & Meaning */}
//           <div className="text-center min-h-[48px] flex flex-col justify-center">
//             {currentWord.partOfSpeech && (
//               <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
//                 ({currentWord.partOfSpeech})
//               </span>
//             )}

//             {showMeaning ? (
//               <p className="text-sm font-bold text-slate-700 animate-fadeIn transition-all duration-200">
//                 {currentWord.meaningVi}
//               </p>
//             ) : (
//               <p className="text-xs font-medium text-slate-400 italic">
//                 Nghĩa tiếng Việt đang bị ẩn
//               </p>
//             )}
//           </div>

//           {/* Character slots (blanks) - Căn giữa và tự động giãn cách */}
//           <div className="flex-1 flex items-center justify-center min-h-[120px]">
//             {renderBlanks()}
//           </div>

//           {/* Input field */}
//           <div className="space-y-1 text-left">
//             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
//               Nhập từ vựng của bạn:
//             </label>
//             <input
//               ref={inputRef}
//               type="text"
//               value={typedValue}
//               onChange={handleInputChange}
//               placeholder="Gõ chính xác từ..."
//               disabled={isCorrect}
//               className="w-full text-center rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200"
//             />
//           </div>

//           {/* 4 Control buttons */}
//           <div className="grid grid-cols-4 gap-2 pt-2">
//             <button
//               onClick={handleSpeak}
//               className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
//               title="Phát âm"
//             >
//               <Volume2 size={16} />
//               <span className="text-[9px] font-bold uppercase tracking-wider">Nghe</span>
//             </button>

//             <button
//               onClick={handleToggleMeaning}
//               className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition active:scale-95 ${showMeaning
//                 ? "border-indigo-200 bg-indigo-50 text-indigo-700"
//                 : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
//                 }`}
//               title="Hiện nghĩa"
//             >
//               {showMeaning ? <EyeOff size={16} /> : <Eye size={16} />}
//               <span className="text-[9px] font-bold uppercase tracking-wider">Nghĩa</span>
//             </button>

//             <button
//               onClick={handleRevealHint}
//               disabled={hasUsedHintForCurrentWord}
//               className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${hasUsedHintForCurrentWord
//                 ? "border-slate-200 bg-slate-50 text-slate-400"
//                 : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
//                 }`}
//               title="Gợi ý 50% chữ cái"
//             >
//               <Sparkles size={16} className={hasUsedHintForCurrentWord ? "" : "text-amber-500"} />
//               <span className="text-[9px] font-bold uppercase tracking-wider">Gợi ý</span>
//             </button>

//             <button
//               onClick={handleSkip}
//               className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition active:scale-95"
//               title="Bỏ qua từ này"
//             >
//               <ArrowRight size={16} />
//               <span className="text-[9px] font-bold uppercase tracking-wider">Bỏ qua</span>
//             </button>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Keyboard, Volume2, Eye, EyeOff, Sparkles, ArrowRight, RotateCcw, Trophy, AlertCircle, CheckCircle } from "lucide-react";
import { learningApi, VocabularyWithSRS } from "@/lib/api";

type SpellingGamePanelProps = {
  courseId?: string;
  courseTitle?: string;
  topicId?: string;
  topicTitle?: string;
};

// Hàm trộn mảng ngẫu nhiên
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export default function SpellingGamePanel({
  courseId,
  courseTitle,
  topicId,
  topicTitle,
}: SpellingGamePanelProps) {
  const { user } = useAuth();
  const [allVocabs, setAllVocabs] = useState<VocabularyWithSRS[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States của hàng đợi chơi
  const [playQueue, setPlayQueue] = useState<VocabularyWithSRS[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // States của từ hiện tại
  const [typedValue, setTypedValue] = useState("");
  const [showMeaning, setShowMeaning] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  // Thống kê và Điểm số
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [hasUsedHintForCurrentWord, setHasUsedHintForCurrentWord] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Lấy dữ liệu từ vựng
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

  // Khởi tạo trò chơi
  const initGame = useCallback((vocabList: VocabularyWithSRS[]) => {
    if (vocabList.length === 0) return;
    const shuffled = shuffleArray(vocabList);
    setPlayQueue(shuffled);
    setCurrentIndex(0);
    setTypedValue("");
    setShowMeaning(false);
    setRevealedIndices([]);
    setIsCorrect(false);
    setScore(0);
    setCorrectCount(0);
    setSkipCount(0);
    setHintsUsedCount(0);
    setHasUsedHintForCurrentWord(false);
  }, []);

  // Tự động khởi chạy game khi tải xong từ vựng
  useEffect(() => {
    if (allVocabs.length > 0) {
      initGame(allVocabs);
    }
  }, [allVocabs, initGame]);

  const currentWord = playQueue[currentIndex];

  // Phát âm khi load từ mới
  useEffect(() => {
    if (currentWord) {
      speakText(currentWord.word);
      // Auto focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentWord]);

  // Hàm kiểm tra 1 giá trị đã gõ có khớp hoàn toàn với từ hiện tại không
  const checkCompletion = useCallback((value: string) => {
    if (!currentWord) return false;
    const target = currentWord.word.trim().toLowerCase();
    const typed = value.trim().toLowerCase();
    return typed === target;
  }, [currentWord]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTypedValue(value);

    if (!currentWord) return;

    if (checkCompletion(value)) {
      setIsCorrect(true);

      setTimeout(() => {
        handleNextWord(true);
      }, 300);
    }
  };

  // Hàm chuyển từ
  const handleNextWord = useCallback((wasCorrect: boolean) => {
    if (wasCorrect) {
      setCorrectCount(prev => prev + 1);
      // Tính điểm: từ không dùng hint được 10 điểm, dùng hint được 5 điểm
      setScore(prev => prev + (hasUsedHintForCurrentWord ? 5 : 10));
    } else {
      setSkipCount(prev => prev + 1);
    }

    setTypedValue("");
    setShowMeaning(false);
    setRevealedIndices([]);
    setIsCorrect(false);
    setHasUsedHintForCurrentWord(false);
    setCurrentIndex(prev => prev + 1);
  }, [hasUsedHintForCurrentWord]);

  // 4 Nút chức năng hỗ trợ
  const handleSpeak = () => {
    if (!currentWord) return;
    speakText(currentWord.word);
    inputRef.current?.focus();
  };

  const handleToggleMeaning = () => {
    setShowMeaning(prev => !prev);
    inputRef.current?.focus();
  };

  const handleRevealHint = () => {
    if (!currentWord || hasUsedHintForCurrentWord) return;

    const wordStr = currentWord.word;
    const letterIndices: number[] = [];

    // Tìm các vị trí là chữ cái
    for (let i = 0; i < wordStr.length; i++) {
      if (/[a-zA-Z]/.test(wordStr[i])) {
        letterIndices.push(i);
      }
    }

    // Lấy 50% số chữ cái
    const countToReveal = Math.ceil(letterIndices.length * 0.5);
    const shuffledIndices = shuffleArray(letterIndices);
    const hintIndices = shuffledIndices.slice(0, countToReveal);

    // LƯU Ý: hint chỉ là hiển thị xem trước (overlay), KHÔNG chèn vào typedValue.
    // Người dùng vẫn phải tự gõ đầy đủ toàn bộ từ, kể cả các ký tự đã được gợi ý.
    setRevealedIndices(hintIndices);
    setHasUsedHintForCurrentWord(true);
    setHintsUsedCount(prev => prev + 1);
    inputRef.current?.focus();
  };

  const handleSkip = () => {
    handleNextWord(false);
  };

  // Render các ô ký tự "_"
  const renderBlanks = () => {
    if (!currentWord) return null;
    const chars = currentWord.word.split("");

    return (
      <div className="flex flex-wrap justify-center gap-1.5 py-4">
        {chars.map((char, index) => {
          const isLetterChar = /[a-zA-Z]/.test(char);
          if (!isLetterChar) {
            // Hiển thị trực tiếp khoảng trắng hoặc ký tự đặc biệt
            return (
              <div key={index} className="w-5 text-center text-xl font-bold text-slate-400 self-end">
                {char === " " ? "\u00A0" : char}
              </div>
            );
          }

          const isRevealed = revealedIndices.includes(index);
          const userTypedChar = typedValue[index];
          // Ký tự này đã được người dùng thực sự gõ tới hay chưa
          const hasBeenTyped = userTypedChar !== undefined;

          let displayChar = "";
          let boxStyle = "border-slate-200 bg-slate-50 text-slate-800";

          if (hasBeenTyped) {
            // Ưu tiên hiển thị những gì người dùng thực sự gõ, kể cả khi ô này đã được gợi ý
            displayChar = userTypedChar;
            const isCharCorrect = userTypedChar.toLowerCase() === char.toLowerCase();
            boxStyle = isCharCorrect
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold"
              : "border-rose-300 bg-rose-50 text-rose-700 font-bold animate-shake";
          } else if (isRevealed) {
            // Chỉ hiển thị xem trước — người dùng CHƯA gõ tới ký tự này
            displayChar = char;
            boxStyle = "border-dashed border-indigo-300 bg-indigo-50/40 text-indigo-400 font-semibold animate-pulse";
          }

          return (
            <div key={index} className="flex flex-col items-center gap-0.5">
              <div
                className={`flex h-11 w-9 items-center justify-center rounded-xl border text-lg uppercase transition-all duration-150 ${boxStyle}`}
              >
                {displayChar || "_"}
              </div>

            </div>
          );
        })}
      </div>
    );
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500"></div>
        <p className="text-sm font-medium text-slate-500">Đang tải dữ liệu trò chơi...</p>
      </div>
    );
  }

  // Lỗi tải dữ liệu
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

  // Không có từ vựng
  if (allVocabs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Keyboard size={24} />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-base font-bold text-slate-900">Không có dữ liệu</h3>
          <p className="text-xs text-slate-500">
            Chủ đề này hiện chưa có từ vựng nào. Vui lòng quay lại hoặc chọn chủ đề khác để chơi!
          </p>
        </div>
      </div>
    );
  }

  // Màn hình kết thúc game
  const isGameFinished = currentIndex >= playQueue.length;

  if (isGameFinished) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 shadow-inner">
          <Trophy size={48} className="animate-bounce" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Hoàn thành thử thách!</h2>
          <p className="text-sm font-semibold text-slate-500">Bạn đã hoàn thành toàn bộ từ vựng trong chủ đề này.</p>
        </div>

        {/* Stats card */}
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-500">Tổng số từ:</span>
            <span className="font-bold text-slate-800">{playQueue.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-500">Trả lời đúng:</span>
            <span className="font-bold text-emerald-600">{correctCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-500">Đã bỏ qua:</span>
            <span className="font-bold text-rose-500">{skipCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-500">Gợi ý đã dùng:</span>
            <span className="font-bold text-indigo-500">{hintsUsedCount}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-base font-black text-indigo-950">Tổng điểm số:</span>
            <span className="text-xl font-black text-indigo-600">{score}</span>
          </div>
        </div>

        <button
          onClick={() => initGame(allVocabs)}
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
        >
          <RotateCcw size={16} />
          <span>Bắt đầu lại</span>
        </button>
      </div>
    );
  }

  const progressPercent = (currentIndex / playQueue.length) * 100;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* 1. Header Banner & Info (Phiên bản siêu gọn) */}
      <div className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 px-3 py-2">

        {/* Stats Dashboard - Gom thành 1 hàng nhỏ gọn bên trái */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/70 px-3 py-1 text-center backdrop-blur-sm shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Đúng:</span>
            <span className="text-xs font-extrabold text-emerald-600">{correctCount}</span>
          </div>

          <span className="h-3 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Bỏ qua:</span>
            <span className="text-xs font-extrabold text-rose-500">{skipCount}</span>
          </div>

          <span className="h-3 w-[1px] bg-slate-200" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400">Điểm:</span>
            <span className="text-xs font-extrabold text-slate-800">{score}</span>
          </div>
        </div>

        {/* Nút Chơi lại - Thu nhỏ size & icon */}
        <button
          onClick={() => initGame(allVocabs)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-200/60 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700 shadow-xs transition hover:bg-amber-50 active:scale-95"
          title="Chơi lại từ đầu"
        >
          <RotateCcw size={12} />
          <span>Chơi lại</span>
        </button>

      </div>

      {/* 2. Main Game Card */}
      <div className="flex-1 min-h-0 flex flex-col w-full">
        <div className="flex-1 flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* Part of Speech & Meaning */}
          <div className="text-center min-h-[48px] flex flex-col justify-center">
            {currentWord.partOfSpeech && (
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                ({currentWord.partOfSpeech})
              </span>
            )}

            {showMeaning ? (
              <p className="text-sm font-bold text-slate-700 animate-fadeIn transition-all duration-200">
                {currentWord.meaningVi}
              </p>
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">
                Nghĩa tiếng Việt đang bị ẩn
              </p>
            )}
          </div>

          {/* Character slots (blanks) - Căn giữa và tự động giãn cách */}
          <div className="flex-1 flex items-center justify-center min-h-[120px]">
            {renderBlanks()}
          </div>

          {/* Input field */}
          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Nhập từ vựng của bạn:
            </label>
            <input
              ref={inputRef}
              type="text"
              value={typedValue}
              onChange={handleInputChange}
              placeholder="Gõ chính xác từ..."
              disabled={isCorrect}
              className="w-full text-center rounded-2xl border border-slate-200 bg-slate-50/50 py-3 px-4 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200"
            />
          </div>

          {/* 4 Control buttons */}
          <div className="grid grid-cols-4 gap-2 pt-2">
            <button
              onClick={handleSpeak}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 active:scale-95"
              title="Phát âm"
            >
              <Volume2 size={16} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Nghe</span>
            </button>

            <button
              onClick={handleToggleMeaning}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition active:scale-95 ${showMeaning
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              title="Hiện nghĩa"
            >
              {showMeaning ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-[9px] font-bold uppercase tracking-wider">Nghĩa</span>
            </button>

            <button
              onClick={handleRevealHint}
              disabled={hasUsedHintForCurrentWord}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${hasUsedHintForCurrentWord
                ? "border-slate-200 bg-slate-50 text-slate-400"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              title="Gợi ý 50% chữ cái"
            >
              <Sparkles size={16} className={hasUsedHintForCurrentWord ? "" : "text-amber-500"} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Gợi ý</span>
            </button>

            <button
              onClick={handleSkip}
              className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 transition active:scale-95"
              title="Bỏ qua từ này"
            >
              <ArrowRight size={16} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Bỏ qua</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}