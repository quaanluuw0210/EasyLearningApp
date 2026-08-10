"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import Toast, { ToastType } from "./Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthProfile {
  selected_conditions: string[];
  selected_allergies: string[];
  diet_mode: "strict" | "casual";
  more_descriptions: string;
}

interface HealthProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile?: HealthProfile | null;
  onChange: (profile: HealthProfile) => void;
}

const DEFAULT_PROFILE: HealthProfile = {
  selected_conditions: [],
  selected_allergies: [],
  diet_mode: "casual",
  more_descriptions: "",
};

const normalizeProfile = (profile?: HealthProfile | null): HealthProfile => {
  // Kiểm tra xem diet_mode truyền xuống có hợp lệ không, nếu không hợp lệ thì ép về "casual"
  const isValidDietMode = profile?.diet_mode === "strict" || profile?.diet_mode === "casual";
  const initialDietMode = isValidDietMode ? profile!.diet_mode : "casual";

  return {
    selected_conditions: profile?.selected_conditions ?? [],
    selected_allergies: profile?.selected_allergies ?? [],
    diet_mode: initialDietMode,
    more_descriptions: profile?.more_descriptions ?? "",
  };
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONDITIONS = [
  "Gout", 
  "Dạ dày", 
  "Dạ dày / Đại tràng", 
  "Tiểu đường (Diabetes)", 
  "Béo phì / Giảm cân", 
  "Cao huyết áp"
];

const ALLERGIES = [
  "Đậu phộng", 
  "Bột mì", 
  "Dị ứng Hải sản", 
  "Dị ứng Hải sản vỏ cứng", 
  "Dị ứng Đậu phộng / Hạt", 
  "Bất dung nạp Lactose", 
  "Dị ứng Gluten (Celiac)",
  "Dị ứng Hạt cây (Hạnh nhân/Óc chó)", // 👈 Thêm mới (Dùng tag Peanuts_Nuts)
  "Dị ứng Đạm sữa động vật"            // 👈 Thêm mới (Dùng tag Dairy_Product)
];

// ─── Chip component ───────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200",
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
          : selected
            ? "border-orange-400 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200"
            : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600"
      )}
    >
      {label}
    </button>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function HealthProfileModal({
  open,
  onClose,
  profile,
  onChange,
}: HealthProfileModalProps) {
  const [local, setLocal] = useState<HealthProfile>(normalizeProfile(profile));

  const hasTags =
    local.selected_conditions.length > 0 ||
    local.selected_allergies.length > 0;

  const hasDescription =
    local.more_descriptions.trim().length > 0;

  useEffect(() => {
  if (open) {
    const normalized = normalizeProfile(profile);
    console.log("profile từ server:", profile);
    console.log("sau normalize:", normalized);
    setLocal(normalized);
  }
}, [profile, open]);

  const { user } = useAuth();
  
  const toggle = (field: "selected_conditions" | "selected_allergies", value: string) => {
    setLocal((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: ToastType; message: string }>({
    show: false,
    type: "success",
    message: ""
  });

  const handleSave = async () => {
    setIsSaving(true); 

    try {
      await onChange(local); 
      setShowSuccess(true);
      
      setTimeout(() => {
        onClose();
        setTimeout(() => setShowSuccess(false), 500);
      }, 2000);

    } catch (error) {
      console.error("Lỗi khi cập nhật hồ sơ sức khỏe:", error);
      setToast({
        show: true,
        type: "error",
        message: "Chưa lưu được hồ sơ. Vui lòng kiểm tra kết nối."
      });
    } finally {
      setIsSaving(false); 
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl sm:rounded-[40px]"
            >
              <AnimatePresence mode="wait">
                {!showSuccess ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-8 sm:py-6">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-200">
                          <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold text-slate-900">Hồ sơ sức khỏe</h2>
                          <p className="text-xs font-medium text-slate-500">Tối ưu gợi ý AI theo thể trạng của bạn</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-[calc(100dvh-14rem)] space-y-6 overflow-y-auto px-5 py-6 scrollbar-hide sm:max-h-[60vh] sm:px-8 sm:py-8">
                      <section className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-700">
                            Bệnh nền & Thể trạng
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {CONDITIONS.map((c) => (
                            <Chip
                              key={c}
                              label={c}
                              selected={local.selected_conditions.includes(c)}
                              onClick={() => toggle("selected_conditions", c)}
                              disabled={hasDescription}
                            />
                          ))}
                        </div>
                      </section>

                      <section className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                        <div className="mb-4 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-700">
                            Dị ứng thực phẩm
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                          {Array.from(new Set([...ALLERGIES, ...local.selected_allergies])).map((a) => (
                            <Chip
                              key={a}
                              label={a}
                              selected={local.selected_allergies.includes(a)}
                              onClick={() => toggle("selected_allergies", a)}
                              disabled={hasDescription}
                            />
                          ))}
                        </div>
                      </section>

                      <section className="w-full flex flex-col items-center rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                      <div className="mb-4 w-full flex justify-center">
                        {/* Bỏ flex justify-between thừa và ép bọc ngoài căn giữa */}
                        <div className="flex flex-col items-center text-center">
                          <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-700">
                            Mức độ ưu tiên
                          </p>
                          <p className="mt-1 text-sm text-slate-500 max-w-xs">
                            Chọn cách AI ưu tiên gợi ý món ăn cho bạn.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 w-full p-1.5 bg-white rounded-3xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setLocal((p) => ({ ...p, diet_mode: "strict" }))}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-2xl border py-3 px-3 text-[14px] font-bold transition-all",
                            local.diet_mode === "strict"
                              ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
                          )}
                        >
                          <span className="text-base">🔒</span> Nghiêm ngặt
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocal((p) => ({ ...p, diet_mode: "casual" }))}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-2xl border py-3 px-3 text-[14px] font-bold transition-all",
                            local.diet_mode === "casual"
                              ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
                          )}
                        >
                          <span className="text-base">😌</span> Linh hoạt
                        </button>
                      </div>
                    </section>

                      <section className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5 shadow-sm shadow-slate-100">
                        <div className="mb-4">
                          <span className="text-[13px] font-bold uppercase tracking-[0.18em] text-slate-700">
                            Ghi chú riêng cho AI
                          </span>
                        </div>
                        <div className="relative">
                          <textarea
                            value={local.more_descriptions}
                            onChange={(e) =>
                              setLocal((p) => ({ ...p, more_descriptions: e.target.value }))
                            }
                            disabled={hasTags}
                            maxLength={200}
                            rows={4}
                            placeholder="Ví dụ: Tôi không ăn cay, đang trong chế độ Eat Clean..."
                            className="min-h-[120px] w-full resize-none rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 placeholder:text-slate-300"
                          />
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Nếu bạn đã chọn tình trạng sức khỏe hoặc dị ứng, phần ghi chú sẽ bị vô hiệu hoá.
                        </p>
                      </section>
                    </div>

                    <div className="px-8 pb-8 pt-4">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                      >
                        {isSaving ? (
                          <Loader2 className="h-5 w-5 animate-spin text-white" />
                        ) : (
                          <span>Cập nhật hồ sơ</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center justify-center px-8 py-20 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                      className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500"
                    >
                      <ShieldCheck size={48} strokeWidth={2.5} />
                    </motion.div>
                    <h3 className="mb-2 text-2xl font-black text-slate-900">Đã lưu thành công!</h3>
                    <p className="text-sm font-medium text-slate-500">Hồ sơ của bạn đã được cập nhật.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast 
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}
