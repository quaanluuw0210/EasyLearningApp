import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import AuthWrapper from "@/components/layout/AuthWrapper";

export const metadata: Metadata = {
  title: "VocabMaster | Học từ vựng tiếng Anh thông minh",
  description:
    "VocabMaster là ứng dụng học từ vựng tiếng Anh thông minh, giúp bạn nâng cao vốn từ vựng một cách hiệu quả và thú vị.",
  icons: {
    icon: "/assets/images/logo_title.png", // Đường dẫn tới file ảnh trong thư mục public/ (ví dụ: public/favicon.png)
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="font-sans antialiased">
        <AuthProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}