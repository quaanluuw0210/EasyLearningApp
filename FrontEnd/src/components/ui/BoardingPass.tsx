"use client";

import { forwardRef, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import { Check, Copy, Download, Link as LinkIcon, X } from "lucide-react";
import { cn, formatMealDisplay } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { itineraryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TICKET_WIDTH = 450;

function getStopTier(stopCount: number): "normal" | "medium" | "compact" {
  if (stopCount <= 2) return "normal";
  if (stopCount <= 4) return "medium";
  return "compact";
}

function TicketSvgIcon({
  name,
  size,
}: {
  name: "compass" | "plane" | "star" | "qr";
  size: number;
}) {
  if (name === "compass") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="#C5A059" strokeWidth="2" />
        <path
          d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
          fill="#C5A059"
          stroke="#C5A059"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (name === "plane") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 20 3s-3 .5-4.5 1.5L12 8 3.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
          fill="#C5A059"
          stroke="#C5A059"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z"
          fill="#FACC15"
          stroke="#FACC15"
          strokeWidth="1"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" stroke="#0B3C5D" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" stroke="#0B3C5D" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" stroke="#0B3C5D" strokeWidth="2" />
      <path
        d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h3v3h-3z"
        fill="#0B3C5D"
      />
    </svg>
  );
}

type BoardingPassProps = {
  itinerary: any[];
  onClose: () => void;
  className?: string;
  variant?: "inline" | "modal";
};

const BoardingPassTicket = forwardRef<
  HTMLDivElement,
  {
    itinerary: any[];
    totalBudget: number;
    nowLabel: string;
    ticketNumber: string;
    shareUrl: string;
    onShareUrlClick?: () => void;
  }
>(function BoardingPassTicket({ itinerary, totalBudget, nowLabel, ticketNumber, shareUrl, onShareUrlClick }, ref) {
  const stopTier = getStopTier(itinerary.length);
  const isMedium = stopTier === "medium";
  const isCompact = stopTier === "compact";

  return (
    <div
      ref={ref}
      data-boarding-pass-ticket
      className="relative mx-auto box-border w-full max-w-[450px] overflow-visible rounded-[24px] border border-[#0B3C5D]/15 bg-[#FAFAFA] p-6 shadow-sm"
    >
      <div className="absolute inset-x-0 top-0 h-[120px] bg-[#0B3C5D]" />

      <div className="relative flex flex-col">
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B3C5D] shadow-soft">
              <TicketSvgIcon name="compass" size={22} />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-[#C5A059] leading-normal">
                BMI
              </div>
              <div className="font-display text-xl font-semibold leading-snug text-white">
                Food Itinerary Pass
              </div>
            </div>
          </div>
          <div className="shrink-0 min-w-[110px] text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C5A059] leading-normal">
              PREMIUM GUEST
            </div>
            <div className="mt-1 text-xs font-bold leading-normal text-white">#{ticketNumber}</div>
          </div>
        </div>

        <div className="mt-8 grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 rounded-2xl border border-[#0B3C5D]/10 bg-[#FDFBF7] p-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0B3C5D]/60 leading-normal">
              Departure
            </div>
            <div className="mt-1 text-sm font-bold leading-normal text-[#0B3C5D]">BMI SMART APP</div>
          </div>
          <div className="flex shrink-0 items-center justify-center px-1">
            <TicketSvgIcon name="plane" size={24} />
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0B3C5D]/60 leading-normal">
              Destination
            </div>
            <div className="mt-1 text-sm font-bold leading-normal text-[#0B3C5D]">YUMMY WORLD</div>
          </div>
        </div>

        <div className="mt-4 grid shrink-0 grid-cols-2 gap-4 rounded-2xl border border-[#0B3C5D]/10 bg-[#FDFBF7] p-4">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0B3C5D]/60 leading-normal">
              Total Budget
            </div>
            <div className="mt-1 text-sm font-bold leading-normal text-brand-flame">
              {totalBudget.toLocaleString("vi-VN")} VNĐ
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0B3C5D]/60 leading-normal">
              Issue Date
            </div>
            <div className="mt-1 text-sm font-bold leading-normal text-[#0B3C5D]">{nowLabel}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0B3C5D]/60 leading-normal">
            Culinary Stops
          </div>
          <div
            className={cn(
              "mt-3",
              isCompact ? "space-y-2" : isMedium ? "space-y-2.5" : "space-y-3"
            )}
          >
            {itinerary.map((stop, index) => (
              <div
                key={`${stop.meal}-${index}`}
                className={cn(
                  "flex min-w-0 items-start gap-3 border-b border-slate-100 last:border-0",
                  isCompact ? "gap-2 pb-2" : isMedium ? "pb-2.5" : "pb-3"
                )}
              >
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-xl bg-orange-50 px-1 text-center text-[10px] font-bold text-orange-600",
                    isCompact ? "h-8 w-8 text-[9px]" : "h-10 w-10"
                  )}
                >
                  {formatMealDisplay(stop.meal)}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "font-bold leading-snug text-[#0B3C5D] break-words",
                      isCompact ? "text-xs" : "text-sm"
                    )}
                  >
                    {stop.name}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-slate-500 break-words",
                      isCompact ? "text-[9px] leading-[1.6]" : "text-[10px] leading-[1.6]"
                    )}
                  >
                    {stop.address}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TicketSvgIcon name="star" size={10} />
                    <span className="text-[10px] font-bold leading-normal">
                      {stop.star || stop.rating || 0}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold leading-normal text-brand-teal">
                    {(() => {
                      const p = stop.avg_price !== undefined ? stop.avg_price : stop.price;
                      if (typeof p === "number") {
                        return `${p.toLocaleString("vi-VN")}đ`;
                      }
                      return p || "Chưa cập nhật";
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex shrink-0 items-center justify-between gap-4 border-t border-dashed border-[#C5A059]/40 pt-6">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0B3C5D]/60 leading-normal">
              Chia sẻ hành trình
            </div>
            <div className="mt-1 text-sm font-bold leading-snug text-[#0B3C5D]">
              {itinerary.length} điểm dừng · Vé #{ticketNumber}
            </div>
            <div className="mt-1 text-[10px] leading-[1.6] text-slate-500">
              {shareUrl ? "Nhấn QR để mở link chia sẻ." : "Đang tạo link chia sẻ..."}
            </div>
          </div>
          <button
            type="button"
            onClick={shareUrl ? onShareUrlClick : undefined}
            disabled={!shareUrl}
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-soft transition",
              shareUrl ? "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95" : "cursor-default"
            )}
            aria-label={shareUrl ? "Hiện link chia sẻ" : "Đang tạo link chia sẻ"}
          >
            {shareUrl ? (
              <QRCodeSVG 
                value={shareUrl} 
                size={54}
                bgColor={"#ffffff"}
                fgColor={"#0B3C5D"}
                level={"L"}
                includeMargin={false}
              />
            ) : (
              <TicketSvgIcon name="qr" size={40} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default function BoardingPass({
  itinerary,
  onClose,
  className,
  variant = "inline",
}: BoardingPassProps) {
  const { user } = useAuth();
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareLink, setShowShareLink] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    const fetchShareUrl = async () => {
      try {
        const uid = user?.uid;
        if (!uid) return;
        
        const response = await itineraryApi.share(uid, itinerary);
        if (response.status === "success" && response.share_id) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          setShareUrl(`${origin}/share/${response.share_id}`);
        }
      } catch (error) {
        console.error("Error creating share link:", error);
      }
    };
    fetchShareUrl();
  }, [itinerary, user?.uid]);

  useEffect(() => {
    setCopyStatus("idle");
  }, [shareUrl]);

  useEffect(() => {
    if (!copyStatus || copyStatus === "idle") return;
    const resetTimeout = window.setTimeout(() => setCopyStatus("idle"), 1800);
    const closeTimeout = window.setTimeout(() => setShowShareLink(false), 650);
    return () => {
      window.clearTimeout(resetTimeout);
      window.clearTimeout(closeTimeout);
    };
  }, [copyStatus]);

  const ticketNumber = useMemo(
    () => Math.random().toString(36).substr(2, 6).toUpperCase(),
    []
  );

  const totalBudget = useMemo(() => {
    return itinerary.reduce((sum, item) => {
      const p = item.avg_price !== undefined ? item.avg_price : item.price;
      const numericPrice = typeof p === "number" ? p : 0;
      return sum + numericPrice;
    }, 0);
  }, [itinerary]);

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const waitForStableLayout = async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("copied");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyStatus("copied");
    }
  };

  const handleExport = async () => {
    if (!ticketRef.current || isExporting) {
      return;
    }
    setIsExporting(true);

    const source = ticketRef.current;
    const clone = source.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.width = `${TICKET_WIDTH}px`; // Fix cứng width clone theo chuẩn
    clone.style.height = "auto"; // Chiều cao tự động bung theo nội dung
    clone.style.visibility = "visible";
    clone.style.opacity = "1";
    clone.style.pointerEvents = "none";
    clone.style.overflow = "visible";
    document.body.appendChild(clone);

    try {
      await waitForStableLayout();
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(clone, {
        useCORS: true,
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        width: TICKET_WIDTH, // Đổi từ captureWidth sang TICKET_WIDTH
        windowWidth: TICKET_WIDTH, // Thêm property này để canvas render chuẩn
        onclone: (_doc, element) => {
          const el = element as HTMLElement;
          el.style.overflow = "visible";
          el.querySelectorAll("*").forEach((node) => {
            const htmlNode = node as HTMLElement;
            htmlNode.style.overflow = "visible";
            if (htmlNode.style.lineHeight === "") {
              htmlNode.style.lineHeight = "normal";
            }
          });
        },
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "bmi-boarding-pass.png";
      link.click();
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
      setIsExporting(false);
    }
  };

  const isInline = variant === "inline";

  const passContent = (
    <div
      className={cn(
        "relative flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden",
        isInline ? "h-full flex-1" : "max-w-lg rounded-[32px] bg-white p-6 shadow-2xl",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-[#C5A059]">
          Vé ẩm thực của bạn
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleExport}
            className={cn(
              "inline-flex items-center rounded-full bg-[#0B3C5D] font-semibold text-[#C5A059] shadow-glow",
              isInline ? "gap-1 px-2.5 py-1.5 text-[9px]" : "gap-2 px-4 py-2 text-xs"
            )}
          >
            <Download size={isInline ? 12 : 14} />
            {isExporting ? "Đang xuất..." : "Tải ảnh"}
          </button>
          <button
            onClick={onClose}
            className={cn(
              "flex items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200",
              isInline ? "h-7 w-7" : "h-10 w-10"
            )}
          >
            <X size={isInline ? 16 : 18} />
          </button>
        </div>
      </div>

      {showShareLink && shareUrl && (
        <div className="rounded-2xl border border-[#0B3C5D]/10 bg-[#FDFBF7] p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#0B3C5D]/60">
              <LinkIcon size={13} />
              Link chia sẻ
            </div>
            <button
              type="button"
              onClick={() => setShowShareLink(false)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
              aria-label="Đóng link chia sẻ"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
            <input
              readOnly
              value={shareUrl}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-600 outline-none"
            />
            <button
              type="button"
              onClick={handleCopyShareUrl}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#0B3C5D] px-2.5 text-[10px] font-bold text-[#C5A059] transition hover:opacity-90"
            >
              {copyStatus === "copied" ? <Check size={13} /> : <Copy size={13} />}
              {copyStatus === "copied" ? "Đã copy" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div
        className={cn(
          "min-h-0 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto",
          isInline ? "flex-1" : "max-h-[70vh]"
        )}
      >
        <BoardingPassTicket
          ref={ticketRef}
          itinerary={itinerary}
          totalBudget={totalBudget}
          nowLabel={nowLabel}
          ticketNumber={ticketNumber}
          shareUrl={shareUrl}
          onShareUrlClick={() => setShowShareLink((prev) => !prev)}
        />
      </div>
    </div>
  );

  if (variant === "modal" && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        {passContent}
      </div>,
      document.body
    );
  }

  return passContent;
}
