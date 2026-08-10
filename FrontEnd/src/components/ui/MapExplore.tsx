"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Map, Source, Layer, Popup, NavigationControl, GeolocateControl, Marker, MapRef } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import { convertToGeoJSON, ApiRestaurant, Restaurant, buildRestaurants, inferMealFromRestaurant } from "@/lib/utils";
import { Star, MapPin, Navigation, Info, X, MessageSquare, Plus, Check, Loader2, ChevronDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import RestaurantDetailModal from "./RestaurantDetailModal";
import { itineraryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Goong Map configuration constants
const DEFAULT_VIEW_STATE = {
  latitude: 10.7769,
  longitude: 106.7009,
  zoom: 16,
};

const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAP_API_KEY;
const GOONG_MAP_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`;

const normalizeMealKey = (meal: string | undefined | null) => {
  const value = String(meal || "").trim().toLowerCase();
  if (!value || value === "any") return "";
  if (value.includes("sáng")) return "sáng";
  if (value.includes("trưa")) return "trưa";
  if (value.includes("tối")) return "tối";
  if (value.includes("xế") || value.includes("phụ") || value.includes("khuya") || value.includes("snack")) return "xế";
  return value;
};

const formatMealOption = (meal: string) => {
  const key = normalizeMealKey(meal);
  if (key === "sáng") return "Bữa sáng";
  if (key === "trưa") return "Bữa trưa";
  if (key === "tối") return "Bữa tối";
  if (key === "xế") return "Bữa phụ";
  return "";
};

const getRestaurantMealOptions = (restaurant: any): string[] => {
  const seen = new Set<string>();
  const rawMeals = Array.isArray(restaurant?.meals) ? restaurant.meals : [];
  const rawTypes = Array.isArray(restaurant?.type) ? restaurant.type : [];
  const hasSnackType = rawTypes.some((type: unknown) => {
    const normalizedType = String(type || "").trim().toLowerCase();
    return normalizedType === "quán nước" || normalizedType === "tiệm bánh";
  });

  return [...rawMeals, ...(hasSnackType ? ["xế"] : [])]
    .map((meal: unknown) => formatMealOption(String(meal || "")))
    .filter((meal: string) => {
      const key = normalizeMealKey(meal);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

type MapExploreProps = {
  userPlaceId?: string;
  userLocationText?: string;
  currentItinerary?: any[];
  onItineraryChange?: () => void;
  onUserLocationChange?: (location: { location: string; placeId: string }) => void;
};

export default function MapExplore({
  userPlaceId,
  userLocationText,
  currentItinerary: propItinerary,
  onItineraryChange,
  onUserLocationChange,
}: MapExploreProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);
  const isStandalone = userPlaceId === undefined && userLocationText === undefined;
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupInfo, setPopupInfo] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [storedLocation, setStoredLocation] = useState<{ location: string; placeId: string } | null>(null);
  const [storageChecked, setStorageChecked] = useState(!isStandalone);
  const [selectedResForModal, setSelectedResForModal] = useState<Restaurant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapStyle, setMapStyle] = useState<any>(null);
  const [zoom, setZoom] = useState(DEFAULT_VIEW_STATE.zoom);
  // Lưu tọa độ cần flyTo, thực hiện sau khi map load xong
  const [pendingFlyTo, setPendingFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Itinerary local state if not passed from props
  const [localItinerary, setLocalItinerary] = useState<any[]>([]);
  const currentItinerary = propItinerary || localItinerary;
  const effectiveUserPlaceId = userPlaceId ?? storedLocation?.placeId ?? "";
  const effectiveUserLocationText = userLocationText ?? storedLocation?.location ?? "";

  // Add to itinerary state
  const [addingMeal, setAddingMeal] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // Report review state
  const [reportAction, setReportAction] = useState<string | null>(null);
  const [reportResId, setReportResId] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  const action = searchParams.get("action");
  const resId = searchParams.get("resId");
  const commentId = searchParams.get("commentId");
  
  // =========================================================================
  // EFFECT 1: (Sẵn có của bạn) Chỉ lo phần kiểm tra localStorage khi vào trang
  // =========================================================================
  useEffect(() => {
    if (!isStandalone || typeof window === "undefined") return;

    const savedLocation = localStorage.getItem("bmi_user_location") || "";
    const savedPlaceId = localStorage.getItem("bmi_user_place_id") || "";
    if (savedLocation || savedPlaceId) {
      setStoredLocation({ location: savedLocation, placeId: savedPlaceId });
    }
    setStorageChecked(true);
  }, [isStandalone]);

  
  useEffect(() => {
    if (action !== "review_report" || !resId || !restaurants || restaurants.length === 0) return;


     console.log("EFFECT A RUN");

    // 1. Tìm nhà hàng thô từ API
    const rawRestaurant = restaurants.find(
      (r: any) => String(r.id) === String(resId)
    );
    
    if (rawRestaurant) {
      // 2. CHUYỂN ĐỔI DỮ LIỆU THÀNH ĐÚNG TYPE RESTAURANT (MAPPING)
      const formattedRestaurant: Restaurant = {
        id: String(rawRestaurant.id),
        name: rawRestaurant.name ?? "Tên quán ăn", // Nếu undefined sẽ lấy chuỗi mặc định
  
        address: rawRestaurant.address ?? "Chưa có địa chỉ",
        rating: rawRestaurant.star ?? 0,
        price: rawRestaurant.avg_price ?? 0,
        phone: rawRestaurant.phone_num ?? "Chưa có số điện thoại",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${rawRestaurant.lat},${rawRestaurant.lng}`,
        imageUrl: rawRestaurant.image_url ?? "",
        semanticText: rawRestaurant.semantic_text ?? "",
        meals: rawRestaurant.meals,
        lat: rawRestaurant.lat,
        lng: rawRestaurant.lng,
      }

      // 3. Khai hỏa hiệu ứng bay bản đồ
      const lng = formattedRestaurant.lng ?? 106.660172;
      const lat = formattedRestaurant.lat ?? 10.762622;
      if (mapRef.current) {
        mapRef.current.flyTo({ center: [lng, lat], zoom: 16, essential: true });
      }

      // 4. Truyền dữ liệu ĐÃ CHUẨN HOÁ vào Modal
      setSelectedResForModal(formattedRestaurant); // Không cần "as any" nữa, Type đã chuẩn khớp 100%
      setIsModalOpen(true); 

      if (commentId) {
        sessionStorage.setItem("targetCommentId", commentId);
      }
    }
  }, [action, resId, commentId, restaurants]);
  
  const refreshItinerary = useCallback(() => {
    if (!propItinerary && user?.uid) {
      itineraryApi.get(user.uid).then(data => {
        if (data.status === "success") setLocalItinerary(data.itinerary || []);
      });
    }
    onItineraryChange?.();
  }, [propItinerary, user?.uid, onItineraryChange]);

  // Load itinerary once when component mounts (if not provided via props)
  useEffect(() => {
    if (!propItinerary && user?.uid) {
      itineraryApi.get(user.uid).then((data) => {
        if (data.status === "success") setLocalItinerary(data.itinerary || []);
      }).catch((e) => {
        console.warn("Failed to load itinerary:", e);
      });
    }
  }, [propItinerary, user?.uid]);

  const applyUserLocation = (lat: number, lng: number, locationLabel: string, placeId: string) => {
    setUserLocation({ lat, lng });
    setPendingFlyTo({ lat, lng });
    if (isStandalone && typeof window !== "undefined") {
      localStorage.setItem("bmi_user_location", locationLabel);
      localStorage.setItem("bmi_user_place_id", placeId);
      setStoredLocation({ location: locationLabel, placeId });
    }
    onUserLocationChange?.({ location: locationLabel, placeId });
  };

 
  const [edgeIndicators, setEdgeIndicators] = useState<any[]>([]);

  // Update edge indicators on map move/zoom
  const updateEdgeIndicators = useCallback(() => {
    if (!mapRef.current || currentItinerary.length === 0) {
      setEdgeIndicators([]);
      return;
    }

    const map = mapRef.current.getMap();
    const canvas = map.getCanvas();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const padding = 60;

    const indicators: any[] = [];

    currentItinerary.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const pos = map.project([item.lng, item.lat]);
      const isOffScreen = pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height;

      if (isOffScreen) {
        // Clamp position to edges
        let edgeX = Math.max(padding, Math.min(width - padding, pos.x));
        let edgeY = Math.max(padding, Math.min(height - padding, pos.y));
        
        // Determine arrow direction
        let direction = "up";
        if (pos.x < 0) direction = "left";
        else if (pos.x > width) direction = "right";
        else if (pos.y < 0) direction = "up";
        else if (pos.y > height) direction = "down";

        indicators.push({
          id: item.id,
          name: item.name,
          x: edgeX,
          y: edgeY,
          direction,
          lat: item.lat,
          lng: item.lng
        });
      }
    });

    setEdgeIndicators(indicators);
  }, [currentItinerary]);

  useEffect(() => {
    if (mapLoaded) {
      updateEdgeIndicators();
    }
  }, [mapLoaded, updateEdgeIndicators, zoom]);

  // 1. Fetch and Clean Map Style
  useEffect(() => {
    async function loadStyle() {
      try {
        const response = await fetch(GOONG_MAP_STYLE_URL);
        const style = await response.json();
        if (style.layers) {
          style.layers = style.layers.filter((layer: any) => {
            const id = layer.id.toLowerCase();
            const isPOI = ["poi", "transit", "landmark", "attraction", "business", "food"].some(key => id.includes(key));
            const isSymbol = layer.type === "symbol";
            return !(isPOI && isSymbol);
          });
        }
        setMapStyle(style);
      } catch (error) {
        setMapStyle(GOONG_MAP_STYLE_URL);
      }
    }
    loadStyle();
  }, []);

  // 2. Fetch restaurants
  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.bmi-foodtour.io.vn"}/api/v1/restaurants/all`);
        const data = await res.json();
        if (data.status === "success") setRestaurants(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // // 2.5 Handle Report Review from URL Query Params
  // useEffect(() => {

  //    console.log("EFFECT B RUN");
  //   const action = searchParams.get("action");
  //   const resId = searchParams.get("resId");
  //   const commentId = searchParams.get("commentId");

  //   if (action === "review_report" && resId && commentId) {
  //     setReportAction(action);
  //     setReportResId(resId);
  //     setReportCommentId(commentId);
  //   }
  // }, [searchParams]);

  // 2.6 Process Report Action (after restaurants loaded and map ready)
  useEffect(() => {
     console.log("EFFECT C RUN");
    if (
      !reportAction ||
      !reportResId ||
      !reportCommentId ||
      restaurants.length === 0 ||
      !mapLoaded ||
      !mapRef.current
    ) {
      return;
    }

    // Tìm nhà hàng có ID khớp
    const foundRes = restaurants.find(
      (r) => String(r.id) === String(reportResId)
    );

    if (!foundRes) {
      console.warn(`Restaurant with ID ${reportResId} not found`);
      return;
    }

    // Build restaurant object
    const restaurantData = buildRestaurants([foundRes])[0];

    // Fly to location
    if (mapRef.current && foundRes.lat && foundRes.lng) {
      mapRef.current.flyTo({
        center: [foundRes.lng, foundRes.lat],
        zoom: 16,
      });
    }

    // Lưu commentId vào sessionStorage để RestaurantDetailModal scroll tới
    if (typeof window !== "undefined") {
      sessionStorage.setItem("review_report_comment_id", reportCommentId);
    }

    // Mở modal chi tiết nhà hàng
    setSelectedResForModal(restaurantData);
    setIsModalOpen(true);

    // Clear report action để không lặp lại
    setReportAction(null);
  }, [reportAction, reportResId, reportCommentId, restaurants, mapLoaded]);

  // 3. Resolve user location từ userPlaceId — chỉ set state tọa độ
  //    flyTo thực hiện sau khi map load xong (xem handleMapLoad)
  useEffect(() => {
    let cancelled = false;

    async function resolveUserLocation() {
      if (effectiveUserPlaceId) {
        // Trường hợp GPS: "geo_10.76940_106.68350"
        if (effectiveUserPlaceId.startsWith("geo_")) {
          const raw = effectiveUserPlaceId.slice(4);
          // Chỉ có đúng 1 dấu "_" ngăn cách lat và lng
          const sepIdx = raw.indexOf("_");
          if (sepIdx > 0) {
            const lat = parseFloat(raw.slice(0, sepIdx));
            const lng = parseFloat(raw.slice(sepIdx + 1));
            if (!isNaN(lat) && !isNaN(lng) && !cancelled) {
                applyUserLocation(lat, lng, effectiveUserLocationText?.trim() || "Vị trí hiện tại", effectiveUserPlaceId);
            }
          }
          return;
        }

        // Trường hợp Goong place_id (nhập địa chỉ tay)
        try {
          const res = await fetch(
            `/api/maps/place-detail?place_id=${encodeURIComponent(effectiveUserPlaceId)}`
          );
          if (!res.ok || cancelled) return;
          const data = await res.json();
          if (data.status === "success" && data.data?.lat && data.data?.lng) {
            const { lat, lng } = data.data;
            if (!cancelled) {
              applyUserLocation(lat, lng, effectiveUserLocationText?.trim() || "Vị trí được chọn", effectiveUserPlaceId);
            }
          }
        } catch (e) {
          console.warn("Geocode placeId failed:", e);
        }
        return;
      }

      const query = effectiveUserLocationText?.trim();
      if (!query) return;

      try {
        const suggestionRes = await fetch(
          `/api/maps/suggestions?q=${encodeURIComponent(query)}`
        );
        if (!suggestionRes.ok || cancelled) return;

        const suggestions = await suggestionRes.json();
        const firstPlaceId = Array.isArray(suggestions)
          ? suggestions.find((item: any) => item?.place_id)?.place_id
          : null;

        if (!firstPlaceId || cancelled) return;

        const detailRes = await fetch(
          `/api/maps/place-detail?place_id=${encodeURIComponent(firstPlaceId)}`
        );
        if (!detailRes.ok || cancelled) return;

        const data = await detailRes.json();
        if (data.status === "success" && data.data?.lat && data.data?.lng && !cancelled) {
          const { lat, lng } = data.data;
          applyUserLocation(lat, lng, query, firstPlaceId);
        }
      } catch (e) {
        console.warn("Geocode fallback failed:", e);
      }
    }

    resolveUserLocation();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserPlaceId, effectiveUserLocationText]);

  useEffect(() => {
    if (!isStandalone || !storageChecked || effectiveUserPlaceId || effectiveUserLocationText || userLocation) {
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const { latitude, longitude } = position.coords;
        applyUserLocation(latitude, longitude, "Vị trí hiện tại", `geo_${latitude}_${longitude}`);
      },
      (error) => {
        console.warn("Auto geolocation failed:", error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );

    return () => {
      cancelled = true;
    };
  }, [isStandalone, storageChecked, effectiveUserPlaceId, effectiveUserLocationText, userLocation]);

  // 4. Thực hiện flyTo SAU KHI map đã load và có tọa độ
  useEffect(() => {
    if (mapLoaded && pendingFlyTo && mapRef.current) {
      mapRef.current.flyTo({ center: [pendingFlyTo.lng, pendingFlyTo.lat], zoom: 16 });
      setPendingFlyTo(null);
    }
  }, [mapLoaded, pendingFlyTo]);

  const geoJsonData = useMemo(() => convertToGeoJSON(restaurants), [restaurants]);

  const clusterLayer: any = {
    id: "clusters",
    type: "circle",
    source: "restaurants",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
      "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#fff",
    },
  };

  const clusterCountLayer: any = {
    id: "cluster-count",
    type: "symbol",
    source: "restaurants",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["Noto Sans Regular"],
      "text-size": 12,
    },
  };

  const onMapClick = (event: any) => {
    const feature = event.features?.[0];
    if (feature && feature.layer.id === "clusters") {
      const clusterId = feature.properties.cluster_id;
      const mapSource: any = mapRef.current?.getSource("restaurants");
      mapSource.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (!err) mapRef.current?.easeTo({ center: feature.geometry.coordinates, zoom });
      });
    }
  };

  const handleOpenModal = (resProps: any) => {
    const formatted = buildRestaurants([resProps])[0];
    setSelectedResForModal(formatted);
    setIsModalOpen(true);
  };

  // ── Thêm vào lịch trình ────────────────────────────────────────────────────
  const handleAddToItinerary = useCallback(async (meal: string) => {
    if (!user?.uid || !popupInfo) return;


    setAddingMeal(true);
    setShowMealPicker(false);
    setAddError(null);

    try {
      const rawItem = { ...popupInfo };

      rawItem.source = "user";

      const restaurantData = buildRestaurants([rawItem])[0];
      const data = await itineraryApi.select(user.uid, meal, restaurantData);
      if (data.status === "success") {
        setAddSuccess(meal);
        console.log("CALLING refreshItinerary");
        refreshItinerary();
        setTimeout(() => setAddSuccess(null), 2500);
      } else {
        setAddError("Không thể thêm vào lịch trình.");
      }
    } catch (e) {
      setAddError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setAddingMeal(false);
    }
  }, [user, popupInfo, refreshItinerary]);

  // Kiểm tra quán đã có trong lịch trình chưa
  const isAlreadyInItinerary = useMemo(() => {
    if (!popupInfo) return false;
    return currentItinerary.some((stop) => stop.id === popupInfo.id || String(stop.id) === String(popupInfo.id) || stop.name === popupInfo.name);
  }, [popupInfo, currentItinerary]);

  const availableMealOptions = useMemo(() => {
    if (!popupInfo) return [];
    return getRestaurantMealOptions(popupInfo);
  }, [popupInfo]);

  // Meal đã dùng để hiển thị hành động thay thế, backend select sẽ thay quán cũ trong bữa đó.
  const usedMealSet = useMemo(() => {
    return new Set(
      currentItinerary
        .map((stop) => normalizeMealKey(stop.meal))
        .filter(Boolean)
    );
  }, [currentItinerary]);

  const getMealActionLabel = useCallback((meal: string) => {
    const mealText = meal.toLowerCase();
    return usedMealSet.has(normalizeMealKey(meal))
      ? `Thay thế ${mealText}`
      : `Thêm vào ${mealText}`;
  }, [usedMealSet]);

  // Reset meal picker khi đổi popup
  useEffect(() => {
    setShowMealPicker(false);
    setAddSuccess(null);
    setAddError(null);
  }, [popupInfo?.id]);

  if (loading || !mapStyle) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

console.log("popupInfo", popupInfo);

console.log("selectedResForModal", selectedResForModal);

console.log("currentItinerary", currentItinerary);

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={DEFAULT_VIEW_STATE}
        mapStyle={mapStyle}
        mapLib={maplibregl}
        ref={mapRef}
        onClick={onMapClick}
        onZoom={(e) => setZoom(e.viewState.zoom)}
        onMove={updateEdgeIndicators}
        onLoad={() => {
          setMapLoaded(true);
          updateEdgeIndicators();
        }}
        interactiveLayerIds={["clusters"]}
        style={{ width: "100%", height: "100%" }}
      >
        <GeolocateControl
          position="top-right"
          showUserLocation={false}
          onGeolocate={(evt) => {
            const lat = evt.coords.latitude;
            const lng = evt.coords.longitude;
            applyUserLocation(lat, lng, "Vị trí hiện tại", `geo_${lat}_${lng}`);
          }}
          onError={(evt) => {
            console.warn("GeolocateControl error:", evt.message);
          }}
        />
        <NavigationControl position="top-right" />

        <Source
          id="restaurants"
          type="geojson"
          data={geoJsonData as any}
          cluster={true}
          clusterMaxZoom={13}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
        </Source>

        {/* MARKERS */}
        {restaurants.map((res: any, idx) => {
          // Consider a restaurant selected when it's in the itinerary OR
          // when it's the one currently opened in the detail modal (`selectedResForModal`).
          const isSelected =
            (selectedResForModal && String(selectedResForModal.id) === String(res.id)) ||
            currentItinerary.some((stop) => String(stop.id) === String(res.id) || stop.name === res.name);
          // Always show markers for selected restaurants, even when zoomed out
          if (zoom <= 13 && !isSelected) return null;

          return (
            <Marker
              key={`res-${res.id || idx}`}
              longitude={res.lng}
              latitude={res.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(res);
              }}
              style={{ zIndex: isSelected ? 10 : 1 }}
            >
              <div className={`relative flex flex-col items-center group cursor-pointer ${isSelected ? "scale-110" : ""}`}>
                {/* HIỆU ỨNG TỎA SÁNG RỘNG KHI ĐƯỢC CHỌN */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-3">
                    <div className="absolute w-12 h-12 rounded-full bg-rose-500 animate-sonar" />
                    <div className="absolute w-12 h-12 rounded-full bg-brand-coral animate-sonar [animation-delay:0.9s]" />
                  </div>
                )}

                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 shadow-xl transition-all group-hover:scale-125
                    ${isSelected ? "border-rose-500 ring-2 ring-white z-10 bg-brand-coral" : "border-white bg-white"}`}
                  style={{ backgroundColor: isSelected ? undefined : convertToGeoJSON([res]).features[0].properties.mapColor }}
                >
                  <span className={`text-lg ${isSelected ? "animate-pulse" : ""}`}>
                    {isSelected ? "📍" : convertToGeoJSON([res]).features[0].properties.mapIcon}
                  </span>
                </div>
                <div className={`relative z-10 mt-1.5 max-w-[160px] rounded-lg border px-2.5 py-1 shadow-md transition-colors sm:max-w-[220px]
                  ${isSelected ? "bg-rose-600 border-rose-500" : "bg-white/95 border-slate-100"}`}>
                  <p className={`truncate text-[11px] font-black ${isSelected ? "text-white" : "text-slate-800"}`}>
                    {isSelected && "🌟 "}{res.name}
                  </p>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* EXTRA ITINERARY MARKERS (For items not in the main list) */}
        {currentItinerary.filter(stop => 
          !restaurants.some(res => String(res.id) === String(stop.id) || res.name === stop.name)
        ).map((stop, idx) => (
          <Marker
            key={`itinerary-${stop.id || idx}`}
            longitude={stop.lng}
            latitude={stop.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(stop);
            }}
            style={{ zIndex: 11 }}
          >
            <div className="relative flex flex-col items-center group cursor-pointer scale-110">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-3">
                <div className="absolute w-12 h-12 rounded-full bg-rose-500 animate-sonar" />
                <div className="absolute w-12 h-12 rounded-full bg-brand-coral animate-sonar [animation-delay:0.9s]" />
              </div>
              
              <div className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 border-rose-500 ring-2 ring-white bg-brand-coral shadow-xl transition-all group-hover:scale-125">
                <span className="text-lg animate-pulse">📍</span>
              </div>
              <div className="relative z-10 mt-1.5 max-w-[160px] rounded-lg border border-rose-500 bg-rose-600 px-2.5 py-1 shadow-md transition-colors sm:max-w-[220px]">
                <p className="truncate text-[11px] font-black text-white">🌟 {stop.name}</p>
              </div>
            </div>
          </Marker>
        ))}

        {/* USER LOCATION MARKER */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping" />
              <div className="relative w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-2xl" />
            </div>
          </Marker>
        )}

        {/* POPUP */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            anchor="bottom"
            offset={40}
            onClose={() => { setPopupInfo(null); setShowMealPicker(false); }}
            closeButton={false}
            className="z-50"
          >
            <div className="w-[min(260px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl">
              <img src={popupInfo.image_url || popupInfo.imageUrl || "/assets/images/AI.png"} className="w-full h-32 object-cover" />
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight line-clamp-2">{popupInfo.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center text-xs font-bold text-yellow-500">
                      <Star className="w-3.5 h-3.5 fill-current mr-0.5" /> {popupInfo.star || popupInfo.rating}
                    </div>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {Array.isArray(popupInfo.type) ? popupInfo.type[0] : (popupInfo.meals?.[0] || "Nhà hàng")}
                    </span>
                  </div>
                </div>
                <div className="flex items-start text-[11px] text-slate-500 italic">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>{popupInfo.address}</span>
                </div>

                {/* ── Thêm vào lịch trình ── */}
                {user ? (
                  <div className="space-y-2">
                    {addError && (
                      <p className="text-[11px] text-red-500 font-semibold text-center">{addError}</p>
                    )}

                    {isAlreadyInItinerary && !addSuccess ? (
                      <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl">
                        <Check className="w-3.5 h-3.5" />
                        Đã có trong lịch trình
                      </div>
                    ) : addSuccess ? (
                      <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-50 border border-green-200 text-green-600 text-xs font-bold rounded-xl animate-pulse">
                        <Check className="w-3.5 h-3.5" />
                        Đã thêm vào {addSuccess}!
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowMealPicker((v) => !v)}
                          disabled={addingMeal}
                          className="w-full py-2.5 bg-gradient-to-r from-brand-coral to-brand-flame hover:opacity-90 text-white text-xs font-bold rounded-xl shadow transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {addingMeal ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Đang thêm...</>
                          ) : (
                            <><Plus className="w-4 h-4" /> Thêm vào lịch trình <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMealPicker ? "rotate-180" : ""}`} /></>
                          )}
                        </button>

                        {/* Meal picker dropdown */}
                        {showMealPicker && (
                          <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-slate-100 shadow-xl overflow-hidden z-10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2.5 pb-1">Chọn bữa ăn</p>
                            <button
                              onClick={() => {
                                const suggested = inferMealFromRestaurant(popupInfo);
                                if (
                                  suggested &&
                                  availableMealOptions.some((meal) => normalizeMealKey(meal) === normalizeMealKey(suggested))
                                ) {
                                  handleAddToItinerary(suggested);
                                } else {
                                  setAddError("Không thể gợi ý bữa ăn tự động.");
                                }
                              }}
                              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-orange-50 hover:text-brand-coral"
                            >
                              <span>Tự động (gợi ý)</span>
                              <span className="min-w-0 text-right text-[10px] font-normal text-slate-400">Gợi ý theo giờ mở</span>
                            </button>

                            {availableMealOptions.length > 0 ? (
                              availableMealOptions.map((meal) => {
                                const isUsed = usedMealSet.has(normalizeMealKey(meal));
                                return (
                                  <button
                                    key={normalizeMealKey(meal)}
                                    onClick={() => handleAddToItinerary(meal)}
                                    className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between
                                      ${isUsed
                                        ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                                        : "text-slate-700 hover:bg-orange-50 hover:text-brand-coral"
                                      }`}
                                  >
                                    <span>{meal}</span>
                                    <span className={`text-[10px] font-normal ${isUsed ? "text-amber-600" : "text-slate-400"}`}>
                                      {getMealActionLabel(meal)}
                                    </span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2.5 text-xs font-semibold text-slate-400">
                                Quán này chưa có bữa phù hợp
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    Đăng nhập để thêm lịch trình
                  </Link>
                )}

                <button
                  onClick={() => handleOpenModal(popupInfo)}
                  className="w-full py-2 border border-slate-200 hover:border-brand-coral text-slate-600 hover:text-brand-coral text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Info className="w-3.5 h-3.5" /> Xem chi tiết nhà hàng
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* EDGE INDICATORS (Arrows) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {edgeIndicators.map((ind) => (
          <div
            key={ind.id}
            className="absolute flex flex-col items-center gap-1 transition-all duration-300 ease-out"
            style={{
              left: ind.x,
              top: ind.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({ center: [ind.lng, ind.lat], zoom: 16 });
                  // Tìm quán trong list hoặc itinerary để hiện popup
                  const res = currentItinerary.find(item => String(item.id) === String(ind.id)) || 
                             restaurants.find(item => String(item.id) === String(ind.id));
                  if (res) setPopupInfo(res);
                }
              }}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-rose-500 text-white rounded-full shadow-lg border-2 border-white hover:bg-rose-600 transition-colors active:scale-90"
            >
              {ind.direction === "up" && <ArrowUp className="w-3.5 h-3.5 animate-bounce" />}
              {ind.direction === "down" && <ArrowDown className="w-3.5 h-3.5 animate-bounce" />}
              {ind.direction === "left" && <ArrowLeft className="w-3.5 h-3.5 animate-bounce" />}
              {ind.direction === "right" && <ArrowRight className="w-3.5 h-3.5 animate-bounce" />}
              <span className="text-[10px] font-bold whitespace-nowrap max-w-[100px] truncate">{ind.name}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Floating Header UI — chỉ hiện khi fullscreen (/explore), ẩn khi trong panel */}
      {isStandalone && (
        <>
        <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100vw-6rem)] sm:left-8 sm:top-8 sm:max-w-none">
          <div className="pointer-events-auto rounded-2xl border border-white/40 bg-white/85 px-3 py-2 shadow-xl backdrop-blur-xl sm:rounded-[24px] sm:p-5 sm:shadow-2xl">
            <h1 className="flex items-center gap-2 text-sm font-black text-slate-800 sm:gap-3 sm:text-2xl">
              <Navigation className="h-4 w-4 fill-current text-rose-500 sm:h-7 sm:w-7" />
              Khám phá Ẩm thực
            </h1>
            <p className="ml-6 mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:ml-10 sm:mt-1 sm:text-xs sm:tracking-[0.2em]">
              Dữ liệu độc quyền • {restaurants.length} địa điểm
            </p>
          </div>

          <Link
            href="/app"
            className="group pointer-events-auto mt-4 hidden w-fit items-center gap-3 rounded-[20px] border border-white/10 bg-slate-900 px-7 py-4 text-sm font-bold text-white shadow-2xl transition-all hover:bg-slate-800 active:scale-95 sm:flex"
          >
            <MessageSquare className="h-5 w-5 text-rose-400 transition-transform group-hover:scale-110" />
            Quay lại Chat AI
          </Link>
        </div>

        <div className="pointer-events-none absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-10 sm:hidden">
          <Link
            href="/app"
            className="pointer-events-auto flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 text-sm font-bold text-white shadow-2xl active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4 text-rose-400" />
            Quay lại Chat AI
          </Link>
        </div>
        </>
      )}

      <RestaurantDetailModal restaurant={selectedResForModal} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

