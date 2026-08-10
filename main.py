from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
from Back_End.API.routes import router as main_router
from Back_End.API.auth_routes import router as auth_router

app = FastAPI(
    title="Trợ lý du lịch thông minh",
    description="Lên lịch trình ăn uống",
    version="1.0"
)

# Cấu hình CORS để cho phép FrontEnd kết nối
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả các nguồn (dễ dàng khi deploy FE lên Vercel)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(main_router)
app.include_router(auth_router)

# Cổng phụ
@app.get("/")
async def root():
    return {"message": "Server đang chạy thành công! Hãy truy cập https://api.bmi-foodtour.io.vn/docs để test."}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
