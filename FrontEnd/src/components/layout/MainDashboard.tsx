"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CalendarCheck, ArrowLeft, X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import SidebarNav from "./SidebarNav";
import ChatInterface from "@/components/sections/ChatInterface";
import ProfileSettings from "@/components/sections/ProfileSettings";
import ItineraryPanel from "./ItineraryPanel";
import { Restaurant, buildRestaurants } from "@/lib/utils";
import type { LearningMethodId } from "@/lib/learningMockData";

// export type DashboardState = {
//   location: string;
//   placeId: string;
//   budget: string;
//   filters: string[];
//   selectedRestaurants: Restaurant[];
// };

// type ChatSession = {
//   id: string;
//   title: string;
//   updated_at: string;
// };

// type ChatMessage = {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   timestamp?: string;
//   isCompact?: boolean;
//   restaurants?: Restaurant[];
//   metadata?: {
//     restaurants?: Restaurant[];
//   };
// };

type MainDashboardProps = {
  courseIdFromUrl?: string;
  topicIdFromUrl?: string;
  modeFromUrl?: LearningMethodId;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.bmi-foodtour.io.vn";

export default function MainDashboard({ courseIdFromUrl, topicIdFromUrl, modeFromUrl }: MainDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("chat_id");
  const { user } = useAuth();

  // Panel visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // URL params
  const params = useParams();
  const courseIdFromPath = (params && (params as any).courseId) || "";
  const topicIdFromPath = (params && (params as any).topicId) || "";
  const courseIdFromQuery = searchParams.get("courseId") || "";
  const topicIdFromQuery = searchParams.get("topicId") || "";

  // Learning selection
  const [selectedLearningMethod, setSelectedLearningMethod] = useState<LearningMethodId>(modeFromUrl || "flashcard");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [itineraryTab, setItineraryTab] = useState<"itinerary" | "detail">("itinerary");
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [currentItinerary, setCurrentItinerary] = useState<any[]>([]);

  // Chat

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Mobile itinerary bubble
  const [itineraryBubblePosition, setItineraryBubblePosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return { x: window.innerWidth - 68, y: window.innerHeight - 144 };
  });
  const itineraryBubbleDragRef = useRef({ pointerId: -1, offsetX: 0, offsetY: 0, moved: false });

  // ────────── Effects ──────────

  useEffect(() => {
    const chosenCourseId = courseIdFromUrl || courseIdFromPath || courseIdFromQuery;
    const chosenTopicId = topicIdFromUrl || topicIdFromPath || topicIdFromQuery;

    if (chosenCourseId && chosenCourseId !== selectedCourseId) {
      setSelectedCourseId(chosenCourseId);
      setSelectedCourseTitle("");
    }
    if (chosenTopicId && chosenTopicId !== selectedTopicId) {
      setSelectedTopicId(chosenTopicId);
      setSelectedTopicTitle("");
    }
    if (modeFromUrl) {
      setSelectedLearningMethod(modeFromUrl);
    }
  }, [courseIdFromUrl, courseIdFromPath, courseIdFromQuery, topicIdFromUrl, topicIdFromPath, topicIdFromQuery, modeFromUrl, selectedCourseId, selectedTopicId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (event.matches) {
        setItineraryBubblePosition((pos) =>
          snapItineraryBubbleToEdge(pos.x || window.innerWidth - 68, pos.y || window.innerHeight - 144)
        );
      }
    };
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.matches) {
      setItineraryBubblePosition((pos) =>
        snapItineraryBubbleToEdge(pos.x || window.innerWidth - 68, pos.y || window.innerHeight - 144)
      );
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const handleResize = () =>
      setItineraryBubblePosition((pos) => snapItineraryBubbleToEdge(pos.x, pos.y));
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // // ────────── Itinerary ──────────

  // const fetchItinerary = async () => {
  //   if (!user?.uid) return;
  //   try {
  //     const data = await itineraryApi.get(user.uid);
  //     if (data.status === "success") {
  //       setCurrentItinerary(buildRestaurants(data.itinerary));
  //     }
  //   } catch (err) {
  //     console.error("Error fetching itinerary:", err);
  //   }
  // };

  // const handleSelectMeal = async (meal: string, restaurant: Restaurant) => {
  //   if (!user?.uid) { router.push("/login"); return; }
  //   try {
  //     const data = await itineraryApi.select(user.uid, meal, restaurant);
  //     if (data.status === "success") await fetchItinerary();
  //   } catch (err) {
  //     console.error("Error selecting meal:", err);
  //   }
  // };

  // const handleDeleteMeal = async (itemId: string) => {
  //   if (!user?.uid) return;
  //   try {
  //     const data = await itineraryApi.deleteMeal(user.uid, itemId);
  //     if (data.status === "success") await fetchItinerary();
  //   } catch (err) {
  //     console.error("Error deleting meal:", err);
  //   }
  // };

  // const handleResetItinerary = async () => {
  //   if (!user?.uid) return;
  //   try {
  //     const data = await itineraryApi.reset(user.uid);
  //     if (data.status === "success") await fetchItinerary();
  //   } catch (err) {
  //     console.error("Error resetting itinerary:", err);
  //   }
  // };

  // const handleReorder = async (orderedItems: { id: string }[]) => {
  //   if (!user?.uid) return;
  //   try {
  //     const mealMap = new Map(currentItinerary.map((item) => [item.id, item]));
  //     const newItinerary = orderedItems
  //       .map((item) => mealMap.get(item.id))
  //       .filter((item): item is NonNullable<typeof item> => Boolean(item));
  //     setCurrentItinerary(newItinerary);
  //     const data = await itineraryApi.reorder(user.uid, orderedItems);
  //     if (data.status !== "success") await fetchItinerary();
  //   } catch (err) {
  //     console.error("Error reordering itinerary:", err);
  //     await fetchItinerary();
  //   }
  // };

  

  // const fetchChatMessages = async (chatId: string) => {
  //   if (!user?.uid) return;
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/user/chat/${user.uid}/${chatId}/messages`);
  //     const data = await response.json();
  //     if (data.status === "success") {
  //       const processedMessages = data.messages.map((msg: any) => {
  //         if (msg.role === "assistant" && msg.metadata) {
  //           const rawItems = msg.metadata.restaurants || msg.metadata.result || [];
  //           if (rawItems.length > 0) return { ...msg, restaurants: buildRestaurants(rawItems) };
  //         }
  //         return msg;
  //       });
  //       setCurrentMessages(processedMessages);

  //       const assistantMsgsWithResults = processedMessages
  //         .filter((m: any) => m.role === "assistant" && m.restaurants)
  //         .reverse();
  //       setDashboardState((prev) => ({
  //         ...prev,
  //         selectedRestaurants: assistantMsgsWithResults.length > 0 ? assistantMsgsWithResults[0].restaurants : [],
  //       }));
  //     }
  //   } catch (err) {
  //     console.error("Error fetching chat messages:", err);
  //   }
  // };

  // const startLocalNewChat = () => {
  //   setCurrentChatId(null);
  //   setCurrentMessages([]);
  //   setDashboardState((prev) => ({ ...prev, budget: "", filters: [], selectedRestaurants: [] }));
  //   handleResetItinerary();
  // };

  // const handleNewChat = async () => {
  //   if (!user?.uid) { router.push("/login"); return null; }
  //   try {
  //     await handleResetItinerary();
  //     const response = await fetch(`${API_BASE_URL}/api/user/chat/new/${user.uid}`, { method: "POST" });
  //     const data = await response.json();
  //     if (data.status === "success") {
  //       setCurrentChatId(data.chat_id);
  //       await fetchChatMessages(data.chat_id);
  //       return data.chat_id;
  //     }
  //   } catch (err) {
  //     console.error("Error creating new chat:", err);
  //   }
  //   return null;
  // };

  // const handleChatSelect = (chatId: string) => {
  //   setCurrentChatId(chatId);
  //   setCurrentMessages([]);
  //   fetchChatMessages(chatId);
  // };

  // const handleDeleteChat = async (chatId: string) => {
  //   if (!user?.uid) return;
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/user/chat/${user.uid}/${chatId}`, { method: "DELETE" });
  //     const data = await response.json();
  //     if (data.status === "success") {
  //       if (currentChatId === chatId) {
  //         setCurrentChatId(null);
  //         setCurrentMessages([]);
  //         setDashboardState((prev) => ({ ...prev, selectedRestaurants: [] }));
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Error deleting chat:", err);
  //   }
  // };

  // // ────────── UI helpers ──────────

  // const budgetDisplay = useMemo(() => {
  //   const amount = Number(dashboardState.budget);
  //   if (!amount || Number.isNaN(amount)) return "Chưa nhập";
  //   return `${amount.toLocaleString("vi-VN")} VNĐ`;
  // }, [dashboardState.budget]);

  // const mealTypes = ["Cafe", "Bistro", "Fine Dining", "Street Food"];
  // const getTravelTime = () => `${Math.floor(10 + Math.random() * 11)}p`;

  // const mealStops = useMemo(
  //   () =>
  //     dashboardState.selectedRestaurants.slice(0, 3).map((restaurant, index) => ({
  //       label: `STOP ${String(index + 1).padStart(2, "0")}`,
  //       name: restaurant.name || "Chưa có dữ liệu",
  //       time: getTravelTime(),
  //       price:
  //         typeof restaurant.price === "number"
  //           ? `${restaurant.price.toLocaleString("vi-VN")}đ`
  //           : restaurant.price || "Chưa cập nhật",
  //       type: restaurant.meals?.[0]?.trim() || mealTypes[index] || "Cafe",
  //       rating: restaurant.rating ?? 0,
  //     })),
  //   [dashboardState.selectedRestaurants]
  // );

  // const selectedRestaurant = useMemo(
  //   () => dashboardState.selectedRestaurants.find((r) => r.id === selectedRestaurantId) || null,
  //   [dashboardState.selectedRestaurants, selectedRestaurantId]
  // );

  const isRightPanelExpanded = (itineraryTab === "detail" && !!selectedRestaurantId) || showBoardingPass;

  const handleSidebarToggle = () => {
    if (isMobile) { setMobileSidebarOpen((prev) => !prev); return; }
    setSidebarOpen((prev) => !prev);
  };

  const handleItineraryTabChange = (tab: "itinerary" | "detail") => {
    if (tab !== "detail") setSelectedRestaurantId(null);
    if (tab !== "itinerary") setShowBoardingPass(false);
    setItineraryTab(tab);
  };

  const handleRestaurantSelect = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setShowBoardingPass(false);
    setItineraryTab("detail");
    if (isMobile) { setRestaurantModalOpen(true); setMobileItineraryOpen(false); }
  };

  const handleCloseDetail = () => {
    setSelectedRestaurantId(null);
    setItineraryTab("itinerary");
    setRestaurantModalOpen(false);
  };

  // const handleStateChange = (newState: DashboardState) => {
  //   if (newState.location !== dashboardState.location) {
  //     localStorage.setItem("bmi_user_location", newState.location);
  //     localStorage.setItem("bmi_user_place_id", newState.placeId);
  //   }
  //   setDashboardState(newState);
  // };

  // const handleUserLocationChange = (nextLocation: { location: string; placeId: string }) => {
  //   setDashboardState((prev) => {
  //     const nextState = { ...prev, location: nextLocation.location, placeId: nextLocation.placeId };
  //     localStorage.setItem("bmi_user_location", nextState.location);
  //     localStorage.setItem("bmi_user_place_id", nextState.placeId);
  //     return nextState;
  //   });
  // };

  const handleProfileOpen = () => {
    if (!user?.uid) { router.push("/login"); return; }
    setProfileOpen(true);
  };

  // Mobile bubble helpers
  const clampBubble = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const sz = 56, inset = 12, top = 84, bottom = 88;
    return {
      x: Math.min(Math.max(x, inset), window.innerWidth - sz - inset),
      y: Math.min(Math.max(y, top), window.innerHeight - sz - bottom),
    };
  };

  const snapItineraryBubbleToEdge = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const sz = 56, inset = 12;
    const clamped = clampBubble(x, y);
    return {
      x: clamped.x + sz / 2 < window.innerWidth / 2 ? inset : window.innerWidth - sz - inset,
      y: clamped.y,
    };
  };

  const handleBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    itineraryBubbleDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = itineraryBubbleDragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    const next = clampBubble(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
    if (Math.abs(next.x - itineraryBubblePosition.x) > 2 || Math.abs(next.y - itineraryBubblePosition.y) > 2) {
      drag.moved = true;
    }
    setItineraryBubblePosition(next);
  };

  const handleBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = itineraryBubbleDragRef.current;
    if (drag.pointerId !== event.pointerId) return;
    setItineraryBubblePosition((pos) => snapItineraryBubbleToEdge(pos.x, pos.y));
    event.currentTarget.releasePointerCapture(event.pointerId);
    itineraryBubbleDragRef.current = { ...drag, pointerId: -1 };
  };

  const handleBubbleClick = () => {
    if (itineraryBubbleDragRef.current.moved) {
      itineraryBubbleDragRef.current.moved = false;
      return;
    }
    setItineraryTab("itinerary");
    setMobileItineraryOpen(true);
  };

  // ────────── Render ──────────

  const itineraryPanelProps = {
    
    selectedRestaurantId,
    currentTab: itineraryTab,
    onSelectRestaurant: handleRestaurantSelect,
    onTabChange: handleItineraryTabChange,
    onCloseDetail: handleCloseDetail,
    currentItinerary,
    onShowBoardingPassChange: setShowBoardingPass,
    selectedLearningMethod,
    onSelectLearningMethod: setSelectedLearningMethod,
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-slate-100">
      {/* ── Top Navigation ── */}
      <nav className="relative flex items-center justify-between border-b border-slate-200/60 bg-slate-50/70 px-4 py-3 backdrop-blur sm:px-6">

        {/* Left: menu toggle + back link */}
          <div className="z-10 flex items-center gap-2">
            {/* Nút Quay lại: Hiện icon trên mobile, đầy đủ chữ trên desktop */}
            <Link
              href="/"
              className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
              title="Quay lại"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Quay lại</span>
            </Link>

            {/* Toggle left sidebar */}
            <button
              type="button"
              onClick={handleSidebarToggle}
              title={sidebarOpen ? "Ẩn cột trái" : "Hiện cột trái"}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
            >
              {(isMobile ? mobileSidebarOpen : sidebarOpen)
                ? <PanelLeftClose size={18} />
                : <PanelLeftOpen size={18} />}
            </button>
          </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="group flex cursor-pointer items-center justify-center">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-400/10 via-blue-500/10 to-indigo-500/15 p-2 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/40 group-hover:shadow-md group-hover:shadow-sky-500/10">
              <div className="absolute inset-0 rounded-2xl bg-sky-400/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
              <img
                src="/assets/images/web_logo.png"
                alt="ELA Logo"
                className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Right: toggle right panel + avatar */}
        <div className="z-10 flex items-center gap-2">
          {/* Toggle right panel — only visible on lg+ */}
          <button
            type="button"
            onClick={() => setRightPanelOpen((prev) => !prev)}
            title={rightPanelOpen ? "Ẩn cột phải" : "Hiện cột phải"}
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:flex"
          >
            {rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>

          {user ? (
            <div className="relative group">
              <button className="flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm transition hover:bg-slate-50 sm:h-auto sm:w-auto sm:justify-start sm:pr-3.5">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=ff6b4a&color=fff`}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover bg-slate-100 sm:h-8 sm:w-8"
                  onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=U&background=ff6b4a&color=fff")}
                />
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="max-w-[100px] truncate text-xs font-bold leading-tight text-slate-800">
                    {user.displayName || "Người dùng"}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-coral hover:text-brand-coral hover:shadow-sm"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex h-[calc(100dvh-57px)] w-full overflow-hidden">

        {/* Left Sidebar */}
        <aside
          className={
            isMobile
              ? `fixed inset-0 z-40 flex w-full flex-col overflow-hidden bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 ease-out ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`
              : `${sidebarOpen ? "w-80 flex-shrink-0" : "w-0"} flex flex-col overflow-hidden border-r border-slate-200/60 bg-white/70 backdrop-blur transition-all duration-300 ease-out`
          }
        >
          {isMobile && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/90 px-4 py-2 backdrop-blur md:hidden">
              <span className="text-xs font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <SidebarNav
        
              onOpenProfileSettings={handleProfileOpen}
              onTabChange={handleItineraryTabChange}
              currentChatId={currentChatId}
              selectedCourseId={selectedCourseId}
              selectedTopicId={selectedTopicId}
              onCourseSelect={(courseId, courseTitle) => {
                setSelectedCourseId(courseId);
                setSelectedCourseTitle(courseTitle);
                setSelectedTopicId("");
                setSelectedTopicTitle("");
              }}
              onTopicSelect={(topicId, topicTitle) => {
                setSelectedTopicId(topicId);
                setSelectedTopicTitle(topicTitle);
              }}
            />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex flex-1 min-h-0 flex-col overflow-hidden bg-slate-50 /70">
          <ChatInterface
    
            chatId={currentChatId}

            onRestaurantSelect={handleRestaurantSelect}
            currentItinerary={currentItinerary}
            selectedLearningMethod={selectedLearningMethod}
            selectedCourseId={selectedCourseId}
            selectedCourseTitle={selectedCourseTitle}
            selectedTopicId={selectedTopicId}
            selectedTopicTitle={selectedTopicTitle}
          />
        </main>

        {/* Right Panel — desktop only, toggleable */}
        <aside
          className={`hidden overflow-y-auto border-l border-slate-200/60 bg-white/70 backdrop-blur lg:block transition-all duration-300 ${rightPanelOpen ? (isRightPanelExpanded ? "w-[450px]" : "w-80") : "w-0"
            }`}
        >
          {rightPanelOpen && <ItineraryPanel {...itineraryPanelProps} />}
        </aside>
      </div>

      {/* ── Mobile: floating itinerary bubble ── */}
      {!mobileItineraryOpen && (
        <button
          type="button"
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onPointerCancel={handleBubblePointerUp}
          onClick={handleBubbleClick}
          className="fixed z-30 inline-flex h-14 w-14 touch-none items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-lagoon text-white shadow-glow transition-[box-shadow,transform] duration-200 hover:scale-105 active:scale-95 md:hidden"
          style={{ left: itineraryBubblePosition.x, top: itineraryBubblePosition.y }}
          aria-label="Mở lịch trình"
        >
          <span className="relative">
            <CalendarCheck size={20} />
            {currentItinerary.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-coral text-[10px] font-semibold text-white shadow">
                {currentItinerary.length > 9 ? "9+" : currentItinerary.length}
              </span>
            )}
          </span>
        </button>
      )}

      {/* ── Mobile: itinerary sheet ── */}
      {mobileItineraryOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Lịch trình</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Tổng hợp</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileItineraryOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ItineraryPanel {...itineraryPanelProps} />
          </div>
        </div>
      )}

      {/* ── Mobile: restaurant detail modal ── */}
      {restaurantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm md:hidden">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <button
              type="button"
              onClick={handleCloseDetail}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Profile modal ── */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative h-full w-full max-w-4xl overflow-y-auto rounded-[32px] bg-white shadow-2xl sm:h-[90vh]">
            <button
              type="button"
              onClick={() => setProfileOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            <div className="min-h-full px-4 py-6 sm:px-6 sm:py-8">
              <ProfileSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
