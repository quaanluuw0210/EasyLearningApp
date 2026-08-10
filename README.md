<div align="center">
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Green%20Book.png" alt="Green Book" width="80" height="80" />
  
  # 🌿 VocabMaster - Nền Tảng Chuyên Sâu Học Từ Vựng Tiếng Anh
  
  **Học từ vựng thông minh, nhớ lâu hơn với sức mạnh của Flashcard & Lặp lại ngắt quãng.**

  [![Status](https://img.shields.io/badge/Status-Active-22c55e?style=flat-square)](#)
  [![Version](https://img.shields.io/badge/Version-1.0.0-10b981?style=flat-square)](#)
  [![License](https://img.shields.io/badge/License-MIT-059669?style=flat-square)](#)
</div>

---

## 📖 Giới thiệu (About The Project)

**VocabMaster** là một ứng dụng web được thiết kế với một mục tiêu duy nhất: **Giúp người dùng làm chủ từ vựng Tiếng Anh một cách toàn diện nhất**. 

Khác với các nền tảng học ngoại ngữ dàn trải, dự án này tập trung 100% vào việc tối ưu hóa trải nghiệm học từ vựng thông qua các phương pháp đã được khoa học chứng minh, giao diện tập trung cao độ và không gây xao nhãng.

## ✨ Tính năng nổi bật (Key Features)

Dự án cung cấp 3 phương pháp tiếp cận từ vựng cốt lõi, phù hợp với mọi thói quen học tập:

*   📗 **Học qua Danh sách (Vocabulary Lists):**
    *   Hiển thị từ vựng trực quan theo dạng bảng/danh sách.
    *   Tra cứu nhanh nghĩa tiếng Việt, phiên âm, từ loại và ví dụ ngữ cảnh.
    *   Phù hợp để ôn tập tổng quan hoặc làm quen với chủ đề mới.

*   📇 **Học qua Thẻ ghi nhớ 3D (Interactive Flashcards):**
    *   Giao diện thẻ xoay 3D (Flip Card) mượt mà, đẹp mắt.
    *   Mặt trước hiển thị từ vựng + phát âm chuẩn, mặt sau giải nghĩa chi tiết + ví dụ.
    *   Tích hợp tính năng phát âm Audio (Text-to-Speech) và điều hướng thẻ thông minh.

*   🌱 **Học ngắt quãng (Spaced Repetition System - SRS):**
    *   Thuật toán thông minh tự động tính toán thời điểm hoàn hảo để ôn lại từ vựng.
    *   Từ khó sẽ xuất hiện nhiều hơn, từ đã nhớ sẽ giãn cách thời gian xuất hiện.
    *   Tối ưu hóa não bộ, giúp chuyển từ vựng từ bộ nhớ ngắn hạn sang dài hạn (Long-term memory).


## 💻 Công nghệ sử dụng

### Backend
- **Framework**: FastAPI (Python)
- **AI/LLM**: Google Gemini API, Groq Cloud API
- **Vector DB**: ChromaDB
- **Embedding**: Sentence-Transformers (all-MiniLM-L6-v2)
- **Database**: Firebase Firestore (User Profiles, Chat History, Comments)
- **Libraries**: Pandas, Numpy, Pydantic, Httpx, Tenacity

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Framer Motion
- **Map**: MapLibre GL, React-map-gl
- **State/Auth**: Firebase Auth, React Context API
- **Components**: Lucide React, SweetAlert2

---

## 🚀 Hướng dẫn cài đặt và Chạy code

### 1. Yêu cầu hệ thống
- Python 3.9 trở lên
- Node.js 18 trở lên
- Tài khoản Firebase (để lấy config)
- API Keys: Google AI Studio (Gemini), Groq, Google Maps.

### 2. Cài đặt Backend
```bash
# Cài đặt các thư viện cần thiết
pip install -r requirements.txt

# Tạo file .env từ .env.example và điền các API Key
cp .env.example .env
```

### 3. Cài đặt Frontend
```bash
cd FrontEnd
npm install
# Cài đặt thêm nếu thiếu firebase
npm install firebase

# Tạo file .env.local và thêm URL Backend
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

### 4. Khởi chạy hệ thống
Cần khởi chạy 2 Terminal song song:

**Terminal 1: Chạy Backend**
```bash
# Lưu ý: Cần chạy khởi tạo dữ liệu trước (lần đầu)
python Back_End/Database/database.py

# Chạy server FastAPI
uvicorn main:app --reload
```

**Terminal 2: Chạy Frontend**
```bash
cd FrontEnd
npm run dev
```

---

## 📂 Cấu trúc thư mục

```text
.
├── Back_End/               # Mã nguồn Backend
│   ├── API/                # Các routes chính (Auth, Share, Main Pipeline)
│   ├── Core/               # Logic cốt lõi (Parsing, Scoring, Filtering, AI)
│   └── UnitTest/           # Các bản kiểm thử đơn vị
├── FrontEnd/               # Mã nguồn Frontend (Next.js)
│   ├── src/app/            # Các trang giao diện
│   ├── src/components/     # UI Components
│   └── src/lib/            # API client và Utils
├── data/                   # Dữ liệu JSON thô của các khu vực (HCM, HN, Đà Nẵng...)
├── main.py                 # Entry point của FastAPI
└── requirements.txt        # Các dependencies Python
```
