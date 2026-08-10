from fastapi import APIRouter, Depends, HTTPException
from Back_End.Core.auth_handler import get_current_user
from Back_End.Core.user_manager import UserManager
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
user_manager = UserManager()

class SyncUserRequest(BaseModel):
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None

@router.post("/sync")
async def sync_user(data: SyncUserRequest, current_user: dict = Depends(get_current_user)):
    """
    Đồng bộ thông tin người dùng từ Firebase vào Firestore thông qua UserManager.
    """
    uid = current_user.get("uid")
    
    role = await user_manager.sync_user(
        uid=uid,
        email=data.email or current_user.get("email"),
        name=data.name or current_user.get("name"),
        photo_url=data.photo_url or current_user.get("picture")
    )

    # 2. Kiểm tra nếu hàm trả về False (tức là bị rơi vào block 'except' ở manager)
    if role is False or not role:
        raise HTTPException(
            status_code=500, 
            detail="Không thể đồng bộ dữ liệu người dùng vào hệ thống."
        )

    # 3. Trả về cho Frontend hứng (vừa có uid, vừa có role luôn)
    return {
        "status": "success",
        "message": "Đồng bộ người dùng thành công",
        "uid": uid,
        "role": role  # <── Nhớ thêm dòng này để Next.js đọc được quyền nhé!
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Trả về thông tin người dùng hiện tại từ Token kết hợp với dữ liệu từ Firestore.
    """
    uid = current_user.get("uid")
    profile = await user_manager.get_user_profile(uid) if uid else None
    
    return {
        "status": "success",
        "user": current_user,
        "profile": profile
    }

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None
    allergies: Optional[list[str]] = None

@router.put("/update-profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    """
    Cập nhật thông tin tài khoản người dùng (tên, avatar, dị ứng).
    """
    uid = current_user.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="User ID không hợp lệ.")
    
    # Lấy các trường được gửi lên, bỏ qua các trường không có
    update_data = data.model_dump(exclude_unset=True) if hasattr(data, 'model_dump') else data.dict(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu để cập nhật.")
        
    success = await user_manager.update_user_profile(uid, update_data)
    
    if not success:
        raise HTTPException(
            status_code=500, 
            detail="Không thể cập nhật thông tin người dùng."
        )

    # Trả về dữ liệu mới sau khi cập nhật
    updated_profile = await user_manager.get_user_profile(uid)

    return {
        "status": "success",
        "message": "Cập nhật thông tin thành công",
        "data": updated_profile
    }