import json
import os

import firebase_admin
from firebase_admin import auth, credentials, firestore
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


# ============================================================
# 1. XÁC ĐỊNH ĐƯỜNG DẪN LOCAL & BIẾN MÔI TRƯỜNG
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

PROJECT_ROOT = os.path.dirname(
    os.path.dirname(CURRENT_DIR)
)

SERVICE_ACCOUNT_PATH = os.path.join(
    PROJECT_ROOT,
    "serviceAccountKey.json"
)

# Lấy dữ liệu từ biến môi trường trên Render (nếu có)
FIREBASE_ENV_DATA = os.environ.get("FIREBASE_SERVICE_ACCOUNT")


# ============================================================
# 2. DEBUG LOGS
# ============================================================

print("============================================================")
print("Firebase Configuration Check")
print("============================================================")
print(f">>> Current directory      : {CURRENT_DIR}")
print(f">>> Project root           : {PROJECT_ROOT}")
print(f">>> Service account path   : {SERVICE_ACCOUNT_PATH}")
print(f">>> File JSON exists       : {os.path.exists(SERVICE_ACCOUNT_PATH)}")
print(f">>> Env Variable set       : {bool(FIREBASE_ENV_DATA)}")
print("============================================================")


# ============================================================
# 3. KHỞI TẠO FIREBASE ADMIN SDK
# ============================================================

def _initialize_firebase():
    """
    Khởi tạo Firebase Admin SDK ưu tiên đọc biến Environment trước,
    sau đó mới tìm file serviceAccountKey.json ở máy Local.
    """

    # 1. Firebase đã khởi tạo từ trước
    if firebase_admin._apps:
        print(">>> Firebase Admin SDK is already initialized.")
        return True

    try:
        # 2. Ưu tiên đọc từ biến môi trường (Cho Render Cloud)
        if FIREBASE_ENV_DATA:
            cred_dict = json.loads(FIREBASE_ENV_DATA)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print(">>> Firebase Admin SDK initialized successfully via ENVIRONMENT VARIABLE.")
            return True

        # 3. Đọc từ file JSON (Cho Máy tính local)
        elif os.path.exists(SERVICE_ACCOUNT_PATH):
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred)
            print(">>> Firebase Admin SDK initialized successfully via LOCAL JSON FILE.")
            return True

        # 4. Cả 2 đều không tìm thấy
        else:
            print(">>> ERROR: Firebase Credentials NOT found in Environment Variable OR Local Path!")
            print(f">>> Checked path: {SERVICE_ACCOUNT_PATH}")
            return False

    except Exception as e:
        print(f">>> ERROR initializing Firebase Admin SDK: {e}")
        return False


# Khởi tạo Firebase ngay khi import module
_firebase_initialized = _initialize_firebase()


# ============================================================
# 4. FIRESTORE DATABASE
# ============================================================

_db = None


def get_db():
    """
    Trả về Firestore client.
    """
    global _db

    if _db is not None:
        return _db

    if not firebase_admin._apps:
        print(">>> WARNING: Firebase Admin SDK is not initialized. Cannot get Firestore client.")
        return None

    try:
        _db = firestore.client()
        print(">>> Firestore connected successfully.")
        return _db
    except Exception as e:
        print(f">>> ERROR connecting to Firestore: {e}")
        return None


# Khởi tạo Firestore ngay khi module load
db = get_db()


# ============================================================
# 5. FIREBASE AUTHENTICATION
# ============================================================

security = HTTPBearer()


async def get_current_user(
    res: HTTPAuthorizationCredentials = Security(security)
):
    """
    Xác thực Firebase ID Token từ Client Header.
    """
    token = res.credentials

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Xác thực thất bại hoặc Token hết hạn: {str(e)}"
        )


# ============================================================
# 6. ADMIN ROLE
# ============================================================

def check_admin_role(
    user: dict = Depends(get_current_user)
):
    """
    Kiểm tra user có quyền admin hay không.
    """
    if not user.get("admin"):
        raise HTTPException(
            status_code=403,
            detail="Bạn không có quyền Admin."
        )

    return user