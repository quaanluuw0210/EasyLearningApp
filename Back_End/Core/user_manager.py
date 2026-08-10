from datetime import datetime
from typing import Optional, Dict, Any, List
import asyncio
from firebase_admin import firestore
from Back_End.Core.auth_handler import get_db

class UserManager:
    def __init__(self):
        pass

    def _get_db(self):
        db = get_db()
        if db is None:
            raise Exception("Firestore client is not initialized.")
        return db

    def _get_collection(self):
        return self._get_db().collection("users")

    async def sync_user(self, uid: str, email: str, name: Optional[str] = None, photo_url: Optional[str] = None) -> bool:
        """
        Đồng bộ hoặc tạo mới thông tin người dùng.
        Sử dụng asyncio.to_thread để không chặn event loop của FastAPI khi gọi Firestore SDK (đồng bộ).
        """
        return await asyncio.to_thread(self._sync_user_sync, uid, email, name, photo_url)

    def _sync_user_sync(self, uid: str, email: str, name: Optional[str], photo_url: Optional[str]) -> bool:
        try:
            col = self._get_collection()
            user_ref = col.document(uid)
            
            # Log để debug (có thể xóa sau khi ổn định)
            print(f">>> Syncing User: {uid}, Email: {email}, Name Provided: {name}")

            user_data = {
                "uid": uid,
                "email": email,
                "photo_url": photo_url,
                "last_login": datetime.now(),
                "updated_at": datetime.now()
            }

            
            doc = user_ref.get()
            current_role = "user" # Mặc định quyền ban đầu là user

            if doc.exists:
                existing_data = doc.to_dict() or {}
                
                # Lấy role hiện tại trong DB ra (nếu có), nếu chưa có trường 'role' thì gán bằng "user"
                current_role = existing_data.get("role", "user")
                
                # Nếu trong DB chưa có trường 'role', ta sẽ bổ sung nó vào object để ghi đè lên DB
                if "role" not in existing_data:
                    user_data["role"] = "user"
            else:
                # Nếu là User mới tinh đăng nhập lần đầu -> Tự động thêm trường role: "user"
                user_data["role"] = "user"
            
            # Xử lý Display Name thông minh hơn
            if name and name.strip():
                # Nếu có tên hợp lệ, luôn cập nhật
                user_data["display_name"] = name
            else:
                # Nếu không có tên truyền vào, kiểm tra xem trong DB đã có tên chưa
                if doc.exists:
                    existing_data = doc.to_dict()
                    # Nếu đã có tên rồi thì không ghi đè bằng email prefix nữa
                    if not existing_data.get("display_name"):
                        user_data["display_name"] = email.split("@")[0] if email else "User"
                else:
                    # Nếu là user mới hoàn toàn thì mới dùng fallback email
                    user_data["display_name"] = email.split("@")[0] if email else "User"
            
            # Merge=True: Chỉ cập nhật các trường có trong user_data
            user_ref.set(user_data, merge=True)
            return current_role
        except Exception as e:
            print(f">>> UserManager Error (sync_user): {e}")
            return False

    async def update_user_data(self, uid: str, data: Dict[str, Any]) -> bool:
        """
        Cập nhật các trường dữ liệu tùy chỉnh cho user.
        """
        return await asyncio.to_thread(self._update_user_data_sync, uid, data)

    def _update_user_data_sync(self, uid: str, data: Dict[str, Any]) -> bool:
        try:
            col = self._get_collection()
            data["updated_at"] = datetime.now()
            col.document(uid).update(data)
            return True
        except Exception as e:
            print(f">>> UserManager Error (update_user_data): {e}")
            return False

    async def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """
        Lấy thông tin profile từ Firestore.
        """
        return await asyncio.to_thread(self._get_user_profile_sync, uid)

    def _get_user_profile_sync(self, uid: str) -> Optional[Dict[str, Any]]:
        try:
            col = self._get_collection()
            doc = col.document(uid).get()
            if doc.exists:
                data = doc.to_dict()
                
                # Lấy allergies từ subcollection user_health_profile
                health_doc = col.document(uid).collection("user_health_profile").document("profile").get()
                if health_doc.exists:
                    health_data = health_doc.to_dict()
                    data["allergies"] = health_data.get("raw_selections", {}).get("selected_allergies", [])
                else:
                    data["allergies"] = []
                    
                return data
            return None
        except Exception as e:
            print(f">>> UserManager Error (get_user_profile): {e}")
            return None

    async def update_user_profile(self, uid: str, update_data: dict) -> bool:
        """
        Cập nhật thông tin profile của user: name, avatar, allergies.
        """
        return await asyncio.to_thread(self._update_user_profile_sync, uid, update_data)

    def _update_user_profile_sync(self, uid: str, update_data: dict) -> bool:
        try:
            col = self._get_collection()
            
            # 1. Cập nhật thông tin cơ bản (name, avatar) vào document user
            data_to_update = {"updated_at": datetime.now()}
            if "name" in update_data and update_data["name"] is not None:
                data_to_update["display_name"] = update_data["name"]
            if "avatar" in update_data and update_data["avatar"] is not None:
                data_to_update["photo_url"] = update_data["avatar"]

            col.document(uid).set(data_to_update, merge=True)
            
            # 2. Cập nhật allergies vào subcollection user_health_profile/profile
            if "allergies" in update_data and update_data["allergies"] is not None:
                allergies = update_data["allergies"]
                health_ref = col.document(uid).collection("user_health_profile").document("profile")
                health_doc = health_ref.get()
                
                if health_doc.exists:
                    health_ref.update({
                        "raw_selections.selected_allergies": allergies,
                        "updated_at": datetime.utcnow().isoformat() + "Z"
                    })
                else:
                    health_ref.set({
                        "user_id": uid,
                        "updated_at": datetime.utcnow().isoformat() + "Z",
                        "diet_mode": "strict",
                        "more_description": "",
                        "raw_selections": {
                            "selected_conditions": [],
                            "selected_allergies": allergies
                        },
                        "forbidden_tags": []
                    })
                    
            return True
        except Exception as e:
            print(f">>> UserManager Error (update_user_profile): {e}")
            return False

    async def create_chat_session(self, uid: str, title: str = "Cuộc trò chuyện mới") -> Optional[str]:
        """
        Tạo một session chat mới cho người dùng.
        """
        return await asyncio.to_thread(self._create_chat_session_sync, uid, title)

    def _create_chat_session_sync(self, uid: str, title: str) -> Optional[str]:
        try:
            col = self._get_collection()
            chat_ref = col.document(uid).collection("chat_history").document()
            chat_id = chat_ref.id
            
            now = datetime.now()
            chat_ref.set({
                "id": chat_id,
                "title": title,
                "created_at": now,
                "updated_at": now
            })
            
            # AI chào và mở đầu
            greeting = "Chào bạn! Tôi là trợ lý AI của BMI. Bạn muốn khám phá ẩm thực ở đâu hôm nay? Hãy cho tôi biết sở thích của bạn nhé!"
            self._add_message_sync(uid, chat_id, "assistant", greeting)
            
            return chat_id
        except Exception as e:
            print(f">>> UserManager Error (create_chat_session): {e}")
            return None

    async def add_message(self, uid: str, chat_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Thêm tin nhắn vào một session chat.
        """
        return await asyncio.to_thread(self._add_message_sync, uid, chat_id, role, content, metadata)

    def _add_message_sync(self, uid: str, chat_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        try:
            col = self._get_collection()
            chat_ref = col.document(uid).collection("chat_history").document(chat_id)
            
            now = datetime.now()
            msg_data = {
                "role": role,
                "content": content,
                "timestamp": now
            }
            if metadata:
                msg_data["metadata"] = metadata
                
            chat_ref.collection("messages").add(msg_data)
            
            # Cập nhật title nếu là tin nhắn đầu tiên của user
            if role == "user":
                doc = chat_ref.get()
                if doc.exists:
                    data = doc.to_dict()
                    # Kiểm tra nếu title vẫn là mặc định hoặc trống
                    current_title = data.get("title", "")
                    if current_title in ["Cuộc trò chuyện mới", "Cuộc trò chuyện...", None, ""]:
                        # Tạo title từ nội dung tin nhắn: lấy 5 từ đầu tiên hoặc tối đa 40 ký tự
                        words = content.split()
                        if words:
                            new_title = " ".join(words[:5])
                            if len(new_title) > 40:
                                new_title = new_title[:37] + "..."
                            elif len(words) > 5:
                                new_title += "..."
                            
                            chat_ref.update({"title": new_title})

            chat_ref.update({"updated_at": now})
            return True
        except Exception as e:
            print(f">>> UserManager Error (add_message): {e}")
            return False

    async def get_chat_history(self, uid: str) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các session chat của người dùng.
        """
        return await asyncio.to_thread(self._get_chat_history_sync, uid)

    def _get_chat_history_sync(self, uid: str) -> List[Dict[str, Any]]:
        try:
            col = self._get_collection()
            chats = col.document(uid).collection("chat_history").order_by("updated_at", direction=firestore.Query.DESCENDING).stream()
            
            result = []
            for chat in chats:
                data = chat.to_dict()
                # Chuyển đổi datetime sang string để JSON serializable
                if "created_at" in data:
                    data["created_at"] = data["created_at"].isoformat()
                if "updated_at" in data:
                    data["updated_at"] = data["updated_at"].isoformat()
                result.append(data)
            return result
        except Exception as e:
            print(f">>> UserManager Error (get_chat_history): {e}")
            return []

    async def get_chat_messages(self, uid: str, chat_id: str) -> List[Dict[str, Any]]:
        """
        Lấy tất cả tin nhắn trong một session chat.
        """
        return await asyncio.to_thread(self._get_chat_messages_sync, uid, chat_id)

    def _get_chat_messages_sync(self, uid: str, chat_id: str) -> List[Dict[str, Any]]:
        try:
            col = self._get_collection()
            msgs = col.document(uid).collection("chat_history").document(chat_id).collection("messages").order_by("timestamp").stream()
            
            result = []
            for msg in msgs:
                data = msg.to_dict()
                data["id"] = msg.id  # Thêm ID của document
                if "timestamp" in data:
                    data["timestamp"] = data["timestamp"].isoformat()
                result.append(data)
            return result
        except Exception as e:
            print(f">>> UserManager Error (get_chat_messages): {e}")
            return []

    async def delete_chat_session(self, uid: str, chat_id: str) -> bool:
        """
        Xóa một session chat của người dùng.
        """
        return await asyncio.to_thread(self._delete_chat_session_sync, uid, chat_id)

    def _delete_chat_session_sync(self, uid: str, chat_id: str) -> bool:
        try:
            col = self._get_collection()
            chat_ref = col.document(uid).collection("chat_history").document(chat_id)
            
            # Xóa các tin nhắn trước (subcollection)
            msgs = chat_ref.collection("messages").stream()
            for msg in msgs:
                msg.reference.delete()
                
            # Xóa document chat
            chat_ref.delete()
            return True
        except Exception as e:
            print(f">>> UserManager Error (delete_chat_session): {e}")
            return False