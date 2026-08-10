import json
import os

# ============================================================
# CẤU HÌNH
# ============================================================

INPUT_FILE = "ets_2026_data.json"
OUTPUT_FILE = "ets_2026_data_new.json"


# ============================================================
# XỬ LÝ
# ============================================================

def build_word_display(item):
    """
    Tạo wordDisplay từ:
        word + partOfSpeech

    Ví dụ:
        word = "carry"
        partOfSpeech = "v"

    => "carry (v)"
    """

    word = item.get("word", "").strip()
    part_of_speech = item.get("partOfSpeech", "").strip()

    if not word:
        return None

    if part_of_speech:
        return f"{word} ({part_of_speech})"

    return word


def fix_vocabularies(data):
    count_added = 0
    count_existing = 0
    count_invalid = 0

    vocabularies = data.get("vocabularies", [])

    for vocab in vocabularies:

        # Đã có wordDisplay
        if vocab.get("wordDisplay"):
            count_existing += 1
            continue

        word_display = build_word_display(vocab)

        if word_display:
            vocab["wordDisplay"] = word_display
            count_added += 1
        else:
            count_invalid += 1

    return count_added, count_existing, count_invalid


# ============================================================
# MAIN
# ============================================================

if not os.path.exists(INPUT_FILE):
    print(f"Không tìm thấy file: {INPUT_FILE}")
    exit(1)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

added, existing, invalid = fix_vocabularies(data)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(
        data,
        f,
        ensure_ascii=False,
        indent=2
    )

print("==========================================")
print("Đã xử lý xong!")
print("==========================================")
print(f"Đã thêm wordDisplay : {added}")
print(f"Đã có sẵn           : {existing}")
print(f"Không thể xử lý     : {invalid}")
print(f"File output         : {OUTPUT_FILE}")