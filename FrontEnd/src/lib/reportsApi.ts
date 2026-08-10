/**
 * Reports API client
 * Giao tiếp với backend để quản lý báo cáo bình luận vi phạm
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.bmi-foodtour.io.vn";

export interface ReportCommentPayload {
  restaurant_id: string;
  comment_id: string;
  comment_text: string;
  reason: string;
  user_id: string;
}

export interface ReportComment extends ReportCommentPayload {
  report_id: string;
  status: "pending" | "resolved";
  created_at: string;
}

export interface ReportResponse {
  status: "success" | "error";
  data?: any;
  message?: string;
}

/**
 * Gửi báo cáo bình luận lên server
 */
export async function reportComment(payload: ReportCommentPayload): Promise<ReportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/report-comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Report comment failed:", error);
    return {
      status: "error",
      message: "Không thể gửi báo cáo. Vui lòng thử lại!",
    };
  }
}

/**
 * Lấy danh sách báo cáo (Admin only)
 */
export async function getReports(filters?: { status?: string }): Promise<ReportResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append("status", filters.status);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/user/reports${params.toString() ? `?${params}` : ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Get reports failed:", error);
    return {
      status: "error",
      message: "Không thể tải danh sách báo cáo. Vui lòng thử lại!",
    };
  }
}
export const deleteCommentAsAdmin = async (restaurantId: string, commentId: string, adminUserId: string) => {
  try {
    // 💡 SỬA Ở ĐÂY: Thêm biến môi trường để gọi thẳng sang port Backend (FastAPI) giống như Axios
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; 
    
    const response = await fetch(`${baseUrl}/api/user/restaurant-comment/${restaurantId}/${commentId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: adminUserId,
      }),
    });


    if (!response.ok) {
      // Đọc dữ liệu lỗi từ FastAPI (chính là cục {"detail": "Comment không tồn tại"})
      const errorData = await response.json();
      
      // Tạo một đối tượng lỗi giả lập giống cấu trúc Axios để hàm ngoài catch được
      const customError = new Error("API Error") as any;
      customError.response = {
        status: response.status,
        data: errorData
      };
      
      // Ném lỗi ra ngoài để kích hoạt khối CATCH ở hàm handleDeleteComment
      throw customError;
    }

    return await response.json();
  } catch (error) {
    console.error("API deleteCommentAsAdmin error:", error);
    throw error;
  }
};


export const deleteReport = async (reportId: string) => {
  try {
    // Sử dụng API_BASE_URL thay vì hardcode đường dẫn tuyệt đối
    const response = await fetch(`${API_BASE_URL}/api/user/reports/delete`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({report_id: reportId}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Delete report failed:", error);
    return { 
      status: "error", 
      message: "Không thể kết nối đến server để xóa báo cáo" 
    };
  }
};
/**
 * Cập nhật trạng thái báo cáo (Admin only)
 */
export async function updateReportStatus(
  reportId: string,
  status: "pending" | "resolved",type_resolve?: "deleted" | "dismissed"
): Promise<ReportResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/reports/${reportId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, type_resolve }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Update report status failed:", error);
    return {
      status: "error",
      message: "Không thể cập nhật trạng thái báo cáo. Vui lòng thử lại!",
    };
  }



}
