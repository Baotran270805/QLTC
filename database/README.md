# Database - MySQL

Thư mục này chứa cách khởi chạy MySQL ở máy cá nhân (Docker Compose) và một số câu truy vấn kiểm tra.

**Nguồn cấu trúc bảng chính** là `backend/prisma/schema.prisma` và migration trong `backend/prisma/migrations`.

Không nhập thủ công `sample-queries.sql` để tạo bảng; tệp đó chỉ để kiểm tra dữ liệu.

## Chạy MySQL trên máy Windows có Docker Desktop

```powershell
cd D:\azure-mini-tasks\database
Copy-Item .env.example .env
docker compose up -d
```

Docker expose localhost cổng **3307** để không đụng MySQL cổng 3306 đang có trên máy.

Nếu đã có MySQL local thì bỏ Docker, tự tạo database `azure_demo_tasks` và chỉnh `backend/.env` cho đúng host, tài khoản và port.

Dữ liệu được lưu trong Docker volume `mysql_lab_data`, **không xóa volume** nếu muốn giữ dữ liệu local.
