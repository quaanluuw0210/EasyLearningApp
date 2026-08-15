"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, X, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Suspense } from "react";
import { useAuth } from "@/context/AuthContext";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('callbackUrl') || searchParams.get('redirect') || '';
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectPath);
    }
  }, [user, authLoading, router, redirectPath]);

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'passwords-dont-match':
        return "Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.";
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      case 'auth/user-not-found':
        return "Tài khoản không tồn tại trong hệ thống.";
      case 'auth/wrong-password':
        return "Mật khẩu không chính xác.";
      case 'auth/email-already-in-use':
        return "Email này đã được sử dụng cho một tài khoản khác.";
      case 'auth/weak-password':
        return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).";
      case 'auth/invalid-email':
        return "Định dạng email không hợp lệ.";
      case 'auth/popup-closed-by-user':
        return "Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.";
      case 'auth/too-many-requests':
        return "Yêu cầu quá thường xuyên. Vui lòng thử lại sau ít phút.";
      case 'auth/network-request-failed':
        return "Lỗi mạng. Vui lòng kiểm tra lại kết nối internet.";
      case 'auth/user-disabled':
        return "Tài khoản này đã bị vô hiệu hóa.";
      default:
        return `Đã có lỗi xảy ra (${errorCode}). Vui lòng thử lại sau.`;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Kiểm tra mật khẩu nhập lại cho luồng đăng ký
        if (password !== confirmPassword) {
          setError(getErrorMessage('passwords-dont-match'));
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      router.push(redirectPath);
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email của bạn để nhận liên kết khôi phục.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Một liên kết khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!");
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await signInWithPopup(auth, provider);
      router.push(redirectPath);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(getErrorMessage(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setError(null);
    setSuccessMessage(null);
  };

  const showForgotPassword = () => {
    setIsForgotPassword(true);
    setError(null);
    setSuccessMessage(null);
  };

 return (
    <div className="relative min-h-screen w-full bg-[#9abfe3] overflow-hidden font-sans">
      {/* Background Image for Mobile / Background for Split Screen */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img 
          src="/assets/images/login_cover.png" 
          alt="Login Cover" 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#9abfe3] backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* Left Side: Login Form (Porcelain/Creamish background) */}

        <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[40%] lg:bg-[#FDFCFB] lg:px-16 lg:border-r lg:border-slate-200/70 shadow-2xl lg:shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)] z-20">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="mb-10 flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
              <Link href="/" className="mb-8 flex items-center gap-3 group">
               <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 via-sky-500/15 to-blue-600/20 border border-sky-500/20 shadow-sm transition-transform group-hover:scale-110">
                  <img 
                    src="/assets/images/web_logo.png" 
                    alt="ELA Logo" 
                    className="h-7 w-7 object-contain" 
                  />
                </span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="font-display text-2xl font-bold tracking-tight text-white lg:text-slate-900">
                    VocabMaster
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75 lg:text-slate-500">
                    Vocabulary Master 
                  </span>
                </div>
              </Link>
              <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm lg:text-5xl lg:text-slate-900 lg:drop-shadow-none">
                {isForgotPassword 
                  ? "Khôi phục mật khẩu" 
                  : isLogin ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
              </h1>
              <p className="mt-4 text-lg font-medium text-white/85 lg:text-slate-500">
                {isForgotPassword
                  ? "Nhập email của bạn để nhận liên kết đặt lại mật khẩu"
                  : isLogin 
                    ? "Đăng nhập để tiếp tục hành trình của bạn" 
                    : "Bắt đầu khám phá trải nghiệm ẩm thực tuyệt vời"}
              </p>
            </div>

            <div className="rounded-[32px] bg-white/95 p-8 shadow-2xl shadow-slate-900/20 backdrop-blur-sm lg:shadow-none lg:p-0 lg:bg-transparent lg:backdrop-blur-none">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                      <AlertCircle className="mt-0.5 shrink-0" size={18} />
                      <div className="flex-1 font-medium">{error}</div>
                      <button 
                        onClick={() => setError(null)}
                        className="shrink-0 hover:bg-red-100 p-1 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-600 border border-emerald-100">
                      <AlertCircle className="mt-0.5 shrink-0" size={18} />
                      <div className="flex-1 font-medium">{successMessage}</div>
                      <button 
                        onClick={() => setSuccessMessage(null)}
                        className="shrink-0 hover:bg-emerald-100 p-1 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isForgotPassword ? (
                <form className="space-y-6" onSubmit={handleResetPassword}>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-coral" size={18} />
                      <input
                        type="email"
                        placeholder="name@example.com"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-coral/10"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame py-4 font-bold text-white shadow-xl shadow-brand-coral/25 transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:opacity-70"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={22} />
                    ) : (
                      <>
                        <span className="relative z-10">Gửi liên kết khôi phục</span>
                        <ArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" size={20} />
                      </>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <ChevronLeft size={18} />
                    Quay lại đăng nhập
                  </button>
                </form>
              ) : (
                <>
                  <form className="space-y-6" onSubmit={handleAuth}>
                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-coral" size={18} />
                          <input
                            type="text"
                            placeholder="Nguyễn Văn A"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-coral/10"
                            onChange={(e) => setName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-coral" size={18} />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-coral/10"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-sm font-bold text-slate-700">Mật khẩu</label>
                        {isLogin && (
                          <button 
                            type="button" 
                            onClick={showForgotPassword}
                            className="text-xs font-bold text-brand-coral hover:text-brand-flame transition-colors"
                          >
                            Quên mật khẩu?
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-coral" size={18} />
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-coral/10"
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-coral" size={18} />
                          <input
                            type="password"
                            placeholder="••••••••"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 transition-all focus:border-brand-coral focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-coral/10"
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      disabled={loading}
                      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-coral to-brand-flame py-4 font-bold text-white shadow-xl shadow-brand-coral/25 transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:opacity-70"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={22} />
                      ) : (
                        <>
                          <span className="relative z-10">{isLogin ? "Đăng nhập" : "Tạo tài khoản"}</span>
                          <ArrowRight className="relative z-10 transition-transform group-hover:translate-x-1" size={20} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="relative my-10 flex items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="mx-4 flex-shrink text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Hoặc tiếp tục với</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button 
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md hover:border-slate-300 active:scale-[0.98] disabled:opacity-70"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} alt="Google" />
                    Google Account
                  </button>

                  <p className="mt-12 text-center text-sm font-medium text-slate-500 lg:text-left">
                    {isLogin ? "Bạn chưa có tài khoản?" : "Bạn đã có tài khoản?"}{" "}
                    <button 
                      onClick={toggleMode}
                      className="font-bold text-brand-coral hover:text-brand-flame transition-all underline-offset-4 hover:underline"
                    >
                      {isLogin ? "Đăng ký ngay" : "Đăng nhập ngay"}
                    </button>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Side: Visual Content (Only on Desktop) */}
        <div className="hidden lg:block lg:w-[60%] relative overflow-hidden bg-slate-900">
          <motion.img 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src="/assets/images/login_cover.png" 
            alt="Delicious food and dining experience" 
            className="h-full w-full object-cover opacity-80"
          />
          
          {/* Branding/Message overlay - Moved slightly higher (bottom-32 instead of bottom-20) */}
          <div className="absolute bottom-32 left-20 right-20 z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="max-w-xl rounded-[40px] bg-indigo-950/50 p-12 backdrop-blur-2xl border border-indigo-300/20 shadow-2xl"
            >
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-coral opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-coral"></span>
                </span>
                Học từ vựng chưa bao giờ dễ dàng đến thế
              </motion.div>
              <h2 className="text-6xl font-black text-white mb-6 leading-[1.1]">
                Khám phá <br/>
                <span className="text-brand-coral drop-shadow-sm">Phong cách </span> 
                của riêng bạn.
              </h2>
              <p className="text-white/90 text-xl leading-relaxed font-medium">
                Trang web học từ vựng với nhiều tính năng hoàn toàn miễn phí.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#FDFCFB]">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand-coral/20"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white shadow-xl">
            <Loader2 className="h-10 w-10 animate-spin text-brand-coral" />
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}