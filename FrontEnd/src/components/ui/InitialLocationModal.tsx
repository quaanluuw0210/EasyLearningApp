"use client";

import { useState } from "react";
import { X, MapPin, LocateFixed, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch from "./LocationSearch";
import Toast, { ToastType } from "./Toast";

type InitialLocationModalProps = {
  isOpen: boolean;
  onClose: (location?: string, placeId?: string) => void;
};

export default function InitialLocationModal({ isOpen, onClose }: InitialLocationModalProps) {
  const [location, setLocation] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
    position: "bottom" | "center" | "top";
  }>({
    show: false,
    type: "info",
    message: "",
    position: "top"
  });

  const showToast = (type: ToastType, message: string, position: "bottom" | "center" | "top" = "top") => {
    setToast({ show: true, type, message, position });
  };

  const handleGetCurrentLocation = (isAutomatic = false) => {
    if (!navigator.geolocation) {
      if (!isAutomatic) {
        showToast("error", "Trình duyệt không hỗ trợ định vị.", "center");
      }
      onClose();
      return;
    }

    setIsLocating(true);
    // Khi là pop-up thông báo lấy vị trí, đưa ra giữa theo ý người dùng
    showToast("loading", isAutomatic ? "Đang tự động xác định vị trí..." : "Đang truy cập GPS...", "center");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const displayName = "Vị trí hiện tại";
          const id = `geo_${latitude}_${longitude}`;

          showToast("success", "Đã xác định được vị trí của bạn!", "center");
          
          setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
            onClose(displayName, id);
          }, 1500);

        } catch (error) {
          showToast("error", "Có lỗi xảy ra khi xử lý vị trí.", "center");
          setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
            onClose();
          }, 1500);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        showToast("info", "Không lấy được vị trí. Bạn có thể tự nhập sau.", "center");
        
        setTimeout(() => {
          setToast(prev => ({ ...prev, show: false }));
          onClose();
        }, 2000);
      },
      { timeout: 8000 }
    );
  };

  const handleContinue = () => {
    if (location) {
      onClose(location, placeId);
    } else {
      handleGetCurrentLocation(true);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white shadow-2xl sm:rounded-[32px]"
          >
            {/* Background Decorative Element */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-coral/5 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-brand-lagoon/5 blur-3xl" />

            <div className="relative p-5 sm:p-8">
              <button
                onClick={() => handleContinue()}
                disabled={isLocating}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:opacity-30 sm:right-6 sm:top-6"
              >
                <X size={20} />
              </button>

              <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-brand-coral/10 to-brand-flame/10 text-brand-coral shadow-inner">
                  <div className="relative">
                    <MapPin size={38} />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-2 rounded-full bg-brand-coral/20 blur-sm"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Bắt đầu hành trình</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-[280px]">
                  BMI sẽ dựa vào vị trí của bạn để tối ưu lộ trình ăn uống tốt nhất.
                </p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Nhập điểm bắt đầu của bạn
                  </label>
                  <LocationSearch
                    value={location}
                    onChange={(val) => setLocation(val)}
                    onSelect={(opt) => {
                      setLocation(opt.name);
                      setPlaceId(opt.id);
                    }}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {location ? (
                    <button
                      onClick={handleContinue}
                      disabled={isLocating}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame py-4 font-bold text-white shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          Tiếp tục khám phá
                          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGetCurrentLocation(false)}
                      disabled={isLocating}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame py-4 font-bold text-white shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-white" />
                          Đang lấy vị trí...
                        </>
                      ) : (
                        <>
                          <LocateFixed size={18} />
                          Sử dụng vị trí hiện tại
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <p className="mt-10 text-center text-[11px] leading-relaxed text-slate-400">
                Bằng cách tiếp tục, bạn cho phép BMI truy cập vị trí <br/>
                để đem lại trải nghiệm cá nhân hóa tốt nhất.
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      <Toast 
        show={toast.show}
        type={toast.type}
        message={toast.message}
        position={toast.position}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </>
  );
}
