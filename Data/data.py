import pandas as pd
import json
import re

def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).replace('\n', ' ').strip()

def process_sheet_7(file_path, sheet_index=6, course_info=None):
    if course_info is None:
        course_info = {
            "course_id": "drinks-vocab",
            "title": "Từ Vựng Chuyên Về Đồ Uống",
            "description": "Bộ từ vựng chuyên sâu về các loại đồ uống và pha chế"
        }

    course_id = course_info["course_id"]
    df = pd.read_excel(file_path, sheet_name=sheet_index, header=None)

    topics = []
    vocabularies = []

    current_topic_id = None
    topic_order = 0
    topic_word_count = 0

    for idx, row in df.iterrows():
        col0 = clean_text(row[0])
        col1 = clean_text(row[1]) if len(row) > 1 else ""
        col2 = clean_text(row[2]) if len(row) > 2 else ""

        # Kiểm tra xem col0 có phải là tiêu đề hay không
        # 1. Bắt đầu bằng 'Từ vựng', 'Các loại', 'Các món'...
        # 2. Hoặc cột col0 có chữ nhưng cột col1 và col2 hoàn toàn trống
        is_topic_header = (
            re.match(r'^(Từ vựng|Các|Chủ đề|Bộ từ)', col0, re.IGNORECASE) is not None
            or (bool(col0) and not col1 and not col2)
        )

        if is_topic_header:
            if current_topic_id and len(topics) > 0:
                topics[-1]["totalWords"] = topic_word_count

            topic_order += 1
            current_topic_id = f"{course_id}-topic-{topic_order:02d}"

            topics.append({
                "topicId": current_topic_id,
                "courseId": course_id,
                "title": f"Chủ đề {topic_order}: {col0}",
                "order": topic_order,
                "totalWords": 0
            })
            topic_word_count = 0
            continue

        # Nếu là dòng từ vựng (col0: Từ vựng, col1: Phiên âm, col2: Nghĩa)
        if col0 and current_topic_id:
            word = col0
            phonetic = col1 if col1.startswith('/') else ""
            meaning = col2 if col1.startswith('/') else col1

            topic_word_count += 1
            vocab_id = f"vocab-{course_id}-{topic_order:02d}-{topic_word_count:03d}"

            vocabularies.append({
                "vocabId": vocab_id,
                "courseId": course_id,
                "topicId": current_topic_id,
                "stt": topic_word_count,
                "word": word,
                "wordDisplay": word,
                "partOfSpeech": "n",
                "phonetic": phonetic,
                "meaningVi": meaning,
                "exampleSentence": ""
            })

    if current_topic_id and len(topics) > 0:
        topics[-1]["totalWords"] = topic_word_count

    result = {
        "courses": [{
            "courseId": course_id,
            "title": course_info["title"],
            "description": course_info["description"],
            "coverImage": f"/assets/images/{course_id}.png",
            "totalTopics": len(topics),
            "totalWords": len(vocabularies),
            "isSystem": True,
            "note": "Bộ từ vựng đồ uống phân theo chủ đề"
        }],
        "topics": topics,
        "vocabularies": vocabularies
    }

    with open("sheet7_drinks_fixed.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ Đã xử lý Sheet 7 thành công: {len(topics)} chủ đề, {len(vocabularies)} từ vựng!")

# Chạy cập nhật lại Sheet 7
process_sheet_7("list từ vựng.xlsx")