import json
import firebase_admin
from firebase_admin import credentials, firestore

# 1. Khởi tạo kết nối với Firebase bằng Service Account
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def upload_json_to_firestore(json_file_path):
    print(f"📖 Đang đọc file {json_file_path}...")
    with open(json_file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 2. Upload Collection 'courses'
    print("🚀 Đang đẩy dữ liệu Collection 'courses'...")
    for course in data.get("courses", []):
        course_id = course["courseId"]
        db.collection("courses").document(course_id).set(course)
        print(f"   -> Đã thêm khóa học: {course['title']}")

    # 3. Upload Collection 'topics'
    print("🚀 Đang đẩy dữ liệu Collection 'topics'...")
    for topic in data.get("topics", []):
        topic_id = topic["topicId"]
        db.collection("topics").document(topic_id).set(topic)
        print(f"   -> Đã thêm chủ đề: {topic['title']}")

    # 4. Upload Collection 'vocabularies' (Gom batch 500 từ/lần đẩy)
    vocabularies = data.get("vocabularies", [])
    print(f"🚀 Đang đẩy dữ liệu Collection 'vocabularies' ({len(vocabularies)} từ vựng)...")
    
    batch = db.batch()
    count = 0
    total_uploaded = 0

    for vocab in vocabularies:
        vocab_id = vocab["vocabId"]
        doc_ref = db.collection("vocabularies").document(vocab_id)
        batch.set(doc_ref, vocab)
        count += 1

        # Firestore giới hạn 500 thao tác / 1 batch write
        if count == 500:
            batch.commit()
            total_uploaded += count
            print(f"   -> Đã tải lên {total_uploaded}/{len(vocabularies)} từ...")
            batch = db.batch()
            count = 0

    if count > 0:
        batch.commit()
        total_uploaded += count
        print(f"   -> Đã tải lên toàn bộ {total_uploaded}/{len(vocabularies)} từ...")

    print("🎉 HOÀN THÀNH! DỮ LIỆU ĐÃ NẰM TRÊN FIREBASE!")

if __name__ == "__main__":
    # Thay tên file JSON bạn muốn upload vào đây:
    upload_json_to_firestore("ets_2026_data.json")