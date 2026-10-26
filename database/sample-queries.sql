-- Các câu lệnh kiểm tra dữ liệu trong MySQL Workbench sau khi đã tạo bảng bằng Prisma Migrate.
USE azure_demo_tasks;
SHOW TABLES;
SELECT id, title, completed, createdAt FROM Task ORDER BY id DESC;
