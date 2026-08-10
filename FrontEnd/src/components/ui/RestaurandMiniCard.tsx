"use client";

import { useMemo, useState } from "react";
import { MapPin, Star, ShieldCheck, AlertTriangle, Plus } from "lucide-react";
import { Restaurant, cn, formatMealDisplay } from "@/lib/utils";

type RestaurantMiniCardProps = {
  restaurant: Restaurant;
  isSelected?: boolean;
  isInItinerary?: boolean;
  occupiedMeals?: string[];
  currentMeal?: string;
  onSelect: (id: string) => void;
  onSelectMeal?: (meal: string, restaurant: Restaurant) => void;
};

const formatPhoneNumber = (phone: string | number) => {
  if (phone === null || phone === undefined) return "";
  const raw = String(phone).trim();
  if (!raw) return "";
  if (raw.endsWith(".0")) return raw.slice(0, -2);
  return raw;
};

const normalizeImageUrl = (url: string | undefined | null) => {
  if (!url) return "";
  return url.replace(/\\\//g, "/");
};

const normalizeMeal = (meal: string | undefined | null) =>
  (meal || "").trim().toLowerCase();

export default function RestaurantMiniCard({
  restaurant,
  isSelected,
  isInItinerary,
  occupiedMeals = [],
  currentMeal,
  onSelect,
  onSelectMeal,
}: RestaurantMiniCardProps) {
  const [isChangingMeal, setIsChangingMeal] = useState(false);
  const imageUrl = useMemo(
    () => normalizeImageUrl(restaurant.imageUrl),
    [restaurant.imageUrl]
  );

  const name = restaurant.name || "Chưa có tên";
  const address = restaurant.address || "Chưa có địa chỉ";
  const rating = typeof restaurant.rating === "number" ? restaurant.rating : 0;

  const warnings = restaurant.warnings ?? [];
  const severity =
    warnings.length === 0
      ? "safe"
      : warnings.length <= 2
      ? "warning"
      : "danger";

  const badgeConfig = {
    safe: {
      className: "border-green-200 bg-green-50 text-green-700",
      icon: ShieldCheck,
    },
    warning: {
      className: "border-yellow-200 bg-yellow-50 text-yellow-700",
      icon: AlertTriangle,
    },
    danger: {
      className: "border-red-200 bg-red-50 text-red-700",
      icon: AlertTriangle,
    },
  };

  const badge = badgeConfig[severity];
  const BadgeIcon = badge.icon;

  const meals = restaurant.meals && restaurant.meals.length > 0 
    ? restaurant.meals 
    : ["Sáng", "Trưa", "Xế", "Tối"];

  const assignedMeal = restaurant.assignedMeal;
  const occupiedMealSet = useMemo(
    () => new Set(occupiedMeals.map(normalizeMeal).filter(Boolean)),
    [occupiedMeals]
  );
  const normalizedCurrentMeal = normalizeMeal(currentMeal);
  const isMealOccupied = (meal: string | undefined | null) => {
    const normalizedMeal = normalizeMeal(meal);
    return !!normalizedMeal && occupiedMealSet.has(normalizedMeal);
  };
  const isCurrentMeal = (meal: string | undefined | null) =>
    !!normalizedCurrentMeal && normalizeMeal(meal) === normalizedCurrentMeal;
  const getMealActionLabel = (meal: string) => {
    const mealDisplay = formatMealDisplay(meal);
    const mealLabel = mealDisplay.toLowerCase().startsWith("bữa")
      ? mealDisplay.toLowerCase()
      : `bữa ${mealDisplay.toLowerCase()}`;
    if (isCurrentMeal(meal)) return "Đang trong lịch trình";
    if (isInItinerary) return `Chuyển sang ${mealLabel}`;
    if (isMealOccupied(meal)) return `Thay thế ${mealLabel}`;
    return `Thêm vào ${mealLabel}`;
  };

  return (
    <div
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-md transition-all duration-300",
        isSelected
          ? "border-orange-500 bg-orange-50/50 shadow-md ring-1 ring-orange-500"
          : "border-slate-100 hover:border-orange-300 hover:bg-orange-50/20 hover:shadow-sm"
      )}
    >
      <div className="flex w-full gap-3 p-3 text-left" onClick={() => onSelect(restaurant.id)}>
        {/* 1. ẢNH ĐẠI DIỆN THU NHỎ */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 cursor-pointer">
          <img
            src={imageUrl}
            alt={restaurant.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          {/* Floating Mini Badge Sức Khỏe chồng lên ảnh */}
          <div className="absolute left-1 top-1">
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border shadow-sm backdrop-blur-md",
                badge.className
              )}
              title={severity === "safe" ? "Phù hợp" : "Cần lưu ý sức khỏe"}
            >
              <BadgeIcon size={10} className="stroke-[3]" />
            </div>
          </div>
        </div>

        {/* 2. NỘI DUNG THÔNG TIN CHÍNH */}
        <div className="flex flex-1 flex-col justify-between min-w-0 cursor-pointer">
          <div>
            {/* Tên nhà hàng */}
            <h4 className={cn(
              "text-sm font-bold leading-tight text-slate-900 truncate transition-colors",
              isSelected ? "text-orange-600" : "group-hover:text-orange-600"
            )}>
              {name}
            </h4>

            {/* Địa chỉ rút gọn */}
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <MapPin size={12} className="mr-1 shrink-0 text-slate-400" />
              <span className="truncate">{address}</span>
            </div>
          </div>

          {/* 3. THÔNG SỐ ĐÁNH GIÁ & GIÁ CẢ */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Rating */}
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-100">
              <Star size={11} className="fill-amber-500 text-amber-500" />
              <span>{rating.toFixed(1)}</span>
            </div>

            {/* Price */}
            <div className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {typeof restaurant.price === "number"
                ? `${restaurant.price.toLocaleString("vi-VN")}đ`
                : restaurant.price}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SELECT MEAL BUTTONS / ADD BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-2">
        {assignedMeal && !isChangingMeal ? (
          <>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:tracking-wider">
                {isInItinerary ? "Đang trong:" : "Gợi ý cho:"}
              </span>
              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                {formatMealDisplay(currentMeal || assignedMeal)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChangingMeal(true);
                }}
                className="text-[10px] font-bold text-brand-coral underline hover:text-brand-flame"
              >
                Đổi bữa
              </button>
            </div>
            <button
              disabled={isInItinerary && isCurrentMeal(assignedMeal)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectMeal?.(assignedMeal, restaurant);
              }}
              className={cn(
                "flex min-w-0 items-center gap-1 rounded-lg bg-gradient-to-r from-brand-coral to-brand-flame px-2.5 py-1 text-xs font-bold text-white shadow-md transition hover:scale-105 active:scale-95 disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:hover:scale-100 sm:px-3",
                isInItinerary && isCurrentMeal(assignedMeal) && "cursor-not-allowed"
              )}
            >
              <Plus size={14} />
              <span className="truncate">{getMealActionLabel(assignedMeal)}</span>
            </button>
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 sm:tracking-wider">Chọn bữa:</span>
              {isChangingMeal && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChangingMeal(false);
                  }}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700"
                >
                  (Hủy)
                </button>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-1">
              {meals.map((meal) => (
                <button
                  key={meal}
                  disabled={isCurrentMeal(meal)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsChangingMeal(false);
                    onSelectMeal?.(meal, restaurant);
                  }}
                  className={cn(
                    "rounded-lg border border-orange-200 bg-white px-2 py-1 text-[10px] font-bold text-orange-600 transition hover:bg-orange-600 hover:text-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
                    isMealOccupied(meal) && !isCurrentMeal(meal) && "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  {getMealActionLabel(meal)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
