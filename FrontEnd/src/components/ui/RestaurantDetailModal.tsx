"use client";

import React, { useEffect, useState, useRef,useMemo } from "react";
import axios from "axios";
import {
  X,
  Star,
  MapPin,
  Phone,
  Info,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Trash2,
  Wifi,
  Flag,
} from "lucide-react";
import { Restaurant } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Toast, { ToastType } from "./Toast";
import { reportComment } from "@/lib/reportsApi";

// ── Firebase Client SDK ──
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  Unsubscribe,
} from "firebase/firestore";

// ── Types ──
interface RestaurantDetailModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
}

interface CommentItem {
  comment_id: string;
  user_id: string;
  username: string;
  content: string;
  like_count: number;
  dislike_count: number;
  created_at?: string;
  updated_at?: string | null;
  edited?: boolean;
  /** Vote của user hiện tại – được fetch riêng từ sub-collection votes */
  current_vote?: "like" | "dislike" | null;
  user_role?: "admin" | "user";
  user_avatar?: string | null;
}

// ──────────────────────────────────────────────────────────────
export default function RestaurantDetailModal({
  restaurant,
  isOpen,
  onClose,
}: RestaurantDetailModalProps) {
  // ── Auth ──
  const { user } = useAuth();
  const isCurrentUserAdmin = (user as any)?.role === "admin";
  const CURRENT_USER = {
    user_id: user?.uid || "anonymous_user_id",
    username: user?.displayName || "Anonymous",
  };

  // ── State ──
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [processingCommentId, setProcessingCommentId] = useState<string | null>(null);

  // ── Report Comment Modal State ──
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportingCommentText, setReportingCommentText] = useState<string>("");
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // ── Scroll to Reported Comment ──
  useEffect(() => {
    if (!isOpen) return;

    // Kiểm tra sessionStorage để xem có comment_id cần scroll tới không
    const reportedCommentId = typeof window !== "undefined" 
      ? sessionStorage.getItem("review_report_comment_id")
      : null;

    if (reportedCommentId) {
      // Delay một chút để đảm bảo DOM đã render
      const timer = setTimeout(() => {
        const element = document.getElementById(`comment-${reportedCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight comment (optional)
          element.classList.add("ring-2", "ring-amber-400");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-amber-400");
          }, 2000);
        }
        // Clear sessionStorage sau khi sử dụng
        sessionStorage.removeItem("review_report_comment_id");
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /**
   * Map lưu vote hiện tại của user: { [comment_id]: "like" | "dislike" | null }
   * Được fetch 1 lần khi listener nhận snapshot đầu tiên,
   * và cập nhật optimistically mỗi khi user bấm vote.
   */
  const [userVoteMap, setUserVoteMap] = useState<Record<string, "like" | "dislike" | null>>({});
  const userVoteMapRef = useRef<Record<string, "like" | "dislike" | null>>({});
  const votingCommentIdRef = useRef<string | null>(null);

  const setUserVoteMapState = (next: Record<string, "like" | "dislike" | null>) => {
    userVoteMapRef.current = next;
    setUserVoteMap(next);
  };

  const updateUserVoteMap = (
    updater: (prev: Record<string, "like" | "dislike" | null>) => Record<string, "like" | "dislike" | null>
  ) => {
    setUserVoteMap((prev) => {
      const next = updater(prev);
      userVoteMapRef.current = next;
      return next;
    });
  };

  const [toastState, setToastState] = useState<{
    show: boolean;
    type: ToastType;
    message: string;
  }>({ show: false, type: "success", message: "" });

  // Dùng ref để track xem snapshot đầu tiên đã được nhận chưa (để fetch votes 1 lần)
  const isFirstSnapshotRef = useRef(true);
  // Ref lưu unsubscribe function để cleanup
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // ── Toast helper ──
  const triggerToast = (type: ToastType, message: string) => {
    setToastState({ show: true, type, message });
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // ──────────────────────────────────────────────────────────────
  // ── REAL-TIME LISTENER (onSnapshot) ──
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Dọn dẹp listener cũ nếu còn tồn tại
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!isOpen || !restaurant?.id) return;

    // Reset state mỗi khi mở modal với nhà hàng mới
    setComments([]);
    setUserVoteMapState({});
    isFirstSnapshotRef.current = true;
    setLoadingComments(true);

    const commentsColRef = collection(
      db,
      "restaurant_comments",
       String(restaurant.id),
      "comments"
    );
    const commentsQuery = query(commentsColRef, orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(
      commentsQuery,
      async (snapshot) => {
        // Map Firestore documents → CommentItem[]
        const rawComments: Omit<CommentItem, "current_vote">[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            comment_id: docSnap.id,
            user_id: data.user_id ?? "",
            username: data.username ?? "Người dùng",
            content: data.content ?? "",
            like_count: data.like_count ?? 0,
            dislike_count: data.dislike_count ?? 0,
            created_at: data.created_at ?? undefined,
            updated_at: data.updated_at ?? null,
            edited: data.edited ?? false,
            user_role: data.user_role ?? "user",
            user_avatar: data.user_avatar ?? null,
          };
        });

        // Lần đầu nhận snapshot: fetch toàn bộ votes của user hiện tại 1 lần
        if (isFirstSnapshotRef.current && user?.uid && rawComments.length > 0) {
          isFirstSnapshotRef.current = false;
          const voteMap: Record<string, "like" | "dislike" | null> = {};

          // Fetch song song tất cả vote documents
          const votePromises = rawComments.map(async (c) => {
            try {
              const voteDocRef = doc(
                db,
                "restaurant_comments",
                String(restaurant.id),
                "comments",
                c.comment_id,
                "votes",
                user.uid
              );
              const voteSnap = await getDoc(voteDocRef);

              console.log(
                "VOTE CHECK",
                c.comment_id,
                voteSnap.exists(),
                voteSnap.data()
              );

              voteMap[c.comment_id] = voteSnap.exists()
                ? (voteSnap.data()?.vote_type as "like" | "dislike") ?? null
                : null;
            } catch(error) {
              voteMap[c.comment_id] = null;
            }
          });

          await Promise.all(votePromises);
          setUserVoteMapState(voteMap);
        } else if (isFirstSnapshotRef.current) {
          // Không có user đăng nhập hoặc không có comment → vẫn tắt cờ
          isFirstSnapshotRef.current = false;
        }

        // Merge vote vào comments (giữ optimistic updates nếu đã có)
        const latestVoteMap = userVoteMapRef.current;
        setComments((prev) => {
          const prevVoteMap: Record<string, "like" | "dislike" | null> = {};
          prev.forEach((c) => {
            if (c.current_vote !== undefined) prevVoteMap[c.comment_id] = c.current_vote;
          });

          return rawComments.map((c) => ({
            ...c,
            current_vote:
              prevVoteMap[c.comment_id] !== undefined
                ? prevVoteMap[c.comment_id]
                : latestVoteMap[c.comment_id] ?? null,
          }));
        });

        setLoadingComments(false);
      },
      (error) => {
        console.error("[onSnapshot] Lỗi khi lắng nghe comments:", error);
        triggerToast("error", "Không thể tải bình luận. Vui lòng thử lại!");
        setLoadingComments(false);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Cleanup khi modal đóng hoặc restaurant thay đổi
    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [isOpen, restaurant?.id, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Khi userVoteMap thay đổi (lần fetch đầu), cập nhật lại current_vote cho các comment
  useEffect(() => {
    if (Object.keys(userVoteMap).length === 0) return;
    setComments((prev) =>
      prev.map((c) => ({
        ...c,
        current_vote:
          c.current_vote !== undefined && c.current_vote !== null
            ? c.current_vote
            : userVoteMap[c.comment_id] ?? null,
      }))
    );
  }, [userVoteMap]); // eslint-disable-line react-hooks/exhaustive-deps


  // ──────────────────────────────────────────────────────────────
  // ── SUBMIT COMMENT ──
  // ──────────────────────────────────────────────────────────────
  const handleSubmitComment = async () => {
    if (!restaurant?.id || !newComment.trim()) return;

    if (!navigator.onLine) {
      triggerToast("error", "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng!");
      return;
    }

    if (!user) {
      triggerToast("error", "Vui lòng đăng nhập để bình luận!");
      return;
    }

    setSubmittingComment(true);
    try {
      // Backend sẽ tự lấy username, avatar, role từ collection users và denormalize vào comment
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/restaurant-comment/${restaurant.id}`,
        {
          user_id: CURRENT_USER.user_id,
          content: newComment.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // onSnapshot sẽ tự động cập nhật danh sách — không cần fetch lại thủ công
      setNewComment("");
      triggerToast("success", "Bình luận của bạn đã được gửi thành công!");
    } catch (error: any) {
      console.error("Submit comment failed", error);
      triggerToast("error", "Gửi bình luận thất bại. Vui lòng thử lại!");
    } finally {
      setSubmittingComment(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // ── VOTE ──
  // ──────────────────────────────────────────────────────────────
  const handleVote = async (commentId: string, voteType: "like" | "dislike") => {
    if (!restaurant?.id || !commentId || votingCommentIdRef.current === commentId) return;

    if (!user || !CURRENT_USER?.user_id) {
      triggerToast("error", "Vui lòng đăng nhập để có thể thích hoặc không thích bình luận này!");
      return;
    }

    if (!navigator.onLine) {
      triggerToast("error", "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng!");
      return;
    }

    votingCommentIdRef.current = commentId;
    setVotingCommentId(commentId);

    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/restaurant-comment/${restaurant.id}/${commentId}/vote`,
        {
          user_id: CURRENT_USER.user_id,
          vote_type: voteType,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const newCurrentVote = data.current_vote as "like" | "dislike" | null;
      const serverLikeCount = typeof data.like_count === "number" ? data.like_count : undefined;
      const serverDislikeCount = typeof data.dislike_count === "number" ? data.dislike_count : undefined;

      setComments((prev) =>
        prev.map((comment) => {
          if (comment.comment_id !== commentId) return comment;

          if (serverLikeCount !== undefined && serverDislikeCount !== undefined) {
            return {
              ...comment,
              like_count: serverLikeCount,
              dislike_count: serverDislikeCount,
              current_vote: newCurrentVote,
            };
          }

          const prevVote = comment.current_vote ?? userVoteMapRef.current[commentId] ?? null;
          let { like_count, dislike_count } = comment;

          if (prevVote === "like") like_count -= 1;
          if (prevVote === "dislike") dislike_count -= 1;
          if (newCurrentVote === "like") like_count += 1;
          if (newCurrentVote === "dislike") dislike_count += 1;

          return { ...comment, like_count, dislike_count, current_vote: newCurrentVote };
        })
      );

      updateUserVoteMap((prev) => ({ ...prev, [commentId]: newCurrentVote }));
    } catch (error: any) {
      console.error("Vote failed", error);
      triggerToast("error", "Thao tác thất bại. Vui lòng thử lại!");
    } finally {
      votingCommentIdRef.current = null;
      setVotingCommentId(null);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // ── EDIT / DELETE ──
  // ──────────────────────────────────────────────────────────────
  const startEditComment = (comment: CommentItem) => {
    if (!navigator.onLine) {
      triggerToast("error", "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng!");
      return;
    }
    setEditingCommentId(comment.comment_id);
    setEditingCommentContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!restaurant?.id || !editingCommentContent.trim()) return;
    setProcessingCommentId(commentId);

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/restaurant-comment/${restaurant.id}/${commentId}`,
        {
          user_id: CURRENT_USER.user_id,
          content: editingCommentContent.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      // onSnapshot tự cập nhật nội dung mới — không cần setComments thủ công
      cancelEdit();
      triggerToast("success", "Đã cập nhật bình luận thành công!");
    } catch (error: any) {
      console.error("Edit comment failed", error);
      triggerToast("error", "Sửa bình luận thất bại. Vui lòng thử lại!");
    } finally {
      setProcessingCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!restaurant?.id) return;
    setProcessingCommentId(commentId);

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/restaurant-comment/${restaurant.id}/${commentId}`,
        {
          headers: { "Content-Type": "application/json" },
          data: { user_id: CURRENT_USER.user_id },
        }
      );
      // onSnapshot tự xóa comment khỏi danh sách — không cần setComments thủ công
      if (editingCommentId === commentId) cancelEdit();
      triggerToast("success", "Đã xóa bình luận thành công!");
    } catch (error: any) {
      console.error("Delete comment failed", error);
      triggerToast("error", "Xóa bình luận thất bại. Vui lòng thử lại!");
    } finally {
      setProcessingCommentId(null);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // ── REPORT COMMENT ──
  // ──────────────────────────────────────────────────────────────
  const openReportModal = (comment: CommentItem) => {
    if (!user) {
      triggerToast("error", "Vui lòng đăng nhập để báo cáo bình luận!");
      return;
    }
    if (comment.user_id === CURRENT_USER.user_id) {
      triggerToast("error", "Không thể báo cáo bình luận của chính bạn!");
      return;
    }
    setReportingCommentId(comment.comment_id);
    setReportingCommentText(comment.content);
    setReportReason("");
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    setReportModalOpen(false);
    setReportingCommentId(null);
    setReportingCommentText("");
    setReportReason("");
    setReportSubmitting(false);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !reportingCommentId || !restaurant?.id) {
      triggerToast("error", "Vui lòng chọn lý do báo cáo!");
      return;
    }

    if (!navigator.onLine) {
      triggerToast("error", "Thiết bị của bạn đang mất kết nối Internet. Vui lòng kiểm tra lại mạng!");
      return;
    }

    setReportSubmitting(true);
    try {
      const response = await reportComment({
        restaurant_id: String(restaurant.id),
        comment_id: reportingCommentId,
        comment_text: reportingCommentText,
        reason: reportReason,
        user_id: CURRENT_USER.user_id,
      });

      if (response.status === "success") {
        triggerToast("success", "Báo cáo của bạn đã được gửi. Cảm ơn vì giúp chúng tôi duy trì cộng đồng sạch!");
        closeReportModal();
      } else {
        triggerToast("error", response.message || "Gửi báo cáo thất bại. Vui lòng thử lại!");
      }
    } catch (error: any) {
      console.error("Report comment failed", error);
      triggerToast("error", "Gửi báo cáo thất bại. Vui lòng thử lại!");
    } finally {
      setReportSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // ── HELPER ──
  // ──────────────────────────────────────────────────────────────
  const formatCommentDate = (dateString: any) => {
  if (!dateString) return "Đang cập nhật..."; // Trả về text mặc định nếu date bị undefined
  
  const date = new Date(dateString);
  
  // Kiểm tra xem chuỗi ngày tháng có hợp lệ không trước khi format
  if (isNaN(date.getTime())) return "Ngày không hợp lệ"; 

  // Sử dụng toLocaleString an toàn
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

 


  // Thêm đoạn code này vào bên trong RestaurantDetailModal
  useEffect(() => {
    // 1. Lấy mã ID comment vi phạm được lưu tạm từ trang bản đồ
    const targetCommentId = sessionStorage.getItem("targetCommentId");
    
    // 2. Đảm bảo có ID và danh sách bình luận (comments) đã được tải xong (loadingComments === false)
    if (targetCommentId && !loadingComments && comments && comments.length > 0) {
      
      // Tìm phần tử HTML của bình luận vi phạm
      const commentElement = document.getElementById(`comment-${targetCommentId}`);
      
      if (commentElement) {
        // Đợi 400ms để đảm bảo hiệu ứng mở Modal của bạn đã bung ra hoàn toàn
        const timer = setTimeout(() => {
          commentElement.scrollIntoView({ behavior: "smooth", block: "center" });
          
          // Thêm một hiệu ứng đổi màu nền nhẹ (highlight) để Admin dễ chú ý
          commentElement.classList.add("ring-2", "ring-amber-400", "scale-[1.01]");
          
          // Sau 2 giây thì xóa highlight đi để trả lại giao diện gốc
          setTimeout(() => {
            commentElement.classList.remove("ring-2", "ring-amber-400", "scale-[1.01]");
          }, 2000);

          // 3. Xóa flag đi để tránh bị cuộn nhầm cho các lần mở modal bình thường sau này
          sessionStorage.removeItem("targetCommentId");
        }, 400);

        return () => clearTimeout(timer);
      }
    }
  }, [comments, loadingComments]); // Chạy lại khi danh sách comments thay đổi hoặc trạng thái loading hoàn thành

  console.log("Dữ liệu quán ăn trong Modal:", restaurant);
  if (!isOpen || !restaurant) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-600 hover:text-rose-500 transition-colors shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        <div className="relative h-56 w-full overflow-hidden sm:h-80">
          <img
            src={restaurant.imageUrl || (restaurant as any).image_url || "/assets/images/AI.png"}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white sm:bottom-6 sm:left-6 sm:right-6">
            <h2 className="mb-2 text-2xl font-bold leading-tight sm:text-3xl">{restaurant.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold text-black">
                <Star className="w-3 h-3 fill-current mr-1" />
                {restaurant.rating ?? "Chưa có đánh giá"}
              </div>
              <span className="text-sm font-medium opacity-90">
                • {
                  (restaurant?.price || (restaurant as any)?.avg_price) 
                    ? Number(restaurant?.price || (restaurant as any)?.avg_price).toLocaleString("vi-VN") 
                    : "Chưa cập nhật giá"
                } VNĐ
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-4 sm:p-8">
          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-rose-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ</h4>
                  <p className="text-slate-800 font-medium">{restaurant.address || "Chưa cập nhật địa chỉ"}</p>
                  {(restaurant.mapUrl || (restaurant as any).map_url) && (
                    <a
                      href={restaurant.mapUrl || (restaurant as any).map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-rose-500 hover:underline inline-block mt-1 font-medium"
                    >
                      Xem trên Google Maps
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-blue-50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Điện thoại</h4>
                  <p className="text-slate-800 font-medium">{restaurant.phone || "Không có số điện thoại"}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                <Info className="w-4 h-4" />
                Giới thiệu
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {restaurant.semanticText || (restaurant as any).semantic_text || "Chưa có thông tin giới thiệu cho nhà hàng này."}
              </p>
            </div>
          </div>

          {/* Health Analysis */}
          {((restaurant.warnings?.length ?? 0) > 0 || (restaurant.notes?.length ?? 0) > 0) && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Phân tích sức khỏe</h3>
              {restaurant.warnings && restaurant.warnings.length > 0 && (
                <div className="space-y-3">
                  {restaurant.warnings.map((warning, idx) => (
                    <div key={idx} className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-amber-800 text-sm font-medium leading-relaxed">{warning}</p>
                    </div>
                  ))}
                </div>
              )}
              {restaurant.notes && restaurant.notes.length > 0 && (
                <div className="space-y-3">
                  {restaurant.notes.map((note, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-700 text-sm leading-relaxed italic">{note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meals */}
          {Array.isArray(restaurant.meals) && restaurant.meals.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Phục vụ các bữa</h4>
              <div className="flex flex-wrap gap-2">
                {restaurant.meals.map((meal, idx) => (
                  <span key={idx} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold capitalize">
                    {meal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Bình luận Real-time ── */}
          <div className="pt-6 border-t border-slate-100">
            <div>
              {/* Header: Tiêu đề + badge real-time */}
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-slate-800">
                  Bình luận ({comments.length})
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Chia sẻ trải nghiệm của bạn về nhà hàng này.
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {user ? (
                /* Đã đăng nhập: Hiển thị ô nhập bình luận */
                <div className="flex flex-col gap-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    placeholder="Viết bình luận của bạn..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {submittingComment ? "Đang gửi..." : "Gửi bình luận"}
                  </button>
                </div>
              ) : (
                /* Chưa đăng nhập: Yêu cầu đăng nhập */
                <Link
                  href="/login"
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-2xl transition flex items-center justify-center gap-2 border border-slate-200 border-dashed"
                >
                  🔐 Đăng nhập để bình luận và chia sẻ trải nghiệm
                </Link>
              )}

              {/* Danh sách bình luận */}
              <div className="space-y-4">
                {loadingComments ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      Đang kết nối real-time...
                    </div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Chưa có bình luận nào. Hãy là người đầu tiên nhận xét!
                  </div>
                ) : (
                  comments.map((comment) =>  {
                    const isOwnComment = comment.user_id === CURRENT_USER.user_id;
                    const isEditing = editingCommentId === comment.comment_id;

                    return (
                      <div
                        id={`comment-${comment.comment_id}`}
                        key={comment.comment_id}
                        className={`rounded-3xl border p-5 shadow-sm transition ${
                          isOwnComment
                            ? "border-rose-300 bg-rose-50/40"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            {/* Avatar + Tên + Badge */}
                            <div className="flex items-start gap-3">
                              <img
                                src={comment.user_avatar || "/assets/images/default-avatar.png"}
                                alt={comment.username}
                                className="w-10 h-10 rounded-full object-cover border border-slate-100 shrink-0 shadow-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=f43f5e&color=fff`;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                                  {/* Tên Username */}
                                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                                    {comment.username}
                                  </p>
                                  
                                  {/* Badge BẠN */}
                                  {isOwnComment && (
                                    <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 border border-rose-200/50">
                                      Bạn
                                    </span>
                                  )}
                                  
                                  {/* Badge ADMIN */}
                                  {(comment.user_role === "admin" || (isOwnComment && isCurrentUserAdmin)) && (
                                    <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5">
                                  {formatCommentDate(comment.created_at)}
                                  {comment.edited && " • (đã chỉnh sửa)"}
                                </p>
                              </div>
                            </div>
                            {/* Like / Dislike count */}
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                            {/* Like Count */}
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{comment.like_count}</span>
                              <span className="hidden sm:inline">thích</span>
                            </span>

                            {/* Dấu chấm phân cách - chỉ hiện trên desktop nếu muốn */}
                            <span className="hidden sm:inline text-slate-300">•</span>

                            {/* Dislike Count */}
                            <span className="flex items-center gap-1">
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{comment.dislike_count}</span>
                              <span className="hidden sm:inline">không thích</span>
                            </span>
                          </div>
                          </div>

                          {/* Nội dung / Form chỉnh sửa */}
                          {isEditing ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                rows={4}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleSaveEdit(comment.comment_id)}
                                  disabled={processingCommentId === comment.comment_id || !editingCommentContent.trim()}
                                  className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                  Lưu
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed text-slate-700 break-words whitespace-pre-wrap">{comment.content}</p>
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleVote(comment.comment_id, "like")}
                                  disabled={votingCommentId === comment.comment_id}
                                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition disabled:opacity-50 ${
                                    comment.current_vote === "like"
                                      ? "border-rose-400 bg-rose-50 text-rose-600"
                                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300 hover:text-rose-600"
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Thích</span>
                                </button>

                                <button
                                  onClick={() => handleVote(comment.comment_id, "dislike")}
                                  disabled={votingCommentId === comment.comment_id}
                                  className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold transition disabled:opacity-50 ${
                                    comment.current_vote === "dislike"
                                      ? "border-blue-400 bg-blue-50 text-blue-600"
                                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:text-blue-600"
                                  }`}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Không thích</span>
                                </button>
                                {(isOwnComment || isCurrentUserAdmin) && (
                                  <div className="flex items-center gap-1.5 ml-auto">
                                  {/* Nút Sửa */}
                                  {isOwnComment && (
                                    <button
                                      onClick={() => startEditComment(comment)}
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                      title="Sửa bình luận"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      <span className="hidden sm:inline">Sửa</span>
                                    </button>
                                  )}

                                  {/* Nút Xóa */}
                                  <button
                                    onClick={() => handleDeleteComment(comment.comment_id)}
                                    disabled={processingCommentId === comment.comment_id}
                                    className="inline-flex items-center gap-1 rounded-full text-slate-400 hover:text-rose-600 p-2 sm:border sm:border-rose-200 sm:bg-white sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold sm:text-rose-600 transition sm:hover:bg-rose-50 disabled:opacity-50"
                                    title="Xóa bình luận"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span className="hidden sm:inline">Xóa</span>
                                  </button>
                                </div>
                                )}

                                {/* Nút Báo cáo - hiện cho những bình luận không phải của user */}
                                {!isOwnComment && (
                                  <button
                                    onClick={() => openReportModal(comment)}
                                    className="inline-flex items-center gap-1 rounded-full text-slate-400 hover:text-amber-600 p-2 transition"
                                    title="Báo cáo bình luận"
                                  >
                                    <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toastState.show && (
        <Toast
          show={toastState.show}
          type={toastState.type}
          message={toastState.message}
          onClose={() => setToastState((prev) => ({ ...prev, show: false }))}
        />
      )}

      {/* ── REPORT COMMENT MODAL ── */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <button
              onClick={closeReportModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-2">Báo cáo bình luận</h3>
            <p className="text-sm text-slate-600 mb-4">
              Giúp chúng tôi duy trì cộng đồng sạch bằng cách báo cáo nội dung không phù hợp.
            </p>

            {/* Hiển thị nội dung comment bị báo cáo */}
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold mb-1">COMMENT BỊ BÁO CÁO:</p>
              <p className="text-sm text-slate-700 line-clamp-3">{reportingCommentText}</p>
            </div>

            {/* Chọn lý do báo cáo */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lý do báo cáo <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
                placeholder="Vui lòng mô tả lý do báo cáo bình luận này (ví dụ: spam, ngôn từ xúc phạm, nội dung không phù hợp...)..."
                disabled={reportSubmitting}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition disabled:bg-slate-100"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeReportModal}
                disabled={reportSubmitting}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={reportSubmitting || !reportReason.trim()}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {reportSubmitting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

