# Routing — Frontend

Frontend là **multi-page HTML** (không SPA router). Điều hướng qua href, `window.location`, hash URL và sidebar động.

## Build & deploy

```
frontend/src/  ──npm run build──►  frontend/dist/  ──nginx──►  browser
```

Script build: `scripts/build.mjs` — copy toàn bộ `src/` sang `dist/`, thêm alias `dist/i18n/` ← `src/locales/`.

## Nginx (Docker)

File `frontend/nginx.conf`:

| Location | Hành vi |
|----------|---------|
| `/api/` | Proxy → `backend:8080` |
| `/swagger-ui/`, `/v3/` | Proxy Swagger |
| `/` | `try_files` → file tĩnh hoặc fallback `index.html` |
| `*.json` | `Cache-Control: no-cache` (locale bundles) |

Khi chạy Docker frontend `:3000`, gọi API cùng origin `/api/...` — `FmApi` tự nhận port 3000 và dùng relative host.

## Cấu trúc trang

| Thư mục | Trang |
|---------|-------|
| `src/index.html` | Trang chủ |
| `src/pages/auth/` | login, register, not-found, unauthorized |
| `src/pages/dashboard/` | departments, assets, categories, statistics, audit, requests, room-* … |
| `src/pages/profile/` | users, contact, rbac-roles |
| `src/pages/student/` | request-create, request-sent, request-drafts |

## Sidebar — map path DB → HTML

File: `src/assets/js/shared/sidebar.js` — `PATH_TO_PAGE`

| Path API menu (`VoMenu.path`) | File HTML |
|-------------------------------|-----------|
| `/` | `index.html` |
| `/profile/users` | `pages/profile/users.html` |
| `/profile/rbac-roles` | `pages/profile/rbac-roles.html` |
| `/dashboard/departments` | `pages/dashboard/departments.html` |
| `/dashboard/room-map` | `pages/dashboard/room-map.html` |
| `/dashboard/categories` | `pages/dashboard/categories.html` |
| `/dashboard/assets` | `pages/dashboard/assets.html` |
| `/dashboard/statistics` | `pages/dashboard/statistics.html` |
| `/dashboard/audit-periodic.html` | `pages/dashboard/audit-periodic.html` |
| `/dashboard/requests` | `pages/dashboard/requests.html` |
| `/dashboard/work/pending` | `requests.html?view=pending` |
| `/dashboard/work/incomplete` | `requests.html?view=incomplete` |
| `/dashboard/work/mine` | `requests.html?view=mine` |
| `/profile/contact` | `pages/profile/contact.html` |
| `/student/request-create` | `pages/student/request-create.html` |
| `/student/request-sent` | `pages/student/request-sent.html` |
| `/student/request-drafts` | `pages/student/request-drafts.html` |

Path không có trong map → `pages/auth/not-found.html`.

Menu lấy từ `GET /api/permission/getMenuList` sau đăng nhập (xem [rbac.md](./rbac.md)).

## Hash routing (cùng file HTML, tab khác nhau)

File `src/assets/js/shared/menu-links.js` gán hash cho submenu:

### Danh mục (`categories.html`)

| Nhãn menu | Hash |
|-----------|------|
| Quản lý danh mục | (rỗng) → view `default` / ASSET |
| Nguồn kinh phí | `#nguon-kinh-phi` → FUND_SOURCE |

Hash không hợp lệ → redirect về `default`.

### Tài sản (`assets.html`)

| Nhãn menu | Hash |
|-----------|------|
| Quản lý tài sản | (rỗng) |
| Đánh giá tài sản | `#danh-gia-tai-san` |
| Đánh giá lại tài sản | `#danh-gia-lai-tai-san` |

Logic: `main.js` → `applyAssetMode()`.

## Query string

| Trang | Param | Ý nghĩa |
|-------|-------|---------|
| `departments.html` | `?building=E1` | Lọc phòng theo tòa |
| `room-detail.html` | `?room=...&date=...&shift=...` | Chi tiết phòng + ngữ cảnh TKB |
| `requests.html` | `?view=pending\|incomplete\|mine` | Tab công việc |

`sessionStorage.departmentsActiveBuilding` — nhớ tòa đang chọn khi chuyển trang.

## Menu tòa nhà

`menu-links.js` → `fixBuildingMenuLinks()`:

- Đọc `data-page-name` (vd. `page_building_e1`) hoặc tiêu đề menu
- Gán href: `departments.html?building=E1`

Mã tòa: `E1`–`E10`, `EB8`, `C1`–`C3`, `GDDN`, `CANTIN`.

## Bảo vệ trang (`guard.js`)

HTML protected đặt trên `<body>`:

```html
<body data-required-roles="ADMIN,MANAGER,STAFF">
```

| Trường hợp | Hành vi |
|------------|---------|
| Chưa đăng nhập | Redirect → `login.html` |
| Sai role | Redirect → `unauthorized.html` |
| Hợp lệ | Hiển thị `#currentUserName` |

Script load order tiêu biểu (dashboard):

```
auth.js → menu-store.js → guard.js → sidebar.js → i18n-manager.js → … → api-client.js → main.js
```

## JS theo trang

| Trang | Script chính |
|-------|--------------|
| `index.html` | `home-page.js` |
| `login.html` | `login.js` |
| `register.html` | `register.js`, `register-bug-captcha.js` |
| `users.html` | `users-page.js` |
| `rbac-roles.html` | `rbac-api.js`, `rbac-roles-page.js` |
| `requests.html` | `requests-page.js` |
| `audit-periodic.html` | `audit-periodic-page.js` |
| `room-map.html` | `room-map-page.js` |
| `contact.html` | `contact-list.js` |
| Nhiều trang dashboard | `main.js` (departments, categories, assets, room-edit, …) |

## Phát hiện trang trong `main.js`

```javascript
function duongDanLaTrang(tenFileHtml) {
  // Khớp pathname có/không có đuôi .html
}
if (duongDanLaTrang("assets.html")) { /* ... */ }
```

Mỗi block `if (duongDanLaTrang(...))` chỉ chạy trên trang tương ứng.
