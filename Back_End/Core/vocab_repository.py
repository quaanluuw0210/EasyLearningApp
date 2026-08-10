import json
import os
from typing import Dict, List, Optional


class LocalVocabRepository:

    def __init__(self, file_name_or_path: str = "toeic_600_data.json"):
        # 1. Xác định thư mục hiện tại của file code này (BackEnd/Core)
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # 2. Đi ngược lên 2 cấp để về thư mục gốc, sau đó trỏ tới thư mục Data
        self.default_data_dir = os.path.abspath(
            os.path.join(current_dir, "..", "..", "Data")
        )

        # 3. Nếu truyền vào chỉ là tên file, tự động ghép với thư mục Data
        if not os.path.isabs(file_name_or_path) and not os.path.exists(
            file_name_or_path
        ):
            self.file_path = os.path.join(
                self.default_data_dir, file_name_or_path
            )
        else:
            self.file_path = file_name_or_path

        # Các biến cache nội bộ cho 1 file duy nhất
        self._courses: List[dict] = []
        self._topics: List[dict] = []
        self._vocabularies: List[dict] = []

        self._courses_by_id: Dict[str, dict] = {}
        self._topics_by_course: Dict[str, List[dict]] = {}
        self._topics_by_id: Dict[str, dict] = {}
        self._vocabs_by_topic: Dict[str, List[dict]] = {}
        self._vocabs_by_id: Dict[str, dict] = {}

        self._load_and_index_data()

    def _load_and_index_data(self) -> None:
        """Tải và đánh chỉ mục dữ liệu từ file_path hiện tại."""
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(
                f"Không tìm thấy file dữ liệu tại đường dẫn: {self.file_path}"
            )

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self._courses = data.get("courses", [])
        self._topics = data.get("topics", [])
        self._vocabularies = data.get("vocabularies", [])

        # Index Courses
        for course in self._courses:
            c_id = course.get("courseId")
            if c_id:
                self._courses_by_id[c_id] = course

        # Index Topics
        for topic in self._topics:
            t_id = topic.get("topicId")
            c_id = topic.get("courseId")
            if t_id:
                self._topics_by_id[t_id] = topic
            if c_id:
                self._topics_by_course.setdefault(c_id, []).append(topic)

        for c_id in self._topics_by_course:
            self._topics_by_course[c_id].sort(key=lambda x: x.get("order", 0))

        # Index Vocabularies
        for vocab in self._vocabularies:
            v_id = vocab.get("vocabId")
            t_id = vocab.get("topicId")
            if v_id:
                self._vocabs_by_id[v_id] = vocab
            if t_id:
                self._vocabs_by_topic.setdefault(t_id, []).append(vocab)

        for t_id in self._vocabs_by_topic:
            self._vocabs_by_topic[t_id].sort(key=lambda x: x.get("stt", 0))

    # =========================================================================
    # HÀM MỚI BỔ SUNG: QUÉT TOÀN BỘ FILE JSON TRONG FOLDER DATA DỂ LẤY COURSES
    # =========================================================================
    @classmethod
    def get_all_courses_from_data_dir(
        cls, data_dir_path: Optional[str] = None
    ) -> List[dict]:
        """
        Quét qua toàn bộ các file .json trong thư mục Data để gom tất cả các khóa học lại.
        Mỗi khóa học được đính kèm thêm trường 'fileName' để Frontend/Backend dễ truy vết.
        """
        if data_dir_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            data_dir_path = os.path.abspath(
                os.path.join(current_dir, "..", "..", "Data")
            )

        if not os.path.exists(data_dir_path):
            print(f"⚠️ Thư mục không tồn tại: {data_dir_path}")
            return []

        all_courses: List[dict] = []

        # Lặp qua tất cả file trong thư mục Data
        for file_name in os.listdir(data_dir_path):
            if file_name.endswith(".json"):
                file_path = os.path.join(data_dir_path, file_name)

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    # Chỉ xử lý nếu file có chứa danh sách "courses"
                    if isinstance(data, dict) and "courses" in data:
                        for course in data["courses"]:
                            course_info = dict(course)
                            # Gắn thêm fileName để Backend biết file nào chứa dữ liệu khóa này
                            course_info["fileName"] = file_name
                            all_courses.append(course_info)

                except Exception as e:
                    print(f"❌ Lỗi khi đọc file {file_name}: {e}")

        return all_courses

    # =========================================================================
    # CÁC PHƯƠNG THỨC TRA CỨU DỮ LIỆU ĐÃ CÓ
    # =========================================================================
    def get_all_courses(self) -> List[dict]:
        return self._courses

    def get_topics_by_course(self, course_id: str) -> List[dict]:
        return self._topics_by_course.get(course_id, [])

    def get_vocabularies_by_topic(self, topic_id: str) -> List[dict]:
        return self._vocabs_by_topic.get(topic_id, [])

    def get_all_vocabularies(self) -> List[dict]:
        return list(self._vocabularies)

    def get_vocabulary_by_id(self, vocab_id: str) -> Optional[dict]:
        return self._vocabs_by_id.get(vocab_id)


# =========================================================================
# TEST HÀM MỚI
# =========================================================================
if __name__ == "__main__":
    print("--- 1. TEST QUÉT TOÀN BỘ KHÓA HỌC TRONG THƯ MỤC DATA ---")
    all_system_courses = LocalVocabRepository.get_all_courses_from_data_dir()

    print(f"Tìm thấy tổng cộng {len(all_system_courses)} khóa học:")
    for course in all_system_courses:
        print(
            f" - [{course.get('courseId')}] {course.get('title')} (File: {course.get('fileName')})"
        )

    print("\n" + "=" * 50 + "\n")

    print("--- 2. TEST MỞ 1 FILE CỤ THỂ ĐỂ LẤY BỘ TỪ ---")
    repo = LocalVocabRepository("toeic_600_data.json")
    topics = repo.get_topics_by_course("toeic-600")
    print(f"Số lượng chủ đề trong toeic_600_data.json: {len(topics)}")