import os
import firebase_admin
from firebase_admin import credentials, firestore

# Khởi tạo Firebase
base_dir = os.path.dirname(os.path.abspath(__file__))
key_path = os.path.join(base_dir, "serviceAccountKey.json")

cred = credentials.Certificate(key_path)
firebase_admin.initialize_app(cred)

db = firestore.client()

def parse_value_schema(value, indent_level=0):
    """Phân tích kiểu dữ liệu, hỗ trợ Object/Map lồng nhau và Array"""
    pad = "  " * indent_level
    
    if isinstance(value, dict):
        if not value:
            return "Map {}"
        lines = ["Map {"]
        for k, v in value.items():
            lines.append(f"{pad}    - `{k}`: {parse_value_schema(v, indent_level + 1)}")
        lines.append(f"{pad}")
        return "\n".join(lines)
        
    elif isinstance(value, list):
        if not value:
            return "Array []"
        # Lấy kiểu dữ liệu của phần tử đầu tiên trong mảng
        elem_type = parse_value_schema(value[0], indent_level)
        return f"Array [{elem_type}]"
        
    elif isinstance(value, bool):
        return "Boolean"
    elif isinstance(value, (int, float)):
        return "Number"
    elif isinstance(value, str):
        return "String"
    elif value is None:
        return "Null"
    else:
        return type(value).__name__

def inspect_collection_deep(col_ref, max_depth=5, current_depth=1, sample_size=5):
    """Quét sâu vào collection và các subcollection"""
    indent = "  " * (current_depth - 1)
    output = f"{indent}📁 Collection: `{col_ref.id}`\n"
    
    # Lấy nhiều document mẫu để hợp nhất các field (Merge Schema)
    docs = list(col_ref.limit(sample_size).stream())
    
    if not docs:
        output += f"{indent}  (Collection rỗng)\n"
        return output
    
    # Gom tất cả các field từ nhiều doc mẫu
    merged_schema = {}
    for doc in docs:
        data = doc.to_dict()
        for key, val in data.items():
            if key not in merged_schema:
                merged_schema[key] = val

    output += f"{indent}  📄 Schema (Mẫu từ {len(docs)} docs):\n"
    for field_name, field_value in merged_schema.items():
        type_str = parse_value_schema(field_value, current_depth)
        output += f"{indent}    - `{field_name}`: {type_str}\n"
        
    # Đệ quy quét tất cả các Subcollection của từng document mẫu
    if current_depth < max_depth:
        for doc in docs:
            subcols = list(doc.reference.collections())
            for subcol in subcols:
                output += inspect_collection_deep(subcol, max_depth, current_depth + 1, sample_size)
                
    return output

def generate_deep_schema():
    print("⏳ Đang quét SÂU cấu trúc Firestore...")
    full_schema = "=== DETAILED FIRESTORE DATABASE SCHEMA ===\n\n"
    
    collections = db.collections()
    for col in collections:
        # Bạn có thể chỉnh max_depth và sample_size ở đây
        full_schema += inspect_collection_deep(col, max_depth=5, sample_size=5) + "\n"
        
    with open("firestore_schema_deep.txt", "w", encoding="utf-8") as f:
        f.write(full_schema)
        
    print("✅ Đã xuất cấu trúc chi tiết ra 'firestore_schema_deep.txt'!")

if __name__ == "__main__":
    generate_deep_schema()