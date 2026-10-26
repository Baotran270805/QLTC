# Hướng dẫn Azure từng chặng - Vì sao / Cách làm / Ý nghĩa

> Dành cho người thực hành trên Windows + PowerShell. Không dùng GitHub để chạy ứng dụng; GitHub chỉ là nguồn mã và CI/CD. Tất cả địa chỉ, username và resource name trong tài liệu là ví dụ, phải thay bằng giá trị Azure cấp cho bạn.

## Chặng A - Chuẩn bị tài khoản và kiểm soát chi phí

**Vì sao?** Muốn tạo các dịch vụ Cloud thì tài khoản Azure phải có subscription và quyền tạo resource. Một số dịch vụ có phí dù code không có người truy cập.

**Cách làm:**

1. Mở https://portal.azure.com, kiểm tra subscription đang Active.
2. Mở `Cost Management + Billing` để kiểm tra gói, hạn mức và dự báo chi phí; đặt budget/alert nếu có thể.
3. Chọn một vùng địa lý được tài khoản hỗ trợ, ưu tiên các tài nguyên cùng region để giảm độ trễ.

**Ý nghĩa:** Biết nơi ứng dụng được tạo và tránh phát sinh chi phí ngoài ý muốn. Không chọn SKU đắt chỉ để demo.

## Chặng B - Tạo Resource Group

**Vì sao?** Resource Group là nhóm tài nguyên cùng một mục đích. Xóa cả nhóm có thể dọn mọi dịch vụ sau lab.

**Cách làm:** Azure Portal → `Resource groups` → `Create` → chọn subscription → Name `rg-azure-mini-tasks` → Region → Review + create.

**Ý nghĩa:** MySQL, App Service, Static Web App và Managed Identity đều thuộc cùng một nhóm để quản lý.

## Chặng C - Azure Database for MySQL Flexible Server

**Vì sao?** `database/` chỉ chứa file cấu hình / SQL; website muốn lưu dữ liệu thật cần MySQL Server chạy trên Cloud.

**Cách làm:**

1. Azure Portal → Create a resource → tìm `Azure Database for MySQL flexible server` → Create.
2. Resource Group: `rg-azure-mini-tasks`; Server name duy nhất (ví dụ `mysql-lab-khoa-2026`, KHÔNG bắt buộc tên này).
3. MySQL version: 8.0 (nếu còn tùy chọn); Workload/Compute: Development/Burstable phù hợp, xem giá trước khi tạo. Không bật HA không cần thiết cho demo.
4. Đặt admin username và mật khẩu mạnh; lưu riêng trong password manager, không đưa lên GitHub.
5. Network: cho bài lab chọn `Public access (allowed IP addresses)` và thêm **current client IP** để máy tính có thể kết nối trong bước migration.
6. Để App Service kết nối bằng giải pháp demo đơn giản, có thể tạm bật `Allow public access from Azure services and resources within Azure to this server`. **CẢNH BÁO:** chọn này cho phép mọi Azure subscription thử kết nối đến cổng MySQL; không có nghĩa là chỉ App Service của bạn được phép. Dữ liệu thật nên chọn Private access / VNet và user giới hạn quyền.
7. Review + Create và chờ server được tạo.
8. Mở trang server → `Databases` → `Add` → tạo database `azure_demo_tasks`.

**Ý nghĩa:** Có MySQL thật đang chạy trong Azure. Dữ liệu của Azure và dữ liệu MySQL local là hai bộ dữ liệu **khác nhau**.

### Chặng C.1 - Tạo bảng bằng Prisma Migrate trên Azure MySQL

**Vì sao?** Database mới tạo chưa có bảng `Task`. `PrismaService` chưa truy vấn được nếu bảng chưa tồn tại.

**Cách làm:** Trong PowerShell (Windows), đang dùng repo đã giải nén và đã `npm install` trong backend:

```powershell
cd D:\azure-mini-tasks\backend
# Dùng username và mật khẩu THẬT của Azure MySQL (phần dưới chỉ là ví dụ)
# Nếu mật khẩu có ký tự URL đặc biệt, cần URL-encode trước khi gắn vào DATABASE_URL.
$env:DATABASE_URL = 'mysql://AZURE_USER:URL_ENCODED_PASSWORD@AZURE_SERVER.mysql.database.azure.com:3306/azure_demo_tasks?sslaccept=strict'
npx prisma migrate deploy
npx prisma migrate status
Remove-Item Env:DATABASE_URL
```

Prisma ORM v6 của sample hỗ trợ `sslaccept=strict`. Azure MySQL mặc định yêu cầu kết nối mã hóa TLS. Nếu gặp lỗi chứng chỉ, kiểm tra hostname, chứng chỉ/CA và hướng dẫn Microsoft/Prisma; không vô hiệu hóa kiểm tra TLS để sửa lỗi nhanh.

**Ý nghĩa:** Sau migration, Azure MySQL có bảng `Task` và bảng `_prisma_migrations` ghi nhận lịch sử migration đã áp dụng. Không cần sao chép cơ sở dữ liệu local chỉ để tạo bảng.

## Chặng D - Azure App Service cho NestJS

**Vì sao?** Cần máy chủ có Node.js để chạy tiến trình NestJS luôn sẵn sàng nhận API từ người dùng.

**Cách làm:**

1. Azure Portal → Create a resource → `Web App` / `App Service` → Create.
2. Resource Group: `rg-azure-mini-tasks`.
3. Web App name duy nhất, ví dụ `nest-tasks-api-abc123`. Lưu lại tên thật Azure đã cấp.
4. Publish: **Code**; Runtime stack: **Node.js 22 LTS**; Operating System: **Linux**; Region trùng MySQL nếu có.
5. App Service Plan: dùng Free F1 nếu vùng/hạn mức cho phép, hoặc chọn SKU có chi phí phù hợp sau khi kiểm tra giá. Không chọn Premium theo mặc định.
6. Trước mắt **chưa bật** continuous deployment ở wizard nếu đã dùng workflow OIDC đi kèm repo; tránh sinh workflow thứ hai cho cùng Backend.
7. Tạo app. Mở app → `Settings → Environment variables` / `Configuration` (tên mục có thể thay đổi theo Azure Portal) → thêm:

```text
DATABASE_URL = mysql://AZURE_USER:URL_ENCODED_PASSWORD@AZURE_SERVER.mysql.database.azure.com:3306/azure_demo_tasks?sslaccept=strict
NODE_ENV = production
FRONTEND_ORIGIN = http://localhost:3000
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

8. Vào Configuration/General Settings/Startup Command: `npm run start:prod` nếu Azure chưa tự phát hiện từ package.json.

**Ý nghĩa:** App Service biết cách build và chạy Backend, đồng thời được cấp thông tin kết nối MySQL bằng environment variables (không đưa mật khẩu vào source code).

## Chặng E - Tạo quyền cho GitHub Actions deploy Backend bằng OIDC

**Vì sao?** Khi workflow GitHub Actions chạy, GitHub phải chứng minh với Azure rằng workflow được phép triển khai đúng App Service. OIDC tránh phải lưu publish profile (mật khẩu) lâu dài.

**Cách làm:**

1. Azure Portal → tìm `Managed Identities` → `Create` → chọn **User assigned** → Resource Group `rg-azure-mini-tasks` → Name `id-gh-backend-deploy` → tạo.
2. Mở managed identity, lưu `Client ID`, `Tenant ID`. Lưu `Subscription ID` từ Azure Subscription.
3. Vào managed identity → `Federated credentials` → Add credential → `GitHub Actions deploying Azure resources` (hoặc giao diện tương đương).
4. Điền GitHub Organization/Owner = tài khoản GitHub thực tế; Repository = `azure-mini-tasks`; Entity type = **Branch**; Branch = **main**. Subject cần đúng `repo:OWNER/azure-mini-tasks:ref:refs/heads/main`.
5. Vào Backend App Service → `Access control (IAM)` → Add role assignment → chọn **Website Contributor** → assign cho managed identity `id-gh-backend-deploy` ở **scope App Service Backend** (không cần cấp cho cả subscription).
6. Trên GitHub repository → `Settings → Secrets and variables → Actions` → **Variables** → thêm:

```text
AZURE_WEBAPP_NAME = ten-app-service-backend (vi du nest-tasks-api-abc123)
```

7. Trong **Secrets**, thêm ba giá trị của identity / subscription:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
```

Dù các ID không phải password, lưu dạng GitHub secrets vẫn phù hợp với cấu hình workflow hiện tại.

**Ý nghĩa:** Workflow `.github/workflows/deploy-backend.yml` có thể đăng nhập Azure thông qua liên kết tin cậy OIDC mà không dùng thông tin đăng nhập cá nhân và không phải lưu publish profile.

> Nếu tài khoản Azure không có quyền tạo Managed Identity hoặc role assignment (IAM), bạn cần quyền từ quản trị subscription. Không nên tắt cơ chế xác thực bảo mật chỉ để làm cho workflow chạy.

## Chặng F - Chạy workflow Backend lần đầu

**Vì sao?** Cần kiểm tra rằng GitHub có thể build Backend, đóng gói đúng thư mục `backend/` và chuyển phiên bản đến App Service.

**Cách làm:**

1. Trên GitHub repo, vào `Actions`.
2. Chọn workflow `Deploy NestJS Backend to Azure`.
3. Bấm `Run workflow`, chọn nhánh `main`, bấm Run.
4. Mở job để xem các bước `Validate backend build`, `Sign in to Azure with OIDC`, `Deploy backend source to Azure App Service`.
5. Trở về App Service trên Azure → `Log stream` / Deployment logs, theo dõi quá trình Oryx install, Prisma generate, Nest build và start.
6. Mở hostname Backend thực tế từ Azure Overview, thêm `/api/health`.

**Kết quả mong đợi:**

```json
{"status":"ok","backend":"NestJS","database":"MySQL connected"}
```

**Ý nghĩa:** GitHub CI/CD có quyền triển khai đúng Backend, API chạy trên Azure, Prisma truy vấn MySQL Azure được.

## Chặng G - Tạo Azure Static Web Apps cho Frontend Next.js

**Vì sao?** Trong demo, Next.js chỉ cần client-side JavaScript gọi API, không cần SSR. Next.js có `output: 'export'` để xuất HTML/CSS/JS, phù hợp Azure Static Web Apps Free.

**Cách làm:**

1. Azure Portal → Create a resource → `Static Web Apps` → Create.
2. Resource Group `rg-azure-mini-tasks`, Plan `Free` nếu còn đủ điều kiện, đặt tên `web-tasks-frontend`.
3. Source = GitHub → Authorize → chọn Repo `azure-mini-tasks`, Branch `main`.
4. Trong Build Details, nếu có `Custom` preset chọn Custom; dùng:

```text
App location = frontend
Api location = (để trống)
Output location = out
```

5. Review + Create. Azure tạo workflow `.github/workflows/azure-static-web-apps-<id>.yml` ngay trên repo GitHub.
6. **Rà soát workflow vừa được Azure tạo:** Step `azure/static-web-apps-deploy` cần:

```yaml
with:
  app_location: "frontend"
  api_location: ""
  output_location: "out"
env:
  IS_STATIC_EXPORT: true
```

Chú ý `env:` phải nằm **cùng cấp với `with:` trong step**, không ở bên trong `with:`. Giữ nguyên `azure_static_web_apps_api_token`, `repo_token`, `action` và các phần khác Azure tạo.
7. Commit thay đổi cấu hình workflow và push nếu có chỉnh sửa. Xem GitHub → Actions → workflow của Azure Static Web Apps, đến khi thành công.
8. Azure Portal → Static Web App → Overview → mở URL `https://<something>.azurestaticapps.net`.

**Ý nghĩa:** Frontend được build và phục vụ công khai trên Azure. Mỗi commit thay đổi `frontend/` trên nhánh `main` sẽ kích hoạt workflow từ GitHub do Azure tạo.

## Chặng H - Liên kết Frontend với Backend

**Vì sao?** API của Azure Backend có URL khác so với trang Frontend, nên trình duyệt sẽ chặn lời gọi cross-origin nếu Backend không cho phép.

**Cách làm:**

1. Azure Backend App Service → Environment variables → sửa `FRONTEND_ORIGIN` thành:

```text
https://<STATIC_APP>.azurestaticapps.net,http://localhost:3000
```

2. Lưu/Apply, chấp nhận restart nếu Azure yêu cầu. Đảm bảo không có `/` cuối URL.
3. Mở Frontend URL. Trong ô **Kết nối Backend API**, điền hostname Backend App Service (không thêm `/api/tasks`):

```text
https://<BACKEND_APP>.azurewebsites.net
```

4. Bấm **Kết nối**. Ứng dụng nhớ địa chỉ này trong localStorage trình duyệt, không lưu trên GitHub.
5. Thêm công việc, tải lại trang, bật/tắt trạng thái rồi xóa thử công việc. Mở Backend `/api/tasks` để xem JSON.

**Ý nghĩa:** Đã có luồng Browser → Frontend Azure → NestJS Azure → MySQL Azure → kết quả trở lại trình duyệt.

## Chặng I - Thử thay đổi Frontend và push lại

**Vì sao?** Bạn muốn chứng minh mã nguồn local không cần sửa tay trên Azure. Khi push lên GitHub, CI/CD tự build và chuyển phiên bản mới.

**Cách làm:**

1. Mở `frontend/src/app/page.tsx`, tìm `const PAGE_VERSION = 'Phiên bản 1.0';` và sửa thành `Phiên bản 2.0`.
2. PowerShell tại repo root:

```powershell
cd D:\azure-mini-tasks
git status
git add frontend/src/app/page.tsx
git commit -m "Demo frontend auto deploy version 2"
git push origin main
```

3. GitHub → Actions → theo dõi workflow Static Web Apps do Azure tạo.
4. Khi xanh (Success), mở URL Frontend Azure, refresh và kiểm tra dòng `Phiên bản 2.0`.

**Ý nghĩa:** Local là nơi bạn chỉnh code, GitHub là nguồn và cơ chế trigger, Azure chạy bản build mới. Không cần sửa code trên Azure.

## Chặng J - Thử thay đổi Backend và push lại

**Vì sao?** Kiểm tra workflow Backend chỉ chạy khi file Backend thay đổi.

**Cách làm:**

1. Mở `backend/src/health.controller.ts`, sửa string `MySQL connected` thành `MySQL connected - v2`.
2. Commit, push:

```powershell
git add backend/src/health.controller.ts
git commit -m "Demo backend auto deploy v2"
git push origin main
```

3. GitHub → Actions → xem `Deploy NestJS Backend to Azure`.
4. Sau khi workflow thành công, mở `https://<BACKEND_APP>.azurewebsites.net/api/health`, phải thấy `MySQL connected - v2`.

**Ý nghĩa:** 2 quy trình CI/CD độc lập trên cùng một GitHub repo; database vẫn giữ nguyên dữ liệu.

## Chặng K - Domain, chi phí và xóa tài nguyên

**Domain:** Azure Static Web Apps cấp domain mặc định `*.azurestaticapps.net`; Backend App Service có domain `*.azurewebsites.net`. Đã đủ truy cập từ Internet. Không cần Vercel, không cần mua domain. Khi muốn tên miền riêng, trỏ domain tùy chỉnh đến Frontend (và `api.` đến Backend) qua DNS, tùy gói và thiết lập TLS.

**Chi phí:** MySQL Flexible Server và App Service có thể tính phí sau thời gian ưu đãi/tùy SKU và subscription. Static Web Apps có Free plan. Trước khi tạo kiểm tra trang Review + Create để biết giá.

**Dọn dẹp:** Azure Portal → Resource groups → `rg-azure-mini-tasks` → Delete resource group (sau khi chắc chắn không cần dữ liệu). Đây là thao tác phá hủy toàn bộ tài nguyên trong nhóm. GitHub repo và file local không bị xóa.

## Khi gặp lỗi thường gặp

| Triệu chứng | Kiểm tra |
|---|---|
| Frontend lỗi gọi API `Failed to fetch` | Địa chỉ Backend, CORS, HTTPS, Backend có chạy không |
| Backend 500/P1001 | DATABASE_URL, MySQL firewall, TLS, migration |
| `/api/health` lỗi | Log stream, env, MySQL server có hoạt động không |
| Workflow Backend skipped | GitHub variable `AZURE_WEBAPP_NAME` chưa khai báo |
| OIDC login thất bại | Owner/repo/branch subject, client/tenant/sub IDs, IAM Website Contributor |
| Workflow SWA build sai root | `app_location=frontend`, `output_location=out`, `IS_STATIC_EXPORT=true` |
| Deploy xong không đổi version | Kiểm tra branch main, workflow Success, refresh cache |
| GitHub repo có `.env` | Ngừng triển khai, xóa secret khỏi history và rotate mật khẩu; `.gitignore` không xóa lịch sử đã push |

Tài liệu bổ sung của Azure (tham khảo từ tài liệu chính thức):

- https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions
- https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect
- https://learn.microsoft.com/en-us/azure/app-service/configure-language-nodejs
- https://learn.microsoft.com/en-us/azure/static-web-apps/nextjs
- https://learn.microsoft.com/en-us/azure/mysql/flexible-server/quickstart-create-server-portal
- https://learn.microsoft.com/en-us/azure/mysql/flexible-server/how-to-connect-tls-ssl
- https://www.prisma.io/docs/orm/v6/overview/databases/mysql
