export function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export type Restaurant = {
  id: string;
  name: string;
  address: string;
  rating: number;
  price: string | number;
  phone: string | number;
  mapUrl: string;
  imageUrl: string;
  semanticText: string;
  meals?: string[];
  meal?: string; // Added to support itinerary display
  assignedMeal?: string;
  lat?: number;
  lng?: number;
  healthTagsDisplay?: {
    warnings?: string[];
    notes?: string[];
  };
  warnings?: string[];
  notes?: string[];
  source?: "user" | "ai";
};

export type ApiRestaurant = {
  id?: string;
  name?: string;
  address?: string;
  star?: number;
  avg_price?: number;
  phone_num?: string | number;
  image_url?: string;
  semantic_text?: string;
  meals?: string[];
  meal?: string;
  assigned_meal?: string;
  main_tag?: string[];
  potential_tag?: string[];
  warnings?: string[];
  notes?: string[];
  type?: string[];
  lat?: number;
  lng?: number;
};

function resolveAssignedMeal(
  assignedMeal: string | undefined | null,
  meals: unknown
): string | undefined {
  const normalizedAssigned = String(assignedMeal || "").trim();
  if (!normalizedAssigned) return undefined;

  if (normalizedAssigned.toLowerCase() !== "any") {
    return normalizedAssigned;
  }

  return undefined;
}

export function convertToGeoJSON(restaurants: ApiRestaurant[]) {
  const getStyle = (types?: string[]) => {
    const typeStr = types?.join(" ") || "";
    if (typeStr.includes("Việt")) return { icon: "🍜", color: "#EA4335" }; // Đỏ Google
    if (typeStr.includes("Nhật")) return { icon: "🍣", color: "#FF9800" }; // Cam
    if (typeStr.includes("Thái")) return { icon: "🌶️", color: "#E91E63" }; // Hồng
    if (typeStr.includes("Âu")) return { icon: "🍕", color: "#9C27B0" };   // Tím
    if (typeStr.includes("Chay")) return { icon: "🥦", color: "#4CAF50" };  // Xanh lá
    if (typeStr.includes("nước")) return { icon: "☕", color: "#03A9F4" }; // Xanh dương
    if (typeStr.includes("bánh")) return { icon: "🍰", color: "#EC407A" }; // Hồng nhạt
    if (typeStr.includes("nhanh")) return { icon: "🍔", color: "#795548" }; // Nâu
    return { icon: "📍", color: "#757575" }; // Xám
  };

  return {
    type: "FeatureCollection",
    features: restaurants.map((res) => {
      const style = getStyle(res.type);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [res.lng ?? 0, res.lat ?? 0],
        },
        properties: {
          ...res,
          mapIcon: style.icon,
          mapColor: style.color,
        },
      };
    }),
  };
}

export const buildRestaurants = (items: any[]): Restaurant[] =>
  items.map((item, index) => {
    // Handle both snake_case (backend) and camelCase (frontend)
    const rawImageUrl = item.image_url || item.imageUrl || "";
    const imageUrl = rawImageUrl ? rawImageUrl.replace(/\\\//g, "/") : "";

    const name = item.name || "Nhà hàng";
    const address = item.address || "Chưa có địa chỉ";

    const mapQuery = [name, address]
      .filter(Boolean)
      .join(" ");

    const mapUrl = item.mapUrl || (mapQuery
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          mapQuery
        )}`
      : "https://www.google.com/maps");

    const star = item.star !== undefined ? item.star : item.rating;
    const ratingValue =
      typeof star === "number"
        ? star
        : Number(star ?? 0) || 0;

    const priceValue = item.avg_price !== undefined ? item.avg_price : item.price;

    const meals = item.meals ?? [];
    const assignedMeal = resolveAssignedMeal(
      item.meal || item.assigned_meal || item.assignedMeal,
      meals
    );

    return {
      id: item.id ?? `${name}-${index}`,

      name,
      address,

      rating: ratingValue,
      price: priceValue ?? "Chưa cập nhật",
      phone: item.phone_num || item.phone || "",

      mapUrl,
      imageUrl,

      semanticText: item.semantic_text || item.semanticText || "Chưa có mô tả.",

      meals,
      meal: assignedMeal,
      assignedMeal,

      warnings: item.warnings ?? [],
      notes: item.notes ?? [],
      source: item.source || (item.isCustom ? "user" : "ai"),
      lat: item.lat,
      lng: item.lng
    };
  });

/**
 * Infer a meal slot (Bữa sáng/Trưa/Tối/Phụ) for a restaurant based on
 * the restaurant `meals` field and a reference time (defaults to now).
 * Returns one of the strings used in the UI: "Bữa sáng", "Bữa trưa",
 * "Bữa tối", "Bữa phụ" or null if no suitable mapping.
 */
export function inferMealFromRestaurant(item: ApiRestaurant, refDate?: Date): string | null {
  const now = refDate || new Date();
  const hour = now.getHours();

  // Preferred meal by hour (local time)
  let preferred = "Bữa phụ";
  if (hour >= 5 && hour < 10) preferred = "Bữa sáng";
  else if (hour >= 10 && hour < 14) preferred = "Bữa trưa";
  else if ((hour >= 17 && hour < 23) || (hour >= 14 && hour < 17)) preferred = "Bữa tối";

  const available = (item.meals || []).map((m) => String(m || "").trim().toLowerCase());

  const mapToMealLabel = (m: string) => {
    if (!m) return null;
    m = m.toLowerCase();
    if (m.includes("sáng")) return "Bữa sáng";
    if (m.includes("trưa")) return "Bữa trưa";
    if (m.includes("tối") || m.includes("tối")) return "Bữa tối";
    if (m.includes("khuya")) return "Bữa phụ";
    return null;
  };

  // If restaurant explicitly supports preferred meal, return it
  for (const raw of available) {
    const label = mapToMealLabel(raw);
    if (label === preferred) return preferred;
  }

  // Otherwise, try a sensible fallback order: trưa -> tối -> sáng -> phụ
  const fallbackOrder = ["Bữa trưa", "Bữa tối", "Bữa sáng", "Bữa phụ"];
  for (const f of fallbackOrder) {
    for (const raw of available) {
      const label = mapToMealLabel(raw);
      if (label === f) return f;
    }
  }

  return null;
}

/**
 * Format meal names for UI display (e.g., 'xế' -> 'Bữa phụ')
 */
export function formatMealDisplay(meal: string | undefined | null): string {
  if (!meal) return "";
  const m = meal.trim().toLowerCase();
  if (m === "any") return "";
  if (m === "xế") return "Bữa phụ";
  // Capitalize first letter, rest lowercase
  return meal.charAt(0).toUpperCase() + meal.slice(1).toLowerCase();
}
