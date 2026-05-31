# API Contract — Frontend ↔ Backend

Tài liệu khớp với controller Java hiện tại (`backend/src/main/java/com/facilitymanager/controller/`).

## Quy ước chung

| Quy tắc | Chi tiết |
|---------|----------|
| JSON | `camelCase` cho field request/response |
| Auth header | `Authorization: Bearer <uuid>` (opaque token Redis), do `AppAuth` / `FmApi` gắn tự động |
| Upload file | `multipart/form-data` (user avatar) |
| Khóa ngoại | `roomId`, `userId`, `assetId`, `categoryId` — dùng **id số** DB, không phải mã hiển thị |
| Phản hồi bọc | Một số API RBAC/menu trả `KetQuaApi`: `{ "success": true, "result": ... }` |
| Lỗi | HTTP 4xx/5xx; body có thể có `thongDiep` (tiếng Việt) hoặc `message` |

### Interceptor token (`BoLocPhienToken`)

Bắt buộc Bearer token hợp lệ cho:

- `/api/admin/**` (chỉ role `ADMIN`)
- `/api/permission/getMenuList`
- `/api/requests/**`
- `/api/audits/**`

Các endpoint khác (`/api/rooms`, `/api/assets`, `/api/users`, `/api/categories`, …) **không** qua interceptor nhưng frontend vẫn nên gửi token khi đã đăng nhập.

### Endpoint công khai (không cần token)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/common/captcha/init` | Lấy `captchaId` |
| GET | `/api/common/captcha/draw/{captchaId}` | Ảnh captcha |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/regist` | Đăng ký |
| POST | `/api/auth/logout` | Đăng xuất |

---

## Auth

### `POST /api/auth/login`

- **Content-Type:** `application/x-www-form-urlencoded`
- **Body:**

| Param | Bắt buộc | Mô tả |
|-------|----------|-------|
| `username` | ✓ | Tên đăng nhập |
| `password` | ✓ | Mật khẩu |
| `code` | ✓ | Mã captcha người dùng nhập |
| `captchaId` | ✓ | UUID từ `/api/common/captcha/init` |
| `saveLogin` | | `"true"` nếu ghi nhớ đăng nhập |

- **Response:** `PhanHoiDangNhap` (controller: `DieuKhienXacThuc`)

```json
{
  "accessToken": "uuid-token",
  "tokenType": "Bearer",
  "username": "adminutc2",
  "fullName": "...",
  "userId": 1,
  "roleIds": [1],
  "permissionIds": [1, 2],
  "roleCodes": ["ADMIN"],
  "permissionTitles": ["Thêm", "Sửa", ...]
}
```

Frontend lưu vào `localStorage`: `app.session`, `app.currentUser` (`AppAuth`).

### `POST /api/auth/regist`

- **Content-Type:** `application/x-www-form-urlencoded`
- **Params:** `username`, `password`, `nickname`, `code`, `captchaId`
- **Response:** `KetQuaApi<Void>`

### `POST /api/auth/logout`

- Header `Authorization: Bearer ...` (tùy chọn)
- **Response:** `KetQuaApi<Void>`

---

## Captcha

| Method | Path |
|--------|------|
| GET | `/api/common/captcha/init` → `{ captchaId }` |
| GET | `/api/common/captcha/draw/{captchaId}` → image |

---

## Menu & RBAC (xem thêm [rbac.md](./rbac.md))

| Method | Path | Response |
|--------|------|----------|
| GET | `/api/permission/getMenuList` | `KetQuaApi<List<MenuVo>>` — menu theo role đăng nhập |
| GET | `/api/admin/roles` | `List<VaiTroPhanHoiDto>` |
| GET | `/api/admin/menu-tree` | `KetQuaApi<List<MenuVo>>` — cây menu đầy đủ (admin) |
| POST | `/api/admin/roles` | body `YeuCauTaoVaiTro` |
| PUT | `/api/admin/roles/{id}` | body `YeuCauCapNhatVaiTro` |
| DELETE | `/api/admin/roles/{id}` | |

---

## User — `/api/users`

| Method | Path | Ghi chú |
|--------|------|---------|
| GET | `/api/users` | Danh sách |
| GET | `/api/users/{userId}` | Chi tiết |
| POST | `/api/users` | JSON hoặc `multipart/form-data` |
| PUT | `/api/users/{userId}` | JSON hoặc multipart |
| PATCH | `/api/users/{userId}` | Cập nhật một phần |
| DELETE | `/api/users/{userId}` | |

**DTO:** `NguoiDungPhanHoiDto` (entity: `NguoiDung`) — `id`, `username`, `fullName`, `address`, `phoneNumber`, `role`, `status`, `avatarUrl`

**Mapping form → JSON (users-add / users-page):**

| Input `name` / id | JSON field |
|-------------------|------------|
| `username` | `username` |
| `password` | `password` (tạo mới / đổi MK) |
| `fullName` | `fullName` |
| `address` | `address` |
| `phoneNumber` | `phoneNumber` |
| `role` | `role` (`ADMIN`, `MANAGER`, `STAFF`, `STUDENT`) |
| `avatar` (file) | `avatar` (multipart) |

---

## Room — `/api/rooms`

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/rooms` | Danh sách (lọc TKB) |
| GET | `/api/rooms/{roomId}` | Chi tiết theo id |
| GET | `/api/rooms/{roomId}/asset-summary` | Tổng hợp tài sản trong phòng |
| GET | `/api/rooms/code/{roomCode}/schedule` | Lịch học theo mã phòng |
| GET | `/api/rooms/code/{roomCode}/current-class` | Lớp đang học tại thời điểm `at` |
| POST | `/api/rooms` | Tạo phòng |
| PUT | `/api/rooms/{roomId}` | Cập nhật |
| PATCH | `/api/rooms/{roomId}` | Cập nhật một phần |
| DELETE | `/api/rooms/{roomId}` | Xóa |

**Query `GET /api/rooms`:**

| Param | Mô tả |
|-------|-------|
| `building` / `buildingCode` | Mã tòa (`E1`, `GDDN`, …) |
| `semester` | Học kỳ, vd. `HK1-2025-2026` |
| `date` | ISO date `YYYY-MM-DD` |
| `shift` | Ca học (`morning`, `afternoon`, …) |
| `week` | Tuần (tùy chọn) |

**Response:** `PhongPhanHoiDto` — `id`, `roomCode`, `buildingCode`, `floor`, `classUsing`, `capacity`, `status`, `teacherName`, `classStudying`, `deskCount`, `chairCount`, `speakerCount`, `airConditionerCount`, `microphoneCount`, `glassDoorStatus`, `ceilingFanCount`, `curtainStatus`

**Mapping form phòng (room-add / room-edit → `main.js`):**

| Form field | JSON key |
|------------|----------|
| `roomTargetBuilding` | `buildingCode` |
| `roomCodeInput` | `roomCode` |
| `roomFloorInput` | `floor` |
| `roomClassUsingInput` | `classUsing` |
| `roomCapacityInput` | `capacity` |
| `roomStatus` | `status` |
| `roomTeacherInput` | `teacherName` |
| `roomClassInput` | `classStudying` |
| `roomDesksInput` | `deskCount` |
| `roomChairsInput` | `chairCount` |
| `roomSpeakersInput` | `speakerCount` |
| `roomAirConditionerInput` | `airConditionerCount` |
| `roomMicrophoneInput` | `microphoneCount` |
| `roomGlassDoor` | `glassDoorStatus` |
| `roomCeilingFanInput` | `ceilingFanCount` |
| `roomCurtain` | `curtainStatus` |

---

## Category — `/api/categories`

| Method | Path |
|--------|------|
| GET | `/api/categories?type=ASSET` hoặc `FUND_SOURCE` |
| GET | `/api/categories/{id}` |
| POST | `/api/categories` |
| PUT | `/api/categories/{id}` |
| DELETE | `/api/categories/{id}` |

**DTO:** `DanhMucDto` — chấp nhận alias `code`/`categoryCode`, `name`/`categoryName`, `type`/`categoryType`

| Form (categories.html) | JSON |
|------------------------|------|
| `categoryCodeInput` | `code` |
| `categoryNameInput` | `name` |
| (logic view) | `type`: `ASSET` hoặc `FUND_SOURCE` |

**Giá trị `type` thường dùng:** `ASSET`, `FUND_SOURCE`

---

## Asset — `/api/assets`

| Method | Path |
|--------|------|
| GET | `/api/assets?status=IN_USE` |
| GET | `/api/assets/{id}` |
| POST | `/api/assets` |
| PUT | `/api/assets/{id}` |
| DELETE | `/api/assets/{id}` |
| POST | `/api/assets/{id}/transfer` | Điều chuyển |

**DTO:** `TaiSanDto`

| Form id (`main.js` fieldMap) | JSON field |
|------------------------------|------------|
| `assetCardInput` | `cardNumber` |
| `assetNameInput` | `assetName` |
| `assetProviderInput` | `provider` |
| `assetCountryInput` | `country` |
| `assetRoomInput` | `roomId` (Long) |
| (derived) | `classroom` — mã phòng từ option select |
| `assetTypeInput` | `assetType` |
| `assetCategoryInput` | `itemCategory` (mã danh mục ASSET) |
| `assetManufactureYearInput` | `manufactureYear` |
| `assetUnitPriceInput` | `unitPrice` |
| `assetQuantityInput` | `quantity` |
| `assetOriginalPriceInput` | `originalPrice` |
| `assetFundInput` | `fundSource` (mã FUND_SOURCE) |
| `assetUsageTimeInput` | `usageTime` |
| `assetPurchaseDateInput` | `purchaseDate` (`YYYY-MM-DD`) |
| `assetUsageYearInput` | `usageYear` |
| `assetStatusInput` | `status` (`IN_USE`, `MAINTENANCE`, …) |
| `assetNoteInput` | `note` |

**Response bổ sung:** `roomCode`, `building`, `buildingName`, `buyer`

### Điều chuyển `POST /api/assets/{id}/transfer`

Body (`YeuCauDieuChuyenTaiSan`):

| Field | Mô tả |
|-------|-------|
| `targetRoomCode` | Mã phòng đích (bắt buộc) |
| `transferQuantity` | Số lượng chuyển (> 0) |
| `transferDate` | `YYYY-MM-DD` |
| `giverName` | Họ tên người bàn giao (map `users.full_name`) |
| `receiverName` | Họ tên người nhận |
| `note` | Ghi chú |

Frontend: `FmApi.taoPhieuDieuChuyenTaiSan(assetId, body)`

### Đánh giá tài sản

> **Chưa có API backend** cho rating. Tab đánh giá / đánh giá lại trên `assets.html` dùng state in-memory phía client (`assetRatingHistory` trong `main.js`).

---

## Service Request — `/api/requests`

| Method | Path |
|--------|------|
| GET | `/api/requests` |
| GET | `/api/requests/count-new` → `{ "count": N }` |
| GET | `/api/requests/assignees` |
| GET | `/api/requests/{id}` |
| POST | `/api/requests` | Gửi yêu cầu |
| POST | `/api/requests/drafts` | Lưu nháp |
| PUT/PATCH | `/api/requests/{id}` |
| DELETE | `/api/requests/{id}` |

**Query `GET /api/requests`:** `status`, `managerGroup`, `priority`, `isDraft`, `createdByUserId`, `openOnly`, `assignedToMe`, `createdByMe`

**DTO:** `YeuCauDto` — `title`, `note`, `managerGroup`, `priority`, `managerName`, `attachmentUrl`, `status`, `isDraft`, `assignedToUserId`, …

| Form (student/request-create) | JSON |
|---------------------------------|------|
| `title` | `title` |
| `note` | `note` |
| `managerGroup` | `managerGroup` |
| `requestPriority` | `priority` |
| `managerName` | `managerName` / gán người xử lý |

---

## Audit (Kiểm kê) — `/api/audits`

| Method | Path |
|--------|------|
| GET | `/api/audits` |
| GET | `/api/audits/{id}` |
| POST | `/api/audits` | Tạo đợt kiểm kê |
| PUT | `/api/audits/{id}/details` | Cập nhật dòng chi tiết |
| POST | `/api/audits/{id}/complete` | Hoàn tất |
| GET | `/api/audits/{id}/export` | Export JSON |

**DTO:** `DotKiemKeDto`, `ChiTietKiemKeDto` — xem `audit-periodic-page.js`

---

## Client wrapper (`FmApi`)

Toàn bộ method map 1:1 endpoint trên — xem `src/assets/js/api/api-client.js`.

| Nhóm | Methods |
|------|---------|
| Phòng | `layDanhSachPhong`, `layPhongTheoId`, `taoPhong`, `capNhatPhong`, `xoaPhong`, … |
| Tài sản | `layDanhSachTaiSan`, `taoTaiSan`, `capNhatTaiSan`, `taoPhieuDieuChuyenTaiSan`, … |
| Danh mục | `layDanhSachDanhMuc`, `taoDanhMuc`, … |
| Yêu cầu | `layDanhSachYeuCau`, `taoYeuCau`, `luuNhapYeuCau`, … |
| Kiểm kê | `layDanhSachKiemKe`, `taoKiemKe`, `hoanTatKiemKe`, … |
| User | `layDanhSachNguoiDung`, `taoNguoiDung`, `taoNguoiDungMultipart`, … |
