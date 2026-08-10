"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams,useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CalendarCheck, Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import ChatInterface from "@/components/sections/ChatInterface";
import ProfileSettings from "@/components/sections/ProfileSettings";
import ItineraryPanel from "./ItineraryPanel";
import {  User, LogOut, LayoutDashboard } from "lucide-react";
import { Restaurant, buildRestaurants } from "@/lib/utils";
import { itineraryApi } from "@/lib/api";
import type { LearningMethodId } from "@/lib/learningMockData";

export type DashboardState = {
  location: string;
  placeId: string;
  budget: string;
  filters: string[];
  selectedRestaurants: Restaurant[];
};

type ChatSession = {
  id: string;
  title: string;
  updated_at: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isCompact?: boolean;
  restaurants?: Restaurant[];
  metadata?: {
    restaurants?: Restaurant[];
  };
};

type MainDashboardProps = {
  courseIdFromUrl?: string;
};

export default function MainDashboard({ courseIdFromUrl }: MainDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChatId = searchParams.get("chat_id");
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileItineraryOpen, setMobileItineraryOpen] = useState(false);
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const params = useParams();
  const courseIdFromPath = (params && (params as any).courseId) || "";
  const courseIdFromQuery = searchParams.get("courseId") || "";
  const [itineraryBubblePosition, setItineraryBubblePosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    return {
      x: window.innerWidth - 68,
      y: window.innerHeight - 144
    };
  });
  const itineraryBubbleDragRef = useRef({
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    moved: false
  });
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    location: "",
    placeId: "",
    budget: "",
    filters: [],
    selectedRestaurants: []
  });
  const [selectedLearningMethod, setSelectedLearningMethod] = useState<LearningMethodId>("flashcard");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>("");

    useEffect(() => {
      const chosenCourseId = courseIdFromUrl || courseIdFromPath || courseIdFromQuery;
      if (!chosenCourseId) return;
      if (chosenCourseId === selectedCourseId) return;

      setSelectedCourseId(chosenCourseId);
      setSelectedCourseTitle("");
      setSelectedTopicId("");
      setSelectedTopicTitle("");
    }, [courseIdFromUrl, courseIdFromPath, courseIdFromQuery, selectedCourseId]);

  // Update localStorage when location changes from sidebar
  const handleStateChange = (newState: DashboardState) => {
    if (newState.location !== dashboardState.location) {
      localStorage.setItem("bmi_user_location", newState.location);
      localStorage.setItem("bmi_user_place_id", newState.placeId);
    }
    setDashboardState(newState);
  };

  const handleUserLocationChange = (nextLocation: { location: string; placeId: string }) => {
    setDashboardState((prev) => {
      const nextState = {
        ...prev,
        location: nextLocation.location,
        placeId: nextLocation.placeId
      };

      localStorage.setItem("bmi_user_location", nextState.location);
      localStorage.setItem("bmi_user_place_id", nextState.placeId);

      return nextState;
    });
  };


  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [itineraryTab, setItineraryTab] = useState<"itinerary" | "detail">("itinerary");
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const isInitializingChat = useRef(false);
 
  // Chat History States
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [currentItinerary, setCurrentItinerary] = useState<any[]>([]);


  const fetchItinerary = async () => {
    if (!user?.uid) return;
    try {
      const data = await itineraryApi.get(user.uid);
      if (data.status === "success") {
        // Sử dụng buildRestaurants để chuẩn hóa dữ liệu từ backend (image_url, star...) 
        // sang định dạng frontend (imageUrl, rating...)
        const processedItinerary = buildRestaurants(data.itinerary);
        setCurrentItinerary(processedItinerary);
      }
    } catch (error) {
      console.error("Error fetching itinerary:", error);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      fetchItinerary();
    }
  }, [user?.uid]);

  const handleSelectMeal = async (meal: string, restaurant: Restaurant) => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }
    try {
      const data = await itineraryApi.select(user.uid, meal, restaurant);
      if (data.status === "success") {
        await fetchItinerary();
      }
    } catch (error) {
      console.error("Error selecting meal:", error);
    }
  };

  const handleDeleteMeal = async (itemId: string) => {
    if (!user?.uid) return;
    try {
      const data = await itineraryApi.deleteMeal(user.uid, itemId);
      if (data.status === "success") {
        await fetchItinerary();
      }
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const handleResetItinerary = async () => {
    if (!user?.uid) return;
    try {
      const data = await itineraryApi.reset(user.uid);
      if (data.status === "success") {
        await fetchItinerary();
      }
    } catch (error) {
      console.error("Error resetting itinerary:", error);
    }
  };

  const handleReorder = async (orderedItems: { id: string }[]) => {
    if (!user?.uid) return;
    try {
      // Optimistic update
      const mealMap = new Map(currentItinerary.map(item => [item.id, item]));
      const newItinerary = orderedItems
        .map(item => mealMap.get(item.id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      setCurrentItinerary(newItinerary);

      const data = await itineraryApi.reorder(user.uid, orderedItems);
      if (data.status !== "success") {
        // Fallback if failed
        await fetchItinerary();
      }
    } catch (error) {
      console.error("Error reordering itinerary:", error);
      await fetchItinerary();
    }
  };

  // Removed old useEffect that always showed location prompt if empty
  // (Now handled in the mount useEffect with localStorage check)

  // Fetch chat history on user login
  useEffect(() => {
    const initChat = async () => {
      if (user?.uid) {
        if (isInitializingChat.current) return;
        isInitializingChat.current = true;

        // Fetch history to populate sidebar
        await fetchChatHistory();
        
        const sessionKey = `bmi_chat_init_${user.uid}`;
        const isSessionInitialized = sessionStorage.getItem(sessionKey);

        if (urlChatId) {
          console.log("[DASHBOARD] Opening chat from URL:", urlChatId);
          setCurrentChatId(urlChatId);
          await fetchChatMessages(urlChatId);
          sessionStorage.setItem(sessionKey, "true");
        } else if (!isSessionInitialized) {
          console.log("[DASHBOARD] New session detected. Creating auto-new chat...");
          await handleNewChat();
          sessionStorage.setItem(sessionKey, "true");
        } else if (!currentChatId) {
          // Nếu đã init rồi (ví dụ reload trang) nhưng chưa có chat hoạt động trong state
          // thì có thể load lại chat cuối cùng hoặc cứ để trống. 
          // Ở đây ta chọn load lại chat cuối để tránh bị mất context khi F5.
          const history = await fetchChatHistory();
          if (history.length > 0) {
            const latestChat = history[0];
            setCurrentChatId(latestChat.id);
            fetchChatMessages(latestChat.id);
          }
        }
        
        isInitializingChat.current = false;
      } else {
        setChatHistory([]);
        setCurrentChatId(null);
        setCurrentMessages([]);
        isInitializingChat.current = false;
        // Xóa sạch flag session khi logout để lần sau login lại sẽ tạo mới
        if (typeof window !== "undefined") {
          // Tìm và xóa các key bắt đầu bằng bmi_chat_init_
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith("bmi_chat_init_")) {
              sessionStorage.removeItem(key);
            }
          });
        }
      }
    };
    initChat();
  }, [user?.uid]);

  const fetchChatHistory = async () => {
    if (!user?.uid) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/chat/history/${user.uid}`);
      const data = await response.json();
      if (data.status === "success") {
        setChatHistory(data.history);
        return data.history;
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
    return [];
  };

  const fetchChatMessages = async (chatId: string) => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/chat/${user.uid}/${chatId}/messages`);
      const data = await response.json();
      if (data.status === "success") {
        // Chuẩn hóa tin nhắn từ history: Nếu có metadata.restaurants, chạy qua buildRestaurants
        const processedMessages = data.messages.map((msg: any) => {
          if (msg.role === "assistant" && msg.metadata) {
            const rawItems = msg.metadata.restaurants || msg.metadata.result || [];
            if (rawItems.length > 0) {
              return {
                ...msg,
                restaurants: buildRestaurants(rawItems)
              };
            }
          }
          return msg;
        });

        setCurrentMessages(processedMessages);
        
        // Cập nhật nhà hàng từ tin nhắn assistant cuối cùng có metadata
        const assistantMsgsWithResults = processedMessages
          .filter((m: any) => m.role === "assistant" && m.restaurants)
          .reverse();
        
        if (assistantMsgsWithResults.length > 0) {
          setDashboardState(prev => ({
            ...prev,
            selectedRestaurants: assistantMsgsWithResults[0].restaurants
          }));
        } else {
          setDashboardState(prev => ({
            ...prev,
            selectedRestaurants: []
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  const startLocalNewChat = () => {
    setCurrentChatId(null);
    setCurrentMessages([]);
    setDashboardState(prev => ({
      ...prev,
      budget: "",
      filters: [],
      selectedRestaurants: []
    }));
    handleResetItinerary(); // Reset lịch trình khi tạo chat mới local
  };

  const handleNewChat = async () => {
    if (!user?.uid) {
      router.push("/login");
      return null;
    }
    try {
      // Reset lịch trình khi tạo cuộc trò chuyện mới
      await handleResetItinerary();

      const response = await fetch(`${API_BASE_URL}/api/user/chat/new/${user.uid}`, {
        method: "POST"
      });
      const data = await response.json();
      if (data.status === "success") {
        setCurrentChatId(data.chat_id);
        fetchChatHistory();
        // Fetch ngay lập tức để lấy câu chào từ AI
        await fetchChatMessages(data.chat_id);
        return data.chat_id;
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
    return null;
  };

  const handleMessagesUpdate = (messages: ChatMessage[]) => {
    setCurrentMessages(messages);
  };

  const handleChatSelect = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentMessages([]); // Xóa tin nhắn cũ ngay lập tức để tránh hiển thị nhầm
    fetchChatMessages(chatId);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/chat/${user.uid}/${chatId}`, {
        method: "DELETE"
      });
      const data = await response.json();
      if (data.status === "success") {
        // Cập nhật lại lịch sử
        fetchChatHistory();
        // Nếu đang ở chat vừa xóa, chuyển sang chat khác hoặc reset
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setCurrentMessages([]);
          setDashboardState(prev => ({ ...prev, selectedRestaurants: [] }));
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
      if (event.matches) {
        setItineraryBubblePosition((position) =>
          snapItineraryBubbleToEdge(position.x || window.innerWidth - 68, position.y || window.innerHeight - 144)
        );
      }
    };
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.matches) {
      setItineraryBubblePosition((position) =>
        snapItineraryBubbleToEdge(position.x || window.innerWidth - 68, position.y || window.innerHeight - 144)
      );
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const handleResize = () => {
      setItineraryBubblePosition((position) => snapItineraryBubbleToEdge(position.x, position.y));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  const budgetDisplay = useMemo(() => {
    const amount = Number(dashboardState.budget);
    if (!amount || Number.isNaN(amount)) {
      return "Chưa nhập";
    }
    return `${amount.toLocaleString("vi-VN")} VNĐ`;
  }, [dashboardState.budget]);

  const mealTypes = ["Cafe", "Bistro", "Fine Dining", "Street Food"];

  const getTravelTime = () => `${Math.floor(10 + Math.random() * 11)}p`;

  const buildMealStops = (restaurants: Restaurant[]) =>
    restaurants.slice(0, 3).map((restaurant, index) => {
      const label = `STOP ${String(index + 1).padStart(2, "0")}`;
      const priceText =
        typeof restaurant.price === "number"
          ? `${restaurant.price.toLocaleString("vi-VN")}đ`
          : restaurant.price || "Chưa cập nhật";
      const type = restaurant.meals?.[0]?.trim() || mealTypes[index] || "Cafe";
      return {
        label,
        name: restaurant.name || "Chưa có dữ liệu",
        time: getTravelTime(),
        price: priceText,
        type,
        rating: restaurant.rating ?? 0
      };
    });

  const mealStops = useMemo(
    () => buildMealStops(dashboardState.selectedRestaurants),
    [dashboardState.selectedRestaurants]
  );

  const selectedRestaurant = useMemo(
    () =>
      dashboardState.selectedRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ||
      null,
    [dashboardState.selectedRestaurants, selectedRestaurantId]
  );

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  };

  const clampItineraryBubblePosition = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const bubbleSize = 56;
    const edgeInset = 12;
    const topInset = 84;
    const bottomInset = 88;
    return {
      x: Math.min(Math.max(x, edgeInset), window.innerWidth - bubbleSize - edgeInset),
      y: Math.min(Math.max(y, topInset), window.innerHeight - bubbleSize - bottomInset)
    };
  };

  const snapItineraryBubbleToEdge = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const bubbleSize = 56;
    const edgeInset = 12;
    const clamped = clampItineraryBubblePosition(x, y);
    const centerX = clamped.x + bubbleSize / 2;
    return {
      x: centerX < window.innerWidth / 2 ? edgeInset : window.innerWidth - bubbleSize - edgeInset,
      y: clamped.y
    };
  };

  const handleItineraryBubblePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    itineraryBubbleDragRef.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleItineraryBubblePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = itineraryBubbleDragRef.current;
    if (dragState.pointerId !== event.pointerId) return;

    const nextPosition = clampItineraryBubblePosition(
      event.clientX - dragState.offsetX,
      event.clientY - dragState.offsetY
    );

    if (
      Math.abs(nextPosition.x - itineraryBubblePosition.x) > 2 ||
      Math.abs(nextPosition.y - itineraryBubblePosition.y) > 2
    ) {
      dragState.moved = true;
    }

    setItineraryBubblePosition(nextPosition);
  };

  const handleItineraryBubblePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = itineraryBubbleDragRef.current;
    if (dragState.pointerId !== event.pointerId) return;

    setItineraryBubblePosition((position) => snapItineraryBubbleToEdge(position.x, position.y));
    event.currentTarget.releasePointerCapture(event.pointerId);
    itineraryBubbleDragRef.current = {
      ...dragState,
      pointerId: -1
    };
  };

  const handleItineraryBubbleClick = () => {
    if (itineraryBubbleDragRef.current.moved) {
      itineraryBubbleDragRef.current.moved = false;
      return;
    }
    setItineraryTab("itinerary");
    setMobileItineraryOpen(true);
  };

  const handleRestaurantSelect = (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setShowBoardingPass(false);
    setItineraryTab("detail");
    if (isMobile) {
      setRestaurantModalOpen(true);
      setMobileItineraryOpen(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedRestaurantId(null);
    setItineraryTab("itinerary");
    setRestaurantModalOpen(false);
  };

  const handleItineraryTabChange = (tab: "itinerary" | "detail") => {
    if (tab !== "detail") {
      setSelectedRestaurantId(null);
    }
    if (tab !== "itinerary") {
      setShowBoardingPass(false);
    }
    setItineraryTab(tab);
  };

  const isRightPanelExpanded =
    (itineraryTab === "detail" && !!selectedRestaurantId) || showBoardingPass;

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://api.bmi-foodtour.io.vn";
  const handleProfileOpen = () => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }
    setProfileOpen(true);
  };

  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-white">
      {/* Top Navigation */}
      <nav className="relative flex items-center justify-between border-b border-slate-200/60 bg-white/70 px-6 py-3 backdrop-blur">
      {/* Khối bên trái: Nút Menu và Quay lại */}
      <div className="z-10 flex items-center gap-4">
        <Link
          href="/"
          className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 md:flex"
        >
          Quay lại trang chính
        </Link>
        <button
          type="button"
          onClick={handleSidebarToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
        >
          {(isMobile ? mobileSidebarOpen : sidebarOpen) ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Khối ở giữa: Logo ELA (Căn giữa tuyệt đối dựa trên toàn bộ chiều rộng nav) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 text-center">
          {/* Wrap bằng Link hoặc div có class 'group' để hiệu ứng hover mượt mà */}
          <div className="group flex cursor-pointer flex-col items-center gap-1.5">
            
            {/* Khối icon logo với hiệu ứng Glassmorphism & Light Glow */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-400/10 via-blue-500/10 to-indigo-500/15 p-2 shadow-sm backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:border-sky-500/40 group-hover:shadow-md group-hover:shadow-sky-500/10">
              
              {/* Đốm sáng phía sau làm logo rực rỡ hơn */}
              <div className="absolute inset-0 rounded-2xl bg-sky-400/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />

              <img 
                src="/assets/images/web_logo.png" 
                alt="ELA Logo" 
                className="relative z-10 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            </div>  
          </div>
        </div>

      {/* 3. Khối bên phải: Avatar Profile User (Bốc nguyên cụm xịn xò của bạn sang) */}
      <div className="z-10 flex items-center gap-3">
        {user ? (
          <div className="relative group">
            {/* Nút Trigger Avatar */}
            <button className="flex h-9 w-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white p-1 transition hover:bg-slate-50 shadow-sm sm:h-auto sm:w-auto sm:justify-start sm:pr-3.5">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=ff6b4a&color=fff`} 
                alt="Avatar" 
                className="h-7 w-7 rounded-full object-cover bg-slate-100 sm:h-8 sm:w-8" 
                onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=U&background=ff6b4a&color=fff")}
              />
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-xs font-bold text-slate-800 leading-tight max-w-[100px] truncate">
                  {user.displayName || "Người dùng"}
                </span>
              </div>
            </button>
          </div>
        ) : (
          /* Trường hợp chưa đăng nhập */
          <Link
            href="/login"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-brand-coral hover:text-brand-coral hover:shadow-sm"
          >
            Đăng nhập
          </Link>
        )}
      </div>

    </nav>

      {/* Main Content Container */}
      <div className="flex h-[calc(100dvh-73px)] w-full overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={
            isMobile
              ? `fixed inset-0 z-40 flex w-full flex-col overflow-hidden bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 ease-out ${
                  mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : `${
                  sidebarOpen ? "w-80 flex-shrink-0" : "w-0"
                } flex flex-col overflow-hidden border-r border-slate-200/60 bg-white/70 backdrop-blur transition-all duration-300 ease-out`
          }
        >
          {isMobile && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/90 px-4 py-2 backdrop-blur md:hidden">
              <span className="text-xs font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1">
            <SidebarNav
              state={dashboardState}
              onStateChange={handleStateChange}
              onOpenProfileSettings={handleProfileOpen}
              onTabChange={handleItineraryTabChange}
              chatHistory={chatHistory}
              currentChatId={currentChatId}
              onNewChat={startLocalNewChat}
              onChatSelect={handleChatSelect}
              onDeleteChat={handleDeleteChat}
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

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto bg-white/70">
          <ChatInterface
            placeId={dashboardState.placeId}
            chatId={currentChatId}
            messages={currentMessages}
            onMessagesChange={handleMessagesUpdate}
            onRestaurantsSelect={(restaurants) => {
              setDashboardState((prev) => ({
                ...prev,
                selectedRestaurants: restaurants
              }));
            }}
            onRestaurantSelect={handleRestaurantSelect}
            onRefreshHistory={fetchChatHistory}
            onAutoCreateChat={handleNewChat}
            currentItinerary={currentItinerary}
            onSelectMeal={handleSelectMeal}
            fetchItinerary={fetchItinerary}
            onLocationResolved={handleUserLocationChange}
            selectedLearningMethod={selectedLearningMethod}
            selectedCourseId={selectedCourseId}
            selectedCourseTitle={selectedCourseTitle}
            selectedTopicId={selectedTopicId}
            selectedTopicTitle={selectedTopicTitle}
          />
        </main>

        {/* Right Itinerary Panel */}
        <aside 
          className={`hidden overflow-y-auto border-l border-slate-200/60 bg-white/70 backdrop-blur lg:block transition-all duration-300
            ${isRightPanelExpanded ? 'w-[450px]' : 'w-80'}`}
        >
          <ItineraryPanel
            location={dashboardState.location}
            budget={budgetDisplay}
            mealStops={mealStops}
            restaurants={dashboardState.selectedRestaurants}
            selectedRestaurantId={selectedRestaurantId}
            currentTab={itineraryTab}
            onSelectRestaurant={handleRestaurantSelect}
            onTabChange={handleItineraryTabChange}
            onCloseDetail={handleCloseDetail}
            currentItinerary={currentItinerary}
            onDeleteMeal={handleDeleteMeal}
            onResetItinerary={handleResetItinerary}
            onReorder={handleReorder}
            showBoardingPass={showBoardingPass}
            onShowBoardingPassChange={setShowBoardingPass}
            selectedLearningMethod={selectedLearningMethod}
            onSelectLearningMethod={setSelectedLearningMethod}
          />
        </aside>
      </div>

      {!mobileItineraryOpen && (
        <button
          type="button"
          onPointerDown={handleItineraryBubblePointerDown}
          onPointerMove={handleItineraryBubblePointerMove}
          onPointerUp={handleItineraryBubblePointerUp}
          onPointerCancel={handleItineraryBubblePointerUp}
          onClick={handleItineraryBubbleClick}
          className="fixed z-30 inline-flex h-14 w-14 touch-none items-center justify-center rounded-full bg-gradient-to-br from-brand-teal to-brand-lagoon text-white shadow-glow transition-[box-shadow,transform] duration-200 hover:scale-105 active:scale-95 md:hidden"
          style={{
            left: itineraryBubblePosition.x,
            top: itineraryBubblePosition.y
          }}
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

      {mobileItineraryOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          <div className="flex items-center justify-between border-b border-slate-200/60 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Lịch trình</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Tổng hợp
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileItineraryOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ItineraryPanel
              location={dashboardState.location}
              budget={budgetDisplay}
              mealStops={mealStops}
              restaurants={dashboardState.selectedRestaurants}
              selectedRestaurantId={selectedRestaurantId}
              currentTab={itineraryTab}
              onSelectRestaurant={handleRestaurantSelect}
              onTabChange={handleItineraryTabChange}
              onCloseDetail={handleCloseDetail}
              currentItinerary={currentItinerary}
              onDeleteMeal={handleDeleteMeal}
              onResetItinerary={handleResetItinerary}
              onReorder={handleReorder}
              showBoardingPass={showBoardingPass}
              onShowBoardingPassChange={setShowBoardingPass}
              selectedLearningMethod={selectedLearningMethod}
              onSelectLearningMethod={setSelectedLearningMethod}
            />
          </div>
        </div>
      )}

    

      {restaurantModalOpen && selectedRestaurant && (
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

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl h-full overflow-y-auto rounded-[32px] bg-white shadow-2xl sm:h-[90vh]">
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
