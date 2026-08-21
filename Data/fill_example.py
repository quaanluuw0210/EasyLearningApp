import json
import requests
import os
from concurrent.futures import ThreadPoolExecutor

# ==========================================
# CẤU HÌNH SCRIPT
# ==========================================
INPUT_FILE = "communication-vocab.json"          # File JSON đầu vào của bạn
OUTPUT_FILE = "communication-vocab-updated.json" # File lưu kết quả
MODEL_NAME = "gemma3:4b"          # Tên model chuẩn (không chứa khoảng trắng)
OLLAMA_URL = "http://localhost:11434/api/chat"
BATCH_SIZE = 5                  # Số từ gửi trong 1 request
MAX_WORKERS = 1            # Số luồng chạy song song (1-2 là tối ưu cho máy cá nhân)

# ==========================================
# HÀM XỬ LÝ 1 BATCH QUA REST API
# ==========================================
def process_vocab_batch(batch):
    # Chuẩn bị dữ liệu tinh gọn gửi cho LLM
    words_to_send = [
        {
            "vocabId": item["vocabId"],
            "word": item["word"],
            "partOfSpeech": item.get("partOfSpeech", ""),
            "meaningVi": item.get("meaningVi", "")
        }
        for item in batch
    ]

    prompt = f"""Bạn là một chuyên gia biên soạn tài liệu học tiếng Anh. Hãy tạo 1 câu ví dụ tiếng Anh ngắn gọn, tự nhiên, chuẩn ngữ pháp (phù hợp với bài thi TOEIC/ngữ cảnh giao tiếp) cho từng từ vựng trong danh sách dưới đây.

    Danh sách từ vựng:
    {json.dumps(words_to_send, ensure_ascii=False, indent=2)}

    🔥 QUY TẮC BẮT BUỘC VỀ NỘI DUNG VÀ ĐỊNH DẠNG:
    1. Mỗi câu ví dụ phải là một câu HOÀN CHỈNH, đầy đủ chủ ngữ và động từ. KHÔNG dùng dấu ba chấm (...), KHÔNG bỏ dở câu.
    2. KHÔNG tô đậm, KHÔNG in nghiêng, KHÔNG dùng bất kỳ định dạng Markdown nào (KHÔNG dùng **, __, *, `). Tất cả là văn bản thuần (plain text).
    3. Chỉ trả về ĐÚNG 1 JSON object duy nhất chứa mảng "items". KHÔNG kèm theo bất kỳ văn bản giải thích nào khác.

    Cấu trúc JSON chính xác:
    {{
    "items": [
        {{
        "vocabId": "id_cua_tu",
        "exampleSentence": "Cau vi du tiếng Anh phai la van ban thuan khong co markdown."
        }}
    ]
    }}"""

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "stream": False,
        "format": "json",  # Ép Ollama trả về JSON thuần túY
        "options": {
            "temperature": 0.3
        }
    }

    try:
        # Timeout 60s để tránh bị treo khi máy tải nặng
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        output_text = response.json()['message']['content'].strip()
        raw_json = json.loads(output_text)
        
        # Tạo dict {vocabId: exampleSentence}
        result_dict = {}
        for item in raw_json.get("items", []):
            result_dict[item["vocabId"]] = item["exampleSentence"]
            
        return result_dict

    except Exception as e:
        print(f"❌ Lỗi khi xử lý Lô: {e}")
        return {}

# ==========================================
# LUỒNG CHÍNH (MAIN)
# ==========================================
def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    input_filepath = os.path.join(current_dir, INPUT_FILE)
    output_filepath = os.path.join(current_dir, OUTPUT_FILE)

    try:
        with open(input_filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {input_filepath}")
        return

    # Xác định mảng vocabularies
    is_nested = isinstance(data, dict) and "vocabularies" in data
    vocab_list = data["vocabularies"] if is_nested else data

    # 🔍 LỌC BỎ CÁC TỪ ĐÃ CÓ CÂU VÍ DỤ
    empty_items = [
        item for item in vocab_list 
        if not item.get("exampleSentence") or item.get("exampleSentence").strip() == ""
    ]
    
    total_vocab = len(vocab_list)
    skipped_count = total_vocab - len(empty_items)

    print(f"📌 Tổng số từ trong file: {total_vocab}")
    print(f"⏩ Đã bỏ qua (đã có ví dụ từ trước): {skipped_count} từ")
    print(f"📝 Cần sinh câu ví dụ mới: {len(empty_items)} từ")

    if len(empty_items) == 0:
        print("✅ Tất cả từ vựng đều đã có ví dụ! Không cần chạy thêm.")
        return

    # Chia nhỏ thành danh sách các batches
    batches = [
        empty_items[i:i + BATCH_SIZE] 
        for i in range(0, len(empty_items), BATCH_SIZE)
    ]
    total_batches = len(batches)

    print(f"🚀 Bắt đầu gửi {total_batches} lô đến Ollama ({MODEL_NAME})...")

    # Hàm xử lý từng batch và in kết quả
    def process_and_update(batch_index, batch_data):
        print(f"-> Đang xử lý Lô [{batch_index + 1}/{total_batches}] ({len(batch_data)} từ)...")
        generated_examples = process_vocab_batch(batch_data)
        
        success_count = 0
        for item in batch_data:
            v_id = item["vocabId"]
            if v_id in generated_examples and generated_examples[v_id]:
                item["exampleSentence"] = generated_examples[v_id]
                print(f"   ✓ [{item['word']}]: {item['exampleSentence']}")
                success_count += 1
            else:
                print(f"   ⚠️ Thất bại/Thiếu kết quả cho từ: {item['word']}")
        
        # Tự động lưu tiến độ vào file sau mỗi batch hoàn tất
        with open(output_filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            
        return success_count

    # Chạy xử lý bằng ThreadPoolExecutor tương tự file appendtag
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_and_update, idx, batch) 
            for idx, batch in enumerate(batches)
        ]
        for future in futures:
            future.result()

    print(f"\n🎉 Xuất dữ liệu thành công! Kết quả đã được cập nhật tại: {output_filepath}")

if __name__ == "__main__":
    main()