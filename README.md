# Azure Mini Tasks - Học Local → GitHub → Azure → CI/CD

Một dự án học triển khai website có ba phần, tương tự một website thực tế:

```text
azure-mini-tasks/
├── frontend/           Next.js (TypeScript, static export)
├── backend/            NestJS + Prisma ORM (TypeScript)
├── database/           Docker Compose MySQL cho máy cá nhân
├── .github/workflows/  CI/CD Backend bằng GitHub Actions + Azure OIDC
├── docs/               Hướng dẫn triển khai Azure bằng tiếng Việt
└── README.md
```

## Trang web làm được gì?

- Giao diện tiếng Việt cho danh sách công việc.
- Nhập địa chỉ Backend API; lưu địa chỉ đó trong localStorage của trình duyệt.
- Gọi API `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id/toggle`, `DELETE /api/tasks/:id`.
- Backend đọc và ghi dữ liệu MySQL bằng Prisma.
- Hiển thị `Phiên bản 1.0` để sau này thay thành `Phiên bản 2.0` và quan sát tự động deploy qua GitHub Actions.

**Lưu ý:** Đây là dự án demo public CRUD, **không có đăng nhập và phân quyền**. Không lưu mật khẩu, dữ liệu cá nhân hoặc thông tin nhạy cảm. Không triển khai thành ứng dụng công khai có người dùng thật nếu chưa bổ sung xác thực, rate limiting và các biện pháp bảo mật khác.

## Phần mềm cần có trên Windows

- Node.js 22 LTS trở lên, có kèm npm.
- Git (Git for Windows).
- Visual Studio Code (tùy chọn).
- Docker Desktop (tùy chọn) để chạy MySQL local. Nếu bạn đã cài MySQL Server thì dùng MySQL hiện có.
- Tài khoản GitHub và Azure subscription hoạt động để thực hiện bước Cloud.

Kiểm tra:

```powershell
node -v
npm -v
git --version
docker --version  # chi khi da cai Docker Desktop
```

## CHẶNG 1 - Chạy dự án trên máy cá nhân

### 1.1. Giải nén

Giải nén ZIP thành `D:\azure-mini-tasks`. Tất cả lệnh bên dưới giả sử thư mục này.

### 1.2. Khởi chạy MySQL bằng Docker Desktop

Mở PowerShell số 1:

```powershell
cd D:\azure-mini-tasks\database
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

**Vì sao:** MySQL là một dịch vụ đang chạy, không phải chỉ là file `.sql`.
**Kết quả:** MySQL ở `localhost:3307`, database `azure_demo_tasks`. Thông tin ví dụ chỉ dành cho local.

Nếu đã có MySQL Server local, tự tạo database tên `azure_demo_tasks`, và điều chỉnh `backend/.env` theo user/password/port MySQL đang có; bỏ Docker ở bước này.

### 1.3. Cài và chạy Backend

PowerShell số 2:

```powershell
cd D:\azure-mini-tasks\backend
Copy-Item .env.example .env
npm install
npx prisma migrate deploy
npm run dev
```

**Vì sao cần migration?** `schema.prisma` chỉ mô tả các bảng; migration tạo bảng `Task` thật trong MySQL. Trong sample này migration đã được chuẩn bị sẵn.

**Kiểm tra:** Mở `http://localhost:4000/api/health` và `http://localhost:4000/api/tasks`.

Kỳ vọng:

```json
{"status":"ok","backend":"NestJS","database":"MySQL connected"}
```

Chú ý nếu MySQL chưa sẵn sàng (database container đang khởi động), thử lại `npx prisma migrate deploy` sau khi `docker compose ps` hiển thị healthy.

### 1.4. Cài và chạy Frontend

PowerShell số 3:

```powershell
cd D:\azure-mini-tasks\frontend
npm install
npm run dev
```

**Kiểm tra:** Mở `http://localhost:3000`, bấm **Kết nối** (API mặc định `http://localhost:4000`), thêm công việc, đánh dấu hoàn thành, tải lại trang.

Dữ liệu vẫn còn khi tải lại trang vì MySQL lưu trữ dữ liệu. Bạn có thể mở MySQL Workbench và chạy các truy vấn trong `database/sample-queries.sql`.

### 1.5. Thử build trước khi upload

```powershell
cd D:\azure-mini-tasks\backend
npm run build
cd D:\azure-mini-tasks\frontend
npm run build
```

Next.js ở đây dùng **static export** (`output: 'export'`). Sau `npm run build`, HTML/CSS/JS được tạo trong `frontend/out`. Không sử dụng `next start` với static export; Azure Static Web Apps sẽ phục vụ các file tĩnh này.

## CHẶNG 2 - Đưa mã nguồn lên GitHub

**Vì sao:** GitHub lưu lịch sử mã nguồn và cung cấp nguồn cho CI/CD. GitHub không phải nơi chạy NestJS và MySQL trong mô hình này.

1. Trên GitHub, tạo repository **private** hoặc **public**, tên `azure-mini-tasks`. Khi tạo, không chọn tạo README/.gitignore vì project đã có sẵn.
2. Mở PowerShell tại thư mục gốc và chạy:

```powershell
cd D:\azure-mini-tasks
git init
git add .
git commit -m "Initial full-stack Azure lab"
git branch -M main
git remote add origin https://github.com/USERNAME/azure-mini-tasks.git
git push -u origin main
```

Thay `USERNAME` bằng tên tài khoản GitHub. Git có thể yêu cầu bạn đăng nhập bằng trình duyệt.

**Quan trọng:** `.gitignore` loại bỏ `.env`, `node_modules`, `out`, `dist`. Hãy kiểm tra `git status`, `git ls-files` để bảo đảm file `.env` thật không được đưa lên GitHub. Hai file `package-lock.json` được tạo bởi `npm install` sẽ được commit và giúp khóa phiên bản thư viện.

**Vì sao GitHub Actions Backend chưa deploy ngay?** Workflow trong `.github/workflows/deploy-backend.yml` cố ý **skip** nếu chưa có biến GitHub `AZURE_WEBAPP_NAME`. Đây là bình thường vì Azure App Service chưa được tạo.

## CHẶNG 3 - Tạo tài nguyên Azure

Đọc toàn bộ `docs/HUONG_DAN_AZURE.md` trước khi tạo tài nguyên có phí. Nội dung dưới đây là tóm tắt.

**Kiến trúc mẫu:**

```text
Browser
   | HTTPS
Azure Static Web Apps (Next.js static export)
   | HTTPS API
Azure App Service Linux (NestJS / Prisma)
   | TLS to port 3306
Azure Database for MySQL Flexible Server
```

- 1 Resource Group, ví dụ `rg-azure-mini-tasks`.
- 1 MySQL Flexible Server và database `azure_demo_tasks`.
- 1 App Service Linux cho Backend (Node.js 22 LTS, startup `npm run start:prod`).
- 1 Azure Static Web App cho Frontend (Free plan, Github source).
- 1 User-assigned managed identity liên kết GitHub Actions và Backend App Service qua OIDC.

App Service cần các setting sau:

```text
DATABASE_URL=mysql://<USER>:<URL_ENCODED_PASSWORD>@<SERVER>.mysql.database.azure.com:3306/azure_demo_tasks?sslaccept=strict
FRONTEND_ORIGIN=https://<YOUR_STATIC_APP>.azurestaticapps.net,http://localhost:3000
NODE_ENV=production
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

**Không ghi mật khẩu thật vào README hoặc GitHub.** Khi mật khẩu có `@`, `#`, `%`, `?`, v.v., phải URL-encode trong `DATABASE_URL`.

Chạy `npx prisma migrate deploy` từ máy local (kết nối đến Azure Database bằng temporary PowerShell environment variable) để tạo bảng Cloud. Cần cho phép IP công khai của máy tính trong Azure MySQL firewall. Lúc deploy App Service, cấu hình luồng network từ Azure tới Azure MySQL.

## CHẶNG 4 - GitHub Actions: Backend

Workflow `deploy-backend.yml` đã được tạo trong repository. Không cần tải publish profile chứa mật khẩu.

Cấu hình một user-assigned managed identity trên Azure, Federated Credential GitHub branch `main`, cấp role **Website Contributor** trên Backend App Service.

Ở GitHub repository → Settings → Secrets and variables → Actions:

- Repository **variable**: `AZURE_WEBAPP_NAME` = tên App Service Backend (không có `https://`).
- Repository **secrets**: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (giá trị từ identity và Azure subscription).

Sau đó GitHub → Actions → `Deploy NestJS Backend to Azure` → **Run workflow**.

Workflow hoạt động theo chuỗi: lấy code → `npm install` và `npm run build` trong `backend/` → đóng gói source riêng cho Backend → OIDC login vào Azure → deploy vào App Service → Azure Oryx cài deps và build lại nhờ `SCM_DO_BUILD_DURING_DEPLOYMENT=true`.

Mở Backend App Service `https://<your-backend-hostname>/api/health` để kiểm tra.

## CHẶNG 5 - GitHub Actions: Frontend

Tạo Azure Static Web Apps trong Portal, chọn **Source: GitHub**, repo `azure-mini-tasks`, nhánh `main`.

Cấu hình build (dùng Custom preset nếu cần):

```text
App location: frontend
Api location: (để trống)
Output location: out
```

Azure tự tạo thêm 1 file `.github/workflows/azure-static-web-apps-....yml` vào repository. Kiểm tra và chỉnh step `azure/static-web-apps-deploy` sao cho có đúng:

```yaml
with:
  app_location: "frontend"
  api_location: ""
  output_location: "out"
env:
  IS_STATIC_EXPORT: true
```

Đây chỉ là phần cấu hình của **step**, không phải một file workflow đầy đủ. Giữ nguyên secrets/token và các cấu hình khác do Azure tạo. GitHub Actions sẽ tạo `frontend/out/` và đăng website.

Sau khi website có URL `<name>.azurestaticapps.net`, cập nhật setting `FRONTEND_ORIGIN` trong Backend App Service. Quay lại trang Frontend, điền URL Backend App Service và bấm **Kết nối**.

## CHẶNG 6 - Kiểm thử end-to-end

1. Mở `https://<static-app>.azurestaticapps.net`.
2. Điền API là `https://<backend-app>.azurewebsites.net` (đúng hostname từ Azure Overview).
3. Bấm **Kết nối** và thêm một công việc tên `Deploy Azure thành công`.
4. Refresh trình duyệt: công việc vẫn còn, chứng minh thao tác đã ghi vào MySQL Cloud.
5. Dùng `https://<backend-app>.azurewebsites.net/api/health` xác nhận DB Cloud có thể truy vấn.

## CHẶNG 7 - Sửa code local rồi git push, quan sát Azure thay đổi

Mở `frontend/src/app/page.tsx` và tìm:

```ts
const PAGE_VERSION = 'Phiên bản 1.0';
```

Đổi thành:

```ts
const PAGE_VERSION = 'Phiên bản 2.0';
```

Sau đó:

```powershell
cd D:\azure-mini-tasks
git add frontend/src/app/page.tsx
git commit -m "Update frontend version to 2.0"
git push origin main
```

Vào tab **Actions** trên GitHub: xem workflow của Azure Static Web Apps chạy. Khi trạng thái thành công, refresh website Azure và thấy `Phiên bản 2.0`.

**Tại sao Backend không cần deploy lại?** Workflow Backend có `paths: ['backend/**', ...]`; thay đổi chỉ ở `frontend/` không kích hoạt Backend.

**Thử thêm lần nữa với Backend:** Đổi chuỗi `MySQL connected` trong `backend/src/health.controller.ts` thành `MySQL connected - version 2` và push. Khi workflow Backend chạy xong, tải lại URL `/api/health` để kiểm tra.

## CHẶNG 8 - Xử lý lỗi và dọn Cloud

- Không truy cập được API: thử `/api/health`, xem Log stream của App Service.
- Prisma P1001: kiểm tra DNS MySQL, firewall, TLS, tài khoản và `DATABASE_URL`.
- Trình duyệt báo CORS: thêm chính xác URL Azure Static Web Apps vào `FRONTEND_ORIGIN` (không có dấu `/` cuối cùng).
- `npm install`/`build` lỗi: kiểm tra Node version 22 LTS, mạng, `package-lock.json`, workflow Action logs.
- Azure Static Web Apps build lỗi: kiểm tra `app_location=frontend`, `output_location=out`, `IS_STATIC_EXPORT=true`.
- Workflow Backend skipped: kiểm tra GitHub variable `AZURE_WEBAPP_NAME`.
- Workflow Backend OIDC lỗi: kiểm tra Federated Credential của branch `main`, 3 GitHub secrets và quyền `Website Contributor`.

**Chi phí:** Azure Database for MySQL và App Service có thể phát sinh phí. Tài khoản Azure Free đủ điều kiện có ưu đãi MySQL trong 12 tháng theo hạn mức, nhưng không phải mọi tài khoản đều được miễn phí. Kiểm tra Azure Cost Management trước khi tạo. Khi xong lab, xóa **Resource Group** sau khi đã sao lưu dữ liệu cần giữ để ngăn phí tiếp tục.

## Các nguồn chính thức

- Azure App Service CI/CD: https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions
- GitHub OIDC: https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect
- Azure App Service Node.js: https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs
- Azure Static Web Apps + Next.js: https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs
- Azure MySQL Flexible Server: https://learn.microsoft.com/en-us/azure/mysql/flexible-server/quickstart-create-server-portal
- Prisma ORM 6 MySQL connector: https://www.prisma.io/docs/orm/v6/overview/databases/mysql

> **Phạm vi kiểm tra của bộ mã nguồn:** Đã kiểm tra cấu trúc tệp, JSON, YAML và lệnh trích dẫn. Không thể chạy npm install / build trong môi trường tạo file do không truy cập được npm registry. Hãy thực hiện bước `npm install` và `npm run build` trên máy của bạn, gửi log nếu có vấn đề về phiên bản.
