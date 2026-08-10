"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Upload, User } from "lucide-react";
import { getApiOrigin } from "@/lib/apiBase";

const API_BASE_URL = getApiOrigin();
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export default function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Fetch dữ liệu khi mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        const data = await res.json();
        if (data.status === "success") {
          // Lấy từ profile Firestore (nếu có) hoặc fallback qua token
          const profile = data.profile || {};
          const tokenUser = data.user || {};
          
          const displayName = user?.displayName || profile.display_name || tokenUser.name || "";
          const photoUrl = user?.photoURL || profile.photo_url || tokenUser.picture || "";
          const accountEmail = user?.email || profile.email || tokenUser.email || "";
          setName(displayName);
          setEmail(accountEmail);
          setAvatar(photoUrl);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
      }
    };
    
    fetchProfile();
  }, [user]);

  // Gửi API cập nhật
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          avatar,
        })
      });
      
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setMessage({ type: "success", text: "Cập nhật thông tin thành công!" });
        
        // Cập nhật lại UI state dựa trên data mới
        if (data.data) {
          setName(data.data.display_name || "");
          setAvatar(data.data.photo_url || "");
          
          // Cập nhật trực tiếp vào Firebase Auth cục bộ để Navbar thay đổi ngay lập tức
          if (user) {
            const { updateProfile } = await import("firebase/auth");
            await updateProfile(user, { 
              displayName: data.data.display_name, 
              photoURL: data.data.photo_url 
            });
            // Force reload to ensure context picks it up if needed
            await user.reload();
            // Optional: trigger a small state change or rely on Next.js reactivity
          }
        }
      } else {
        setMessage({ type: "error", text: data.detail || data.message || "Cập nhật thất bại." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Không thể kết nối tới máy chủ." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      setMessage({ type: "error", text: "Chưa cấu hình Cloudinary để tải ảnh lên." });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Vui lòng chọn một tệp ảnh hợp lệ." });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMessage({ type: "error", text: "Ảnh đại diện không được vượt quá 5MB." });
      return;
    }

    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setAvatar(data.secure_url);
      setMessage({ type: "success", text: "Tải ảnh lên thành công. Bấm Lưu thay đổi để cập nhật hồ sơ." });
    } catch (error) {
      console.error("Lỗi khi tải ảnh đại diện:", error);
      setMessage({ type: "error", text: "Không thể tải ảnh lên. Vui lòng thử lại." });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    setIsResetting(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ type: "success", text: "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư." });
    } catch (error: any) {
      setMessage({ type: "error", text: error?.message || "Không thể gửi email đặt lại mật khẩu." });
    } finally {
      setIsResetting(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Đang tải hồ sơ...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-soft">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-coral to-brand-flame flex items-center justify-center text-white">
          <User size={20} />
        </div>
        Thông tin cá nhân
      </h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-2xl text-sm font-semibold flex items-center gap-2 border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {message.type === "success" ? "✨" : "⚠️"} {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tên hiển thị</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-brand-coral focus:ring-4 focus:ring-brand-coral/10 transition shadow-sm"
              placeholder="Nhập tên của bạn"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Email (chỉ đọc)</label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed"
            placeholder="Chưa có email"
          />
        </div>

        {/* Avatar Input */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=U&background=ff6b4a&color=fff")} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <User size={40} />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 w-full text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-800 mb-1">Ảnh đại diện</h3>
            <p className="text-xs text-slate-500 mb-4 max-w-xs mx-auto sm:mx-0">
              Chọn ảnh từ thiết bị của bạn. Hỗ trợ ảnh JPG, PNG, WebP tối đa 5MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-coral hover:text-brand-coral disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploadingAvatar ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-brand-coral rounded-full animate-spin" />
                  Đang tải ảnh...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Tải ảnh lên
                </>
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={!email || isResetting}
          className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-brand-coral hover:text-brand-coral transition disabled:opacity-60 disabled:hover:text-slate-700"
        >
          {isResetting ? "Đang gửi email..." : "Đổi mật khẩu"}
        </button>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={isLoading || isUploadingAvatar}
            className="w-full bg-gradient-to-r from-brand-coral to-brand-flame text-white font-bold py-4 rounded-2xl shadow-glow hover:opacity-90 hover:scale-[0.99] active:scale-[0.97] transition-all disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Đang lưu...
              </span>
            ) : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
