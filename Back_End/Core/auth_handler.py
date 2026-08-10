# from fastapi import HTTPException, Security, Depends
# from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
# import firebase_admin
# from firebase_admin import auth, credentials, firestore
# import os

# # Đường dẫn tuyệt đối tới tệp Service Account Key
# # __file__ là path tới file hiện tại (Back_End/Core/auth_handler.py)
# current_dir = os.path.dirname(os.path.abspath(__file__))
# # Quay lại 1 cấp vào Back_End, sau đó vào Database
# json_path = os.path.join(os.path.dirname(current_dir), "Database", "serviceAccountKey.json")

# # Khởi tạo Firebase Admin
# if not firebase_admin._apps:
#     try:
#         if os.path.exists(json_path):
#             cred = credentials.Certificate(json_path)
#             firebase_admin.initialize_app(cred)
#             print(">>> Firebase Admin SDK initialized successfully.")
#         else:
#             print(f">>> WARNING: Credentials file not found at {json_path}")
#     except Exception as e:
#         print(f">>> ERROR initializing Firebase Admin: {e}")

# # Khởi tạo Firestore client
# def get_db():
#     global db
#     if 'db' not in globals() or db is None:
#         try:
#             if firebase_admin._apps:
#                 from firebase_admin import firestore
#                 globals()['db'] = firestore.client()
#                 print(">>> Firestore connected successfully.")
#             else:
#                 print(">>> WARNING: Firebase Admin not initialized, cannot get Firestore client.")
#                 return None
#         except Exception as e:
#             print(f">>> ERROR connecting to Firestore: {e}")
#             return None
#     return globals()['db']

# # Initialize it immediately if possible
# db = get_db()

# security = HTTPBearer()

# async def get_current_user(res: HTTPAuthorizationCredentials = Security(security)):
#     """
#     Dependency để lấy thông tin người dùng từ Firebase ID Token.
#     Sử dụng: route_func(user = Depends(get_current_user))
#     """
#     token = res.credentials
#     try:
#         decoded_token = auth.verify_id_token(token)
#         return decoded_token
#     except Exception as e:
#         raise HTTPException(
#             status_code=401,
#             detail=f"Xác thực thất bại hoặc Token hết hạn: {str(e)}"
#         )

# def check_admin_role(user: dict = Depends(get_current_user)):
#     """Kiểm tra nếu user có quyền admin"""
#     # Trong Firebase, bạn có thể dùng Custom Claims hoặc lưu role trong Firestore
#     # Giả sử chúng ta dùng Custom Claims: user.get("admin") == True
#     # Hoặc đơn giản là check email trong danh sách admin
#     if not user.get("admin"):
#          raise HTTPException(status_code=403, detail="Bạn không có quyền Admin.")
#     return user
import os

import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


# ============================================================
# CẤU TRÚC PROJECT
# ============================================================
#
# PROJECT_ROOT/
# ├── serviceAccountKey.json
# ├── Back_End/
# │   ├── Core/
# │   │   └── auth_handler.py
# │   └── ...
#
# ============================================================


# ============================================================
# 1. XÁC ĐỊNH ĐƯỜNG DẪN
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(CURRENT_DIR)
)

SERVICE_ACCOUNT_PATH = os.path.join(
    PROJECT_ROOT,
    "serviceAccountKey.json"
)


# ============================================================
# 2. DEBUG
# ============================================================

print("============================================================")
print("Firebase Configuration")
print("============================================================")
print(f">>> Current directory      : {CURRENT_DIR}")
print(f">>> Project root           : {PROJECT_ROOT}")
print(f">>> Service account path   : {SERVICE_ACCOUNT_PATH}")
print(
    f">>> Service account exists : "
    f"{os.path.exists(SERVICE_ACCOUNT_PATH)}"
)
print("============================================================")


# ============================================================
# 3. KHỞI TẠO FIREBASE ADMIN SDK
# ============================================================

def _initialize_firebase():
    """
    Khởi tạo Firebase Admin SDK.
    """

    # Firebase đã được khởi tạo trước đó
    if firebase_admin._apps:
        print(
            ">>> Firebase Admin SDK is already initialized."
        )
        return True

    # Không tìm thấy service account
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(
            ">>> ERROR: Firebase service account file "
            "not found!"
        )
        print(
            f">>> Expected path: {SERVICE_ACCOUNT_PATH}"
        )
        return False

    try:
        cred = credentials.Certificate(
            SERVICE_ACCOUNT_PATH
        )

        firebase_admin.initialize_app(cred)

        print(
            ">>> Firebase Admin SDK initialized successfully."
        )

        return True

    except Exception as e:
        print(
            f">>> ERROR initializing Firebase Admin SDK: {e}"
        )

        return False


# Khởi tạo Firebase khi import module
_firebase_initialized = _initialize_firebase()


# ============================================================
# 4. FIRESTORE DATABASE
# ============================================================

_db = None


def get_db():
    """
    Trả về Firestore client.

    Nếu Firebase chưa được khởi tạo hoặc có lỗi
    thì trả về None.
    """

    global _db

    # Đã có client -> sử dụng lại
    if _db is not None:
        return _db

    # Firebase chưa được initialize
    if not firebase_admin._apps:
        print(
            ">>> WARNING: Firebase Admin SDK is not initialized."
        )

        return None

    try:
        _db = firestore.client()

        print(
            ">>> Firestore connected successfully."
        )

        return _db

    except Exception as e:
        print(
            f">>> ERROR connecting to Firestore: {e}"
        )

        return None


# Khởi tạo Firestore ngay khi module được load
db = get_db()


# ============================================================
# 5. FIREBASE AUTHENTICATION
# ============================================================

security = HTTPBearer()


async def get_current_user(
    res: HTTPAuthorizationCredentials = Security(security)
):
    """
    Xác thực Firebase ID Token.

    Client gửi:

        Authorization: Bearer <FIREBASE_ID_TOKEN>

    Trả về decoded Firebase token.
    """

    token = res.credentials

    try:
        decoded_token = auth.verify_id_token(token)

        return decoded_token

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=(
                "Xác thực thất bại hoặc Token hết hạn: "
                f"{str(e)}"
            )
        )


# ============================================================
# 6. ADMIN ROLE
# ============================================================

def check_admin_role(
    user: dict = Depends(get_current_user)
):
    """
    Kiểm tra user có quyền admin hay không.

    Firebase Custom Claims cần có:

        {
            "admin": true
        }
    """

    if not user.get("admin"):
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền Admin."
        )

    return user