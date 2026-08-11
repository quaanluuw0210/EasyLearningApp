from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status
import asyncio
from pydantic import BaseModel, Field
import json
import os
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from Back_End.Core.auth_handler import get_db
from Back_End.Core.vocab_repository import LocalVocabRepository

# Trả về giờ UTC có chứa thông tin múi giờ UTC rõ ràng (timezone-aware)
def get_utc_now():
    return datetime.now(timezone.utc)

router = APIRouter(prefix="/api/v1/learning", tags=["Vocabulary & SRS Learning"])

db = get_db()

DATA_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Data"))
DEFAULT_VOCAB_FILE = "toeic_600_data.json"

_cached_vocab_store: Optional[dict] = None


class SRSProgress(BaseModel):
    ef: float = Field(..., description="Ease factor")
    repetitions: int = Field(..., description="Số lần lặp lại liên tiếp thành công")
    interval: int = Field(..., description="Khoảng cách ôn tập (ngày)")
    nextReviewDate: datetime = Field(..., description="Ngày xem lại kế tiếp ở UTC")
    lastReviewedAt: datetime = Field(..., description="Thời điểm cập nhật lần cuối ở UTC")
    quality: int = Field(..., ge=0, le=5, description="Đánh giá lần học gần nhất")


class VocabularyItem(BaseModel):
    vocabId: str
    courseId: str
    topicId: str
    stt: int
    word: str
    wordDisplay: str
    partOfSpeech: Optional[str] = None
    phonetic: Optional[str] = None
    meaningVi: Optional[str] = None
    exampleSentence: Optional[str] = None


class VocabularyWithSRS(VocabularyItem):
    srs_progress: Optional[SRSProgress] = None


class CourseItem(BaseModel):
    courseId: str
    title: str
    description: Optional[str] = None
    coverImage: Optional[str] = None
    totalTopics: Optional[int] = None
    totalWords: Optional[int] = None
    isSystem: Optional[bool] = None


class TopicItem(BaseModel):
    topicId: str
    courseId: str
    title: str
    order: Optional[int] = None
    totalWords: Optional[int] = None


class SRSReviewRequest(BaseModel):
    user_id: str
    course_id: str
    topic_id: str
    vocab_id: str
    quality: int = Field(..., ge=0, le=5, description="Đánh giá mức độ nhớ từ 0 đến 5")


class TopicFlashcardProgressRequest(BaseModel):
    user_id: str
    flashcardCurrentIndex: int = Field(0, ge=0)
    flashcardViewedCards: List[int] = Field(default_factory=list)
    flashcardUpdatedAt: Optional[datetime] = None


class TopicFlashcardProgressResponse(BaseModel):
    flashcardCurrentIndex: int
    flashcardViewedCards: List[int]
    flashcardUpdatedAt: Optional[datetime] = None


class GuestSyncItem(BaseModel):
    course_id: str
    topic_id: str
    vocab_id: str
    quality: int = Field(..., ge=0, le=5)
    reviewed_at: Optional[datetime] = None


class GuestSyncRequest(BaseModel):
    user_id: str
    reviews: List[GuestSyncItem]


class CourseHistoryItem(BaseModel):
    user_id: str
    course_id: str
    lastAccessedAt: datetime
    updatedAt: Optional[datetime] = None


class CourseHistoryCreateRequest(BaseModel):
    user_id: str
    course_id: str
    last_accessed_at: Optional[datetime] = None


class CourseHistoryUpdateRequest(BaseModel):
    last_accessed_at: Optional[datetime] = None


_REPO_CACHE: dict[str, LocalVocabRepository] = {}
_ALL_COURSES_CACHE: Optional[List[dict]] = None


def _resolve_data_file(file_name: Optional[str]) -> str:
    file_name = file_name or DEFAULT_VOCAB_FILE
    if os.path.isabs(file_name):
        return file_name
    return os.path.join(DATA_DIRECTORY, file_name)


def _get_cached_vocab_repository(file_name: Optional[str] = None) -> LocalVocabRepository:
    file_path = _resolve_data_file(file_name)
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy file JSON dữ liệu: {file_path}"
        )

    repo = _REPO_CACHE.get(file_path)
    if repo is None:
        repo = LocalVocabRepository(file_path)
        _REPO_CACHE[file_path] = repo
    return repo


def _get_all_courses(file_name: Optional[str] = None) -> List[dict]:
    global _ALL_COURSES_CACHE
    if file_name is None:
        if _ALL_COURSES_CACHE is not None:
            return _ALL_COURSES_CACHE
        courses = LocalVocabRepository.get_all_courses_from_data_dir(DATA_DIRECTORY)
        _ALL_COURSES_CACHE = courses
        return courses

    repo = _get_cached_vocab_repository(file_name)
    return repo.get_all_courses()


def _find_repo_by_course_id(course_id: str, file_name: Optional[str] = None) -> LocalVocabRepository:
    if file_name is not None:
        return _get_cached_vocab_repository(file_name)

    for course in _get_all_courses():
        if course.get("courseId") == course_id:
            return _get_cached_vocab_repository(course.get("fileName"))

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Không tìm thấy khóa học với courseId={course_id} trong thư mục Data."
    )


def _get_repo_for_topic(course_id: str, topic_id: str, file_name: Optional[str] = None) -> LocalVocabRepository:
    repo = _find_repo_by_course_id(course_id, file_name)
    topics = repo.get_topics_by_course(course_id)
    if not any(topic.get("topicId") == topic_id for topic in topics):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy topicId={topic_id} cho courseId={course_id} trong file {repo.file_path}."
        )
    return repo


def _filter_vocabularies(course_id: str, topic_id: str, file_name: Optional[str] = None) -> List[dict]:
    repo = _get_repo_for_topic(course_id, topic_id, file_name)
    vocab_list = repo.get_vocabularies_by_topic(topic_id)
    if not vocab_list:
        return []
    return [vocab for vocab in vocab_list if vocab.get("courseId") == course_id]


def _build_srs_progress(data: dict) -> SRSProgress:
    return SRSProgress(
        ef=float(data.get("ef", 2.5)),
        repetitions=int(data.get("repetitions", 0)),
        interval=int(data.get("interval", 0)),
        nextReviewDate=data.get("nextReviewDate"),
        lastReviewedAt=data.get("lastReviewedAt"),
        quality=int(data.get("quality", 0)),
    )

def _calculate_sm2(quality: int, ef: float, repetitions: int, interval: int) -> tuple[float, int, int, datetime]:
    # 1. Cập nhật Ease Factor (EF)
    ef_prime = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef_prime = max(1.3, ef_prime)

    now = get_utc_now()

    # 2. Xử lý các bước MỚI HỌC / HỌC LẠI (Learning Steps - Tính theo PHÚT)
    # Mapping nút bấm: quality 1=Again (<1m), 2=Hard (<6m), 3=Good (<10m)
    if quality < 3: # Again hoặc Hard (Thất bại / Khó)
        repetitions = 0
        interval = 0  # 0 ngày (đang trong giai đoạn học theo phút)
        
        # Quality 1 (Again) -> 1 phút, Quality 2 (Hard) -> 6 phút
        minutes_add = 1 if quality == 1 else 6 
        next_review_date = now + timedelta(minutes=minutes_add)

    elif repetitions == 0 and quality == 3: # Good lần đầu tiên -> Bước học 10 phút
        interval = 0
        minutes_add = 10
        next_review_date = now + timedelta(minutes=minutes_add)
        # Giữ repetitions = 0 để lần sau bấm Good tiếp mới chính thức Graduated sang 1 ngày

    # 3. Xử lý khi từ vựng TỐT NGHIỆP (Graduated - Tính theo NGÀY)
    else:
        if repetitions == 0:  # Chọn Easy ngay từ đầu (quality >= 4)
            interval = 5      # 5 ngày theo nhãn Easy (5d)
            repetitions = 1
        elif repetitions == 1: # Đã qua bước 10m, bấm Good tiếp -> Nhảy lên 1 ngày
            interval = 1
            repetitions = 2
        elif repetitions == 2: # Nhảy lên 6 ngày
            interval = 6
            repetitions = 3
        else:                  # Tăng trưởng theo hệ số EF
            interval = max(1, round(interval * ef_prime))
            repetitions += 1
            
        next_review_date = now + timedelta(days=interval)

    return ef_prime, repetitions, interval, next_review_date


def _safe_document_path(*parts: str):
    return "/".join(str(part).strip().strip("/") for part in parts)


async def _get_user_srs_map(user_id: str, course_id: str, topic_id: str) -> dict:
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    topic_ref = db.collection("users").document(user_id)
    topic_ref = topic_ref.collection("course_progress").document(course_id)
    topic_ref = topic_ref.collection("topic_progress").document(topic_id)
    srs_collection = topic_ref.collection("srs_items")

    def stream_items():
        return list(srs_collection.stream())

    docs = await asyncio.to_thread(stream_items)
    return {doc.id: doc.to_dict() for doc in docs}


async def _save_srs_item(user_id: str, course_id: str, topic_id: str, vocab_id: str, progress: dict):
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    item_ref = db.collection("users").document(user_id)
    item_ref = item_ref.collection("course_progress").document(course_id)
    item_ref = item_ref.collection("topic_progress").document(topic_id)
    item_ref = item_ref.collection("srs_items").document(vocab_id)

    def write_item():
        item_ref.set(progress, merge=True)

    await asyncio.to_thread(write_item)


async def _save_srs_topic_batch(
    user_id: str,
    course_id: str,
    topic_id: str,
    item_updates: List[tuple[str, dict]],
    last_studied_at: datetime,
):
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    topic_ref = db.collection("users").document(user_id)
    topic_ref = topic_ref.collection("course_progress").document(course_id)
    topic_ref = topic_ref.collection("topic_progress").document(topic_id)

    def commit_batch():
        batch = db.batch()
        for vocab_id, progress in item_updates:
            item_ref = topic_ref.collection("srs_items").document(vocab_id)
            batch.set(item_ref, progress, merge=True)
        batch.set(topic_ref, {"lastStudiedAt": last_studied_at}, merge=True)
        batch.commit()

    await asyncio.to_thread(commit_batch)


async def _update_topic_last_studied(user_id: str, course_id: str, topic_id: str, last_studied_at: datetime):
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    topic_doc_ref = db.collection("users").document(user_id)
    topic_doc_ref = topic_doc_ref.collection("course_progress").document(course_id)
    topic_doc_ref = topic_doc_ref.collection("topic_progress").document(topic_id)

    def update_doc():
        topic_doc_ref.set({"lastStudiedAt": last_studied_at}, merge=True)

    await asyncio.to_thread(update_doc)


async def _get_topic_flashcard_progress(user_id: str, course_id: str, topic_id: str) -> dict:
    if db is None:
        return {}

    topic_doc_ref = db.collection("users").document(user_id)
    topic_doc_ref = topic_doc_ref.collection("course_progress").document(course_id)
    topic_doc_ref = topic_doc_ref.collection("topic_progress").document(topic_id)

    def read_doc():
        return topic_doc_ref.get()

    doc = await asyncio.to_thread(read_doc)
    if doc.exists:
        return doc.to_dict() or {}
    return {}


async def _save_topic_flashcard_progress(
    user_id: str,
    course_id: str,
    topic_id: str,
    index: int,
    viewed_cards: List[int],
    updated_at: datetime
):
    if db is None:
        return

    topic_doc_ref = db.collection("users").document(user_id)
    topic_doc_ref = topic_doc_ref.collection("course_progress").document(course_id)
    topic_doc_ref = topic_doc_ref.collection("topic_progress").document(topic_id)

    def write_doc():
        topic_doc_ref.set({
            "flashcardCurrentIndex": index,
            "flashcardViewedCards": viewed_cards,
            "flashcardUpdatedAt": updated_at,
            "lastStudiedAt": updated_at,
        }, merge=True)

    await asyncio.to_thread(write_doc)



async def _save_course_history(user_id: str, course_id: str, last_accessed_at: datetime):
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    history_ref = db.collection("users").document(user_id)
    history_ref = history_ref.collection("course_history").document(course_id)

    def write_doc():
        history_ref.set(
            {
                "lastAccessedAt": last_accessed_at,
                "updatedAt": get_utc_now(),
            },
            merge=True,
        )

    await asyncio.to_thread(write_doc)


async def _get_course_history(user_id: str) -> List[dict]:
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    user_ref = db.collection("users").document(user_id)

    def read_docs():
        return list(user_ref.collection("course_history").stream())

    docs = await asyncio.to_thread(read_docs)
    return [doc.to_dict() for doc in docs]


async def _get_course_history_item(user_id: str, course_id: str) -> Optional[dict]:
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    item_ref = db.collection("users").document(user_id)
    item_ref = item_ref.collection("course_history").document(course_id)

    def read_doc():
        return item_ref.get()

    doc = await asyncio.to_thread(read_doc)
    if not doc.exists:
        return None
    return doc.to_dict()


async def _delete_course_history(user_id: str, course_id: str):
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    item_ref = db.collection("users").document(user_id)
    item_ref = item_ref.collection("course_history").document(course_id)

    def delete_doc():
        item_ref.delete()

    await asyncio.to_thread(delete_doc)


async def _collect_user_srs_items(user_id: str) -> List[dict]:
    if db is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firestore client is not initialized.")

    user_ref = db.collection("users").document(user_id)
    course_refs = await asyncio.to_thread(lambda: list(user_ref.collection("course_progress").stream()))
    due_items: List[dict] = []

    for course_doc in course_refs:
        topic_refs = await asyncio.to_thread(lambda: list(course_doc.reference.collection("topic_progress").stream()))
        for topic_doc in topic_refs:
            srs_refs = await asyncio.to_thread(lambda: list(topic_doc.reference.collection("srs_items").stream()))
            for srs_doc in srs_refs:
                item = srs_doc.to_dict()
                item["course_id"] = course_doc.id
                item["topic_id"] = topic_doc.id
                item["vocab_id"] = srs_doc.id
                due_items.append(item)

    return due_items


@router.get("/courses", response_model=List[CourseItem])
def get_all_courses(file_name: Optional[str] = Query(None, description="Tên file JSON dữ liệu vocab local")):
    courses = _get_all_courses(file_name)
    return [CourseItem(**course) for course in courses]


@router.get("/vocabularies", response_model=List[VocabularyItem])
def get_all_vocabularies(file_name: Optional[str] = Query(None, description="Tên file JSON dữ liệu vocab local")):
    repo = _get_cached_vocab_repository(file_name)
    vocab_items = repo.get_all_vocabularies()
    if not vocab_items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy từ vựng trong file dữ liệu.")
    return [VocabularyItem(**vocab) for vocab in vocab_items]


@router.get("/courses/{course_id}/topics", response_model=List[TopicItem])
def get_topics_by_course(
    course_id: str,
    file_name: Optional[str] = Query(None, description="Tên file JSON dữ liệu vocab local")
):
    repo = _find_repo_by_course_id(course_id, file_name)
    topics = repo.get_topics_by_course(course_id)
    if not topics:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy chủ đề cho khóa học này.")
    return [TopicItem(**topic) for topic in topics]


@router.get("/courses/{course_id}/topics/{topic_id}/flashcard-progress", response_model=TopicFlashcardProgressResponse)
async def get_topic_flashcard_progress(
    course_id: str,
    topic_id: str,
    user_id: str = Query(..., description="User ID to fetch flashcard progress")
):
    data = await _get_topic_flashcard_progress(user_id, course_id, topic_id)
    return TopicFlashcardProgressResponse(
        flashcardCurrentIndex=int(data.get("flashcardCurrentIndex", 0)),
        flashcardViewedCards=list(data.get("flashcardViewedCards", [])),
        flashcardUpdatedAt=data.get("flashcardUpdatedAt"),
    )


@router.post("/courses/{course_id}/topics/{topic_id}/flashcard-progress")
async def save_topic_flashcard_progress(
    course_id: str,
    topic_id: str,
    payload: TopicFlashcardProgressRequest
):
    now = get_utc_now()
    updated_at = payload.flashcardUpdatedAt or now
    await _save_topic_flashcard_progress(
        user_id=payload.user_id,
        course_id=course_id,
        topic_id=topic_id,
        index=payload.flashcardCurrentIndex,
        viewed_cards=payload.flashcardViewedCards,
        updated_at=updated_at,
    )

    return {
        "status": "success",
        "message": "Đã lưu tiến trình Flashcard thành công.",
        "data": {
            "course_id": course_id,
            "topic_id": topic_id,
            "flashcardCurrentIndex": payload.flashcardCurrentIndex,
            "flashcardViewedCards": payload.flashcardViewedCards,
            "flashcardUpdatedAt": updated_at,
        },
    }


@router.get("/courses/{course_id}/topics/{topic_id}/vocabularies", response_model=List[VocabularyWithSRS])

async def get_topic_vocabularies(
    course_id: str,
    topic_id: str,
    user_id: Optional[str] = Query(None, description="Optional user ID to include SRS progress data"),
    file_name: Optional[str] = Query(None, description="Tên file JSON dữ liệu vocab local")
):
    vocab_items = _filter_vocabularies(course_id, topic_id, file_name)
    if not vocab_items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy từ vựng cho chủ đề này.")

    srs_map = {}
    if user_id:
        srs_map = await _get_user_srs_map(user_id, course_id, topic_id)

    results: List[VocabularyWithSRS] = []
    for vocab in vocab_items:
        srs_data = srs_map.get(vocab["vocabId"])
        progress = _build_srs_progress(srs_data) if srs_data else None
        results.append(VocabularyWithSRS(**vocab, srs_progress=progress))

    return results


@router.post("/srs/review")
async def review_srs_item(review: SRSReviewRequest):
    if not (0 <= review.quality <= 5):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quality phải nằm giữa 0 và 5.")
    
    existing_map = await _get_user_srs_map(review.user_id, review.course_id, review.topic_id)
    existing = existing_map.get(review.vocab_id, {})

    current_ef = float(existing.get("ef", 2.5))
    current_repetitions = int(existing.get("repetitions", 0))
    current_interval = int(existing.get("interval", 0))

    ef_prime, repetitions, interval, next_review_date = _calculate_sm2(
        review.quality, current_ef, current_repetitions, current_interval
    )

    now = get_utc_now()
    progress_record = {
        "ef": ef_prime,
        "repetitions": repetitions,
        "interval": interval,
        "nextReviewDate": next_review_date,
        "lastReviewedAt": now,
        "quality": review.quality,
        "updatedAt": now,
    }

    await _save_srs_item(review.user_id, review.course_id, review.topic_id, review.vocab_id, progress_record)
    await _update_topic_last_studied(review.user_id, review.course_id, review.topic_id, now)

    return {
        "status": "success",
        "message": "Đã cập nhật tiến trình SRS thành công.",
        "data": {
            "vocab_id": review.vocab_id,
            "course_id": review.course_id,
            "topic_id": review.topic_id,
            "srs_progress": progress_record,
        },
    }


@router.get("/srs/due-cards/{user_id}", response_model=List[VocabularyWithSRS])
async def get_due_cards(
    user_id: str,
    file_name: Optional[str] = Query(None, description="Tên file JSON dữ liệu vocab local")
):
    due_cards: List[VocabularyWithSRS] = []
    now = get_utc_now()
    srs_items = await _collect_user_srs_items(user_id)

    for item in srs_items:
        next_review_date = item.get("nextReviewDate")
        if not isinstance(next_review_date, datetime):
            continue
        if next_review_date <= now:
            vocab_list = _filter_vocabularies(item["course_id"], item["topic_id"], file_name)
            vocab_data = next((v for v in vocab_list if v.get("vocabId") == item["vocab_id"]), None)
            if not vocab_data:
                continue
            progress = _build_srs_progress(item)
            due_cards.append(VocabularyWithSRS(**vocab_data, srs_progress=progress))

    return due_cards


@router.post("/progress/sync-guest")
async def sync_guest_progress(data: GuestSyncRequest, background_tasks: BackgroundTasks):
    if not data.reviews:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu đồng bộ.")

    user_id = data.user_id
    now = get_utc_now()
    results = []
    reviews_by_topic: dict[tuple[str, str], list[GuestSyncItem]] = {}
    for review_item in data.reviews:
        reviews_by_topic.setdefault((review_item.course_id, review_item.topic_id), []).append(review_item)

    for (course_id, topic_id), topic_reviews in reviews_by_topic.items():
        existing_map = await _get_user_srs_map(user_id, course_id, topic_id)
        item_updates_by_vocab: dict[str, dict] = {}
        last_studied_at = now

        for review_item in topic_reviews:
            reviewed_at = review_item.reviewed_at or now
            last_studied_at = max(last_studied_at, reviewed_at)
            existing = existing_map.get(review_item.vocab_id, {})

            current_ef = float(existing.get("ef", 2.5))
            current_repetitions = int(existing.get("repetitions", 0))
            current_interval = int(existing.get("interval", 0))
            ef_prime, repetitions, interval, next_review_date = _calculate_sm2(
                review_item.quality, current_ef, current_repetitions, current_interval
            )

            progress_record = {
                "ef": ef_prime,
                "repetitions": repetitions,
                "interval": interval,
                "nextReviewDate": next_review_date,
                "lastReviewedAt": reviewed_at,
                "quality": review_item.quality,
                "updatedAt": now,
            }
            existing_map[review_item.vocab_id] = progress_record
            item_updates_by_vocab[review_item.vocab_id] = progress_record
            results.append({
                "course_id": course_id,
                "topic_id": topic_id,
                "vocab_id": review_item.vocab_id,
                "quality": review_item.quality,
                "nextReviewDate": next_review_date,
            })

        await _save_srs_topic_batch(
            user_id,
            course_id,
            topic_id,
            list(item_updates_by_vocab.items()),
            last_studied_at,
        )

    return {
        "status": "success",
        "message": "Đã đồng bộ tiến trình Guest Mode vào Firestore.",
        "synced": len(results),
        "results": results,
    }


@router.post("/history")
async def create_course_history(data: CourseHistoryCreateRequest):
    last_accessed_at = data.last_accessed_at or get_utc_now()
    await _save_course_history(data.user_id, data.course_id, last_accessed_at)

    return {
        "status": "success",
        "message": "Đã lưu lịch sử khóa học thành công.",
        "data": {
            "user_id": data.user_id,
            "course_id": data.course_id,
            "lastAccessedAt": last_accessed_at,
        },
    }


@router.get("/history/{user_id}", response_model=List[CourseHistoryItem])
async def get_course_history(user_id: str):
    items = await _get_course_history(user_id)
    return [CourseHistoryItem(user_id=user_id, **item) for item in items]


@router.get("/history/{user_id}/{course_id}", response_model=CourseHistoryItem)
async def get_course_history_item(user_id: str, course_id: str):
    item = await _get_course_history_item(user_id, course_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lịch sử khóa học.")
    return CourseHistoryItem(user_id=user_id, course_id=course_id, **item)


@router.put("/history/{user_id}/{course_id}")
async def update_course_history(user_id: str, course_id: str, data: CourseHistoryUpdateRequest):
    existing = await _get_course_history_item(user_id, course_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lịch sử khóa học để cập nhật.")

    last_accessed_at = data.last_accessed_at or get_utc_now()
    await _save_course_history(user_id, course_id, last_accessed_at)

    return {
        "status": "success",
        "message": "Đã cập nhật lịch sử khóa học.",
        "data": {
            "user_id": user_id,
            "course_id": course_id,
            "lastAccessedAt": last_accessed_at,
        },
    }


@router.delete("/history/{user_id}/{course_id}")
async def delete_course_history(user_id: str, course_id: str):
    existing = await _get_course_history_item(user_id, course_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lịch sử khóa học để xoá.")

    await _delete_course_history(user_id, course_id)
    return {
        "status": "success",
        "message": "Đã xóa lịch sử khóa học.",
        "course_id": course_id,
    }
