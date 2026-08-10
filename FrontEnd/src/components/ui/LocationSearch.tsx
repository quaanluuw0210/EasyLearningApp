"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, LocateFixed, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type LocationOption = {
  id: string;
  name: string;
  subtitle?: string;
  lat?: number; // Thêm vĩ độ
  lng?: number; // Thêm kinh độ
};

type ApiSuggestion = {
  description?: string;
  place_id?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.bmi-foodtour.io.vn";

type LocationSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: LocationOption) => void;
  openOnFocus?: boolean;
  forceOpen?: boolean;
  onForceOpenComplete?: () => void;
};

// ─── Reverse geocode (mockup — thay bằng API thật sau) ───────────────────────
async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationOption> {
  // TODO: thay bằng Google Maps Geocoding / Mapbox / API nội bộ
  await new Promise((r) => setTimeout(r, 600));
  return {
    id: `geo_${lat}_${lng}`,
    name: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    subtitle: "Vị trí hiện tại của bạn",
  };
}

export default function LocationSearch({
  value,
  onChange,
  onSelect,
  openOnFocus = true,
  forceOpen = false,
  onForceOpenComplete,
}: LocationSearchProps) {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [hiddenQuery, setHiddenQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Handle external force open ─────────────────────────────────────────────
  useEffect(() => {
    if (forceOpen) {
      inputRef.current?.focus();
      setIsFocused(true);
      setOpen(true);
      onForceOpenComplete?.();
    }
  }, [forceOpen, onForceOpenComplete]);

  // GPS state — hoàn toàn nội bộ component
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Autocomplete fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setOptions([]);
      setOpen(false);
      return;
    }
    if (selectedValue && trimmed === selectedValue && !isFocused) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        // Nếu value là "Vị trí hiện tại", dùng hiddenQuery (tọa độ) để search gợi ý
        const queryToSearch = trimmed === "Vị trí hiện tại" && hiddenQuery ? hiddenQuery : trimmed;
        
        const response = await fetch(
          `${API_BASE_URL}/api/v1/maps/suggestions?q=${encodeURIComponent(queryToSearch)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          setOptions([]);
          setOpen(true);
          return;
        }
        const data = (await response.json()) as ApiSuggestion[];
        const mapped = Array.isArray(data)
          ? data
              .filter((item) => item.description)
              .map((item) => ({
                id: item.place_id || item.description || "",
                name: item.description || "",
                subtitle: "Gợi ý từ bản đồ",
              }))
          : [];
        setOptions(mapped);
        if (isFocused && (openOnFocus || trimmed !== selectedValue)) setOpen(true);
      } catch {
        setOptions([]);
        if (isFocused && (openOnFocus || trimmed !== selectedValue)) setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [value, selectedValue, isFocused, hiddenQuery, openOnFocus]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = (option: LocationOption) => {
    setSelectedValue(option.name);
    if (option.name !== "Vị trí hiện tại") {
      setHiddenQuery(""); // Xóa hidden query nếu chọn địa chỉ thật
    }
    onSelect(option);
    setOpen(false);
    setLocationError(null);
  };

  const handleChange = (nextValue: string) => {
    if (selectedValue) setSelectedValue("");
    if (nextValue !== "Vị trí hiện tại") {
      setHiddenQuery("");
    }
    setLocationError(null);
    onChange(nextValue);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const displayName = "Vị trí hiện tại";
          const id = `geo_${latitude}_${longitude}`;
          const coordsString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          
          setHiddenQuery(coordsString);
          
          // Cập nhật input text
          onChange(displayName);
          // Thông báo cho parent component giống như chọn từ dropdown
          handleSelect({ id, name: displayName, subtitle: coordsString });
        } catch {
          setLocationError("Không thể xác định địa chỉ từ vị trí.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Bạn đã từ chối quyền định vị.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Không lấy được vị trí hiện tại.");
            break;
          case err.TIMEOUT:
            setLocationError("Hết thời gian lấy vị trí.");
            break;
          default:
            setLocationError("Lỗi khi lấy vị trí.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div ref={containerRef} className="relative z-30">
      {/* ── Input row ── */}
      <div className="glass mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft">
        <MapPin className="shrink-0 text-brand-coral" size={18} />

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay để kịp nhận event onClick từ danh sách gợi ý
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Nhập khu vực bạn đang ở"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />

        {/* GPS button */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLocating}
          title="Dùng vị trí hiện tại"
          className="group shrink-0 rounded-xl p-1.5 text-slate-400 transition-all duration-200 hover:bg-brand-lagoon/10 hover:text-brand-lagoon disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLocating ? (
            <Loader2 size={17} className="animate-spin text-brand-lagoon" />
          ) : (
            <LocateFixed
              size={17}
              className="transition-transform duration-200 group-hover:scale-110"
            />
          )}
        </button>

        <Search className="shrink-0 text-slate-400" size={18} />
      </div>

      {/* ── Error message ── */}
      <AnimatePresence>
        {locationError && (
          <motion.p
            key="loc-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 px-1 text-xs text-red-400"
          >
            {locationError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Suggestions dropdown ── */}
      <AnimatePresence>
        {open && (options.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass absolute left-0 right-0 z-50 mt-3 overflow-hidden rounded-2xl shadow-soft"
          >
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Đang tìm gợi ý phù hợp...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">
                Không có gợi ý phù hợp.
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white/70"
                >
                  <span className="font-semibold text-slate-900">
                    {option.name}
                  </span>
                  {option.subtitle && (
                    <span className="text-xs text-slate-500">
                      {option.subtitle}
                    </span>
                  )}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}