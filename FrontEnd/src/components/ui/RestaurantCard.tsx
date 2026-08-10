"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartPulse, MapPin, Phone, Star, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import {
  AlertTriangle,
  ShieldCheck,
  Info,
} from "lucide-react";

type Restaurant = {
  name: string;
  address: string;
  rating: number;
  price: string | number;
  phone: string | number;
  mapUrl: string;
  imageUrl: string;
  semanticText: string;
  meals?: string[];
  assignedMeal?: string;
  warnings?: string[];
  notes?: string[];
  source?: "ai" | "user";
};

type RestaurantCardProps = {
  restaurant: Restaurant;
  hasHealthProfile?: boolean;
  onOpenHealthProfile?: () => void;
};

const formatPhoneNumber = (phone: string | number) => {
  if (phone === null || phone === undefined) {
    return "";
  }
  const raw = String(phone).trim();
  if (!raw) {
    return "";
  }
  if (raw.endsWith(".0")) {
    return raw.slice(0, -2);
  }
  return raw;
};



const normalizeImageUrl = (url: string | undefined | null) => {
  if (!url) return "";
  return url.replace(/\\\//g, "/");
};


export default function RestaurantCard2({
  restaurant,
  hasHealthProfile = false,
  onOpenHealthProfile,
}: RestaurantCardProps) {
  const [open, setOpen] = useState(false);

  const phone = useMemo(
    () => formatPhoneNumber(restaurant.phone),
    [restaurant.phone]
  );

  const phoneLink = useMemo(
    () => phone.replace(/[^\d+]/g, ""),
    [phone]
  );

  const imageUrl = useMemo(
    () => normalizeImageUrl(restaurant.imageUrl),
    [restaurant.imageUrl]
  );

  const name = restaurant.name || "Chưa có tên";
  const address = restaurant.address || "Chưa có địa chỉ";
  
  const rating = useMemo(() => {
    const r = restaurant.rating !== undefined ? restaurant.rating : (restaurant as any).star;
    return typeof r === "number" ? r : Number(r) || 0;
  }, [restaurant.rating, (restaurant as any).star]);

  const price = useMemo(() => {
    return restaurant.price !== undefined ? restaurant.price : (restaurant as any).avg_price;
  }, [restaurant.price, (restaurant as any).avg_price]);

  const semanticText = restaurant.semanticText || (restaurant as any).semantic_text || "";
  const mapUrl = restaurant.mapUrl || "https://www.google.com/maps";
    
  const [isOpenWarnings, setIsOpenWarnings] = useState(true);

  const warnings = restaurant.warnings ?? [];
  const notes = restaurant.notes ?? [];

  // Nhà hàng do user tự thêm (hoặc không có source) -> không có đánh giá sức khỏe AI
  const isUserSource = restaurant.source === "user" || !restaurant.source;

  const severity = isUserSource
    ? "unknown"
    : warnings.length === 0
    ? "safe"
    : warnings.length <= 2
    ? "warning"
    : "danger";

  const badgeConfig = {
  unknown: {
    label: "Tự thêm thủ công",
    className: "border-blue-200 bg-blue-100 text-blue-800 shadow-sm",
    icon: Info,
  },
  safe: {
    label: "Phù hợp",
    className:
      "border-green-200 bg-green-100 text-green-800 shadow-sm",
    icon: ShieldCheck,
  },

  warning: {
    label: "Cần lưu ý",
    className:
      "border-yellow-200 bg-yellow-100 text-yellow-800 shadow-sm",
    icon: AlertTriangle,
  },

  danger: {
    label: "Rủi ro cao",
    className:
      "border-red-200 bg-red-100 text-red-800 shadow-sm",
    icon: AlertTriangle,
    },
  };

  const badge = badgeConfig[severity];
  const BadgeIcon = badge.icon;

  // Có nội dung gì để hiện trong khối "AI Insight" không?
  const hasInsightContent = !isUserSource || !!semanticText;

  return (
  <div className="group overflow-hidden rounded-[24px] border border-white/20 bg-white/70 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:rounded-[36px]">
    
    {/* HERO */}
    <div className="relative h-[260px] overflow-hidden sm:h-[360px]">
      <img
        src={imageUrl}
        alt={restaurant.name}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />

      {/* cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* floating badge */}
      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-xl sm:px-4 sm:py-2 sm:text-xs",
            badge.className
          )}
        >
          <BadgeIcon size={14} />
          {badge.label}
        </div>
      </div>

      {/* content on image */}
          
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
        <h2 className="text-2xl font-bold tracking-tight drop-shadow-md sm:text-3xl">
          {name}
        </h2>

        {/* unified badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-3">
          {/* rating */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
            <Star
              size={15}
              className="fill-yellow-400 text-yellow-400"
            />
            <span>{rating.toFixed(1)}</span>
          </div>

          {/* price */}
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
            {typeof price === "number"
              ? `${price.toLocaleString("vi-VN")}đ`
              : price || "Chưa cập nhật"}
          </div>

          {/* meal time */}
          {restaurant.meals && restaurant.meals.length > 0 && (
            <div className="inline-flex max-w-full items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
              {restaurant.meals.join(" • ")}
            </div>
          )}
        </div>

        {/* location */}
        <div className="mt-4 flex items-start text-xs text-white/85 sm:mt-5 sm:text-sm">
          <MapPin
            size={17}
            className="mt-[2px] mr-3 shrink-0 text-orange-300"
          />

          <span className="leading-6">
            {address}
          </span>
        </div>
      </div>
    </div>
    {/* BODY */}
    <div className="space-y-5 p-4 pb-8 sm:p-6 sm:pb-10">
      {/* AI Insight */}
      {hasInsightContent && (
        <div className="rounded-[28px] border border-white/40 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
          {/* logo giống mẫu */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-[0_6px_20px_rgba(249,115,22,0.35)]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-700 shadow-inner">
              <span className="text-sm font-black leading-none">
                ✦
              </span>
            </div>
          </div>

          <span className="text-[17px] font-semibold tracking-tight text-slate-900">
            AI Health Insight
          </span>
        </div>

      {/* Đánh giá sức khỏe (warnings / phù hợp) - chỉ hiện khi KHÔNG phải user tự thêm */}
      {!isUserSource && (
        warnings.length > 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            {/* Nút bấm tiêu đề để ẩn/hiện */}
            <button
              type="button"
              onClick={() => setIsOpenWarnings(!isOpenWarnings)}
              className="flex w-full items-center justify-between rounded-xl bg-amber-100/60 px-3.5 py-2.5 text-left transition-all duration-200 hover:bg-amber-100 outline-none group"
            >
              {/* Bên trái: Tiêu đề bôi đậm, nổi bật hẳn lên */}
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-600 animate-pulse" />
                <span className="text-sm font-bold tracking-wide text-amber-900">
                  Cần lưu ý
                </span>
                {/* Badge số lượng hình tròn nhỏ nhìn cực kỳ chuyên nghiệp */}
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white shadow-sm">
                  {warnings.length}
                </span>
              </div>

              {/* Bên phải: Nút hành động kèm Icon xoay mượt mà */}
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 group-hover:text-amber-900">
                <span>{isOpenWarnings ? "Thu gọn" : "Xem hết"}</span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-300 ${
                    isOpenWarnings ? "rotate-180 text-amber-600" : "text-amber-500"
                  }`}
                />
              </div>
            </button>

            {/* Nếu isOpenWarnings là true thì mới render danh sách bên dưới */}
            {isOpenWarnings && (
              <ul className="list-disc list-inside space-y-1.5 text-sm leading-6 text-amber-900">
                {warnings.map((warning, index) => {
                  // 1. Kiểm tra xem trong câu có dấu ":" không
                  if (warning.includes(":")) {
                    // Tách câu thành 2 phần: trước và sau dấu ":"
                    const indexFirstColon = warning.indexOf(":");
                    const title = warning.substring(0, indexFirstColon);
                    const description = warning.substring(indexFirstColon + 1);

                    return (
                      <li key={index} className="marker:text-amber-500">
                        {/* Phần trước dấu ":" - Bôi đậm màu nâu đen cho nổi bật */}
                        <strong className="font-bold text-slate-900">{title}:</strong>
                        {/* Phần sau dấu ":" - Giữ nguyên chữ thường */}
                        <span className="text-amber-900">{description}</span>
                      </li>
                    );
                  }

                  // 2. Dự phòng trường hợp câu không có dấu ":" thì hiển thị bình thường
                  return (
                    <li key={index} className="marker:text-amber-500">
                      {warning}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm leading-6 text-emerald-800">
              <span className="font-semibold">
                Hệ thống đánh giá nhà hàng này phù hợp với sức khỏe của bạn:
              </span>{" "}
              Không có cảnh báo nào được đưa ra.
            </p>
          </div>
        )
      )}

          {/* semantic text - luôn hiện nếu có nội dung, kể cả khi user tự thêm */}
          {semanticText && (
            <div className="mt-4 rounded-xl bg-amber-50/50 p-4 border-l-4 border-amber-500">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <span>📖</span> Không gian & Hương vị
              </div>
              <p className="text-[14px] font-normal leading-relaxed text-slate-600">
                {semanticText}
              </p>
            </div>
          )}

          {!hasHealthProfile && (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <HeartPulse size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">
                    Insight sẽ chính xác hơn với hồ sơ sức khỏe
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Thêm dị ứng, bệnh nền hoặc chế độ ăn để AI cảnh báo món rủi ro sát với bạn hơn.
                  </p>
                  <button
                    type="button"
                    onClick={onOpenHealthProfile}
                    className="mt-3 rounded-xl bg-orange-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600"
                  >
                    Cập nhật hồ sơ sức khỏe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* actions */}
      {/* Thay grid thành flex */}
      <div className="flex w-full gap-3">
        {phoneLink && (
          <Link
            href={`tel:${phoneLink}`}
            className="inline-flex w-1/2 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-orange-200 transition duration-300 hover:scale-[1.02]"
          >
            <Phone size={16} />
            Gọi ngay
          </Link>
        )}

        <Link
          href={mapUrl}
          target="_blank"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-2xl border py-3.5 text-center text-sm font-semibold transition duration-300",
            phoneLink
              ? "w-1/2 border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700"
              : "w-full bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"
          )}
        >
          <MapPin size={16} className="text-red-500" />
          Chỉ đường
        </Link>
      </div>
    </div>

    {/* accordion - chỉ hiện khi KHÔNG phải user tự thêm và có notes */}
    {!isUserSource && notes.length > 0 && (
      <>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between border-t border-orange-200 bg-orange-50 px-6 py-5 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          Xem thêm health insight

          <ChevronDown
            size={18}
            className={cn(
              "transition-transform duration-300",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="space-y-5 bg-slate-50 px-6 pb-24 pt-5">
            <div className="rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 p-5 shadow-sm">
              {/* header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-md shadow-emerald-200">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    ✓
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Các lưu ý dành cho bạn
                  </h4>

                  <p className="text-xs text-slate-500">
                    Một vài gợi ý sức khỏe giúp bạn
                    lựa chọn món ăn phù hợp hơn
                  </p>
                </div>
              </div>

              {/* notes */}
              <div className="space-y-3">
                {notes.map((note, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </div>

                    <p className="text-sm leading-6 text-slate-700">
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);  
}
