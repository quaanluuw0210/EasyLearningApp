
# 📚 SYSTEM ARCHITECTURE & DATA STRUCTURE DOCUMENTATION
> **Project:** TOEIC / English Learning Web App
> **Core Features:** Course & Topic Navigation, Flashcard System, Spaced Repetition System (SRS SM-2), Guest vs Authenticated User Progress Sync.

---

## 📄 1. CẤU TRÚC FILE JSON LOCAL (`data.json` / Seed Data / Guest Mode)

File JSON local phục vụ 2 mục đích:
1. Nạp dữ liệu thô (Seed Data) lên Firebase qua script Python.
2. Cung cấp dữ liệu tĩnh cho người dùng **Chưa đăng nhập (Guest Mode)**.

```json
{
  "courses": [
    {
      "courseId": "toeic-600",
      "title": "600 Từ Vựng TOEIC Căn Bản",
      "description": "600 từ vựng TOEIC cơ bản theo chủ đề chuẩn bài thi",
      "coverImage": "/assets/images/toeic600.png",
      "totalTopics": 50,
      "totalWords": 600,
      "isSystem": true
    }
  ],
  "topics": [
    {
      "topicId": "toeic-600-topic-01",
      "courseId": "toeic-600",
      "title": "Chủ đề 1: Contracts (Hợp đồng)",
      "order": 1,
      "totalWords": 12
    }
  ],
  "vocabularies": [
    {
      "vocabId": "vocab-toeic600-01-001",
      "courseId": "toeic-600",
      "topicId": "toeic-600-topic-01",
      "stt": 1,
      "word": "abide by",
      "wordDisplay": "abide by (v)",
      "partOfSpeech": "v",
      "phonetic": "/ə'baɪd baɪ/",
      "meaningVi": "tuân thủ, tuân theo",
      "exampleSentence": "Applicants must abide by the rules."
    }
  ]
}
```

## 2.Cấu trúc dữ liệu trên firestore

```
🔥 Cloud Firestore (Root)
│
└── 📁 users (Collection - Dữ liệu người dùng đã đăng nhập)
    └── 📄 {userId}
        ├── course_history              ← LỊCH SỬ HỌC
        │   ├── {courseId}
        │   │   ├── lastAccessedAt
        │   │   └── ...
        │   │
        │   └── {courseId}
        │       └── ...
        └── 📁 course_progress (Sub-collection)
            └── 📄 {courseId}
                └── 📁 topic_progress (Sub-collection)
                    └── 📄 {topicId}
                        ├── (Fields: Tiến trình Flashcard của Bài học)
                        └── 📁 srs_items (Sub-collection: Tiến trình SRS của từng Từ)
                            └── 📄 {vocabId}

```