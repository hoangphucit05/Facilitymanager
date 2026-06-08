# Hệ thống Quản lý Cơ sở Vật chất UTC2

## 1. Tổng quan project

**Facility Manager** là ứng dụng web quản lý cơ sở vật chất, phục vụ công tác quản lý phòng học, tài sản, người dùng và phân quyền tại UTC2.

Hệ thống được xây dựng theo mô hình **Client–Server**:

| Thành phần | Mô tả |
|------------|--------|
| **Frontend** | Giao diện web đa trang, gọi REST API |
| **Backend** | Xử lý nghiệp vụ, xác thực, phân quyền RBAC |
| **MySQL** | Lưu trữ dữ liệu nghiệp vụ |
| **Redis** | Captcha và phiên đăng nhập (token) |

**Chức năng chính:**
- Đăng nhập / đăng xuất (captcha, token Redis)
- Quản lý người dùng, vai trò và phân quyền menu (Admin, Manager, Staff, Student)
- Quản lý phòng học, danh mục, tài sản
- Kiểm kê định kỳ, yêu cầu xử lý / sửa chữa
- Thống kê tài sản

---

## 2. Công cụ sử dụng

| Lớp | Công nghệ | Mục đích |
|-----|-----------|----------|
| **Frontend** | HTML5, CSS3, JavaScript | Giao diện web, gọi API |
| **Backend** | Java 21, Spring Boot | REST API, xử lý nghiệp vụ |
| **ORM** | Spring Data JPA, Hibernate | Ánh xạ entity ↔ MySQL |
| **Database** | MySQL 8 | Lưu dữ liệu hệ thống |
| **Cache** | Redis | Captcha, phiên đăng nhập |
| **Build** | Maven, npm | Build backend & frontend |
| **DevOps** | Docker, Docker Compose, Nginx | Đóng gói và triển khai |
| **API docs** | Swagger (Springdoc) | Kiểm thử và tài liệu API |
| **Khác** | MapStruct, i18n, UUID, Git | Map DTO, đa ngôn ngữ, định danh, quản lý mã nguồn |

---

## 3. Cấu trúc thư mục

### 3.1 Backend

```
backend/
├── .dockerignore
├── .mvn/
├── Dockerfile
├── mvnw
├── mvnw.cmd
├── pom.xml
├── README.md
├── src/
│   └── main/
│       ├── java/
│       │   └── com/facilitymanager/
│       │       ├── captcha/          # Sinh & kiểm tra captcha (Redis)
│       │       ├── config/           # Cấu hình Spring, Redis, CORS, Swagger
│       │       ├── controller/       # REST API (auth, user, room, asset, RBAC…)
│       │       ├── dto/              # Request / Response DTO
│       │       ├── entity/           # Entity ánh xạ bảng MySQL (JPA)
│       │       ├── exception/        # Xử lý ngoại lệ toàn cục
│       │       ├── repository/       # Spring Data JPA Repository
│       │       ├── security/         # Token, interceptor phân quyền
│       │       ├── service/          # Tầng nghiệp vụ
│       │       ├── vo/               # View Object (menu, phân trang…)
│       │       └── UngDungHeThong.java
│       └── resources/
│           └── application.yml       # Cấu hình datasource, Redis, JPA
└── target/                           # Output build Maven (không commit)
```

### 3.2 Frontend

```
frontend/
├── Dockerfile
├── nginx.conf
├── package.json
├── scripts/
│   └── build.mjs                     # Copy src/ → dist/
├── src/                              # Mã nguồn — chỉnh sửa tại đây
│   ├── index.html
│   ├── pages/
│   │   ├── auth/                     # login, register, unauthorized
│   │   ├── dashboard/                # phòng, tài sản, kiểm kê, yêu cầu…
│   │   ├── profile/                  # user, RBAC, liên hệ
│   │   └── student/                  # tạo / gửi / lưu yêu cầu
│   ├── assets/
│   │   ├── css/                      # base, layout, components, pages
│   │   ├── js/
│   │   │   ├── api/                  # api-client.js
│   │   │   ├── auth/                 # login, guard, session
│   │   │   ├── components/
│   │   │   ├── pages/                # logic từng trang
│   │   │   ├── shared/               # sidebar, menu, i18n, permission
│   │   │   └── student/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   └── locales/                      # vi.json, en.json, ja.json
├── dist/                             # Build output (npm run build)
└── docs/
    ├── api-contract.md
    └── rbac.md
```

### 3.3 Database

```
database/
└── mysql/
    ├── schema.sql                    # Tạo DB, 12 bảng, seed users & RBAC
    ├── seed_tkb.sql                  # Thời khóa biểu (room_usage_slots)
    ├── README.md
    ├── backup/
    └── data/
```

**12 bảng MySQL:**

| Nhóm | Bảng | Mục đích |
|------|------|----------|
| Nghiệp vụ | `users` | Tài khoản & vai trò người dùng |
| | `categories` | Danh mục loại tài sản |
| | `rooms` | Thông tin phòng học |
| | `assets` | Tài sản, thiết bị |
| | `requests` | Yêu cầu xử lý / sửa chữa |
| | `audits` | Đợt kiểm kê định kỳ |
| Hỗ trợ | `audit_details` | Chi tiết kiểm kê từng tài sản |
| | `room_usage_slots` | Lịch sử dụng phòng (TKB) |
| | `asset_transfers` | Lịch sử điều chuyển tài sản |
| | `fm_menu_permissions` | Menu & quyền chức năng |
| | `fm_roles` | Vai trò (ADMIN, MANAGER, STAFF, STUDENT) |
| | `fm_role_menu` | Phân quyền role ↔ menu |

---

## 4. Chạy bằng Docker

### 4.1 Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (hoặc Docker Engine + Docker Compose v2)
- Port trống: **3000**, **3307**, **6379**, **8080**

### 4.2 Khởi động

Tại **thư mục gốc** repository:

```bash
docker compose up -d --build
```

| Service | Container | Port (host) | Mô tả |
|---------|-----------|-------------|--------|
| `mysql` | facility-mysql | **3307** → 3306 | MySQL 8.4, tự import `schema.sql` + `seed_tkb.sql` lần đầu |
| `redis` | facility-redis | **6379** | Redis — captcha & phiên đăng nhập |
| `backend` | facility-backend | **8080** | Spring Boot API |
| `frontend` | facility-frontend | **3000** → 80 | Nginx phục vụ giao diện web |

### 4.3 Truy cập

| Mục | URL |
|-----|-----|
| Giao diện web | http://localhost:3000 |
| API Backend | http://localhost:8080 |
| Health check | http://localhost:8080/api/health |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |

**Tài khoản demo:**

| Username | Password | Vai trò |
|----------|----------|---------|
| `adminutc2` | `123456` | ADMIN |
| `truongkhoa001` | `123456` | MANAGER |
| `nv001` | `123456` | STAFF |
| `sv001` | `123456` | STUDENT |

### 4.4 Lệnh hữu ích

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v    # reset DB (xóa volume MySQL)
```

> **Lưu ý:** MySQL chỉ import script khi volume mới. Muốn reset DB: `docker compose down -v` rồi `docker compose up -d --build`.

---

## 5. Giao diện hệ thống

### Đăng nhập

![Giao diện đăng nhập](docs/screenshots/01-dang-nhap.png)

### Captcha xác thực & Đăng ký

| Captcha xác thực | Đăng ký |
|:---:|:---:|
| ![Captcha](docs/screenshots/02-captcha.png) | ![Đăng ký](docs/screenshots/03-dang-ky.png) |

### Trang chủ (Admin)

![Trang chủ Admin](docs/screenshots/04-trang-chu.png)

### Quản lý người dùng

![Quản lý người dùng](docs/screenshots/05-quan-ly-user.png)

### Bản đồ phòng học

![Bản đồ phòng học](docs/screenshots/06-ban-do-phong.png)

### Quản lý danh mục

![Quản lý danh mục](docs/screenshots/07-quan-ly-danh-muc.png)

### Quản lý tài sản

![Quản lý tài sản](docs/screenshots/08-quan-ly-tai-san.png)

### Thống kê tài sản

![Thống kê tài sản](docs/screenshots/09-thong-ke.png)

### Quản lý công việc — Chờ xử lý

![Chờ xử lý](docs/screenshots/10-cho-xu-ly.png)

### Kiểm kê định kỳ

![Kiểm kê định kỳ](docs/screenshots/11-kiem-ke.png)

### Liên hệ

![Liên hệ người dùng](docs/screenshots/12-lien-he.png)

### Phân quyền vai trò

![Quản lý vai trò](docs/screenshots/13-phan-quyen.png)

---

## 6. Nhóm thực hiện

- Trần Tiến Hợp
- Võ Hoàng Phúc
- Đỗ Nhật Thanh
- Trần Huỳnh Hòa Phúc

**Môn:** Công nghệ Java — **GVHD:** ThS. Trần Thị Dung  
**Trường:** ĐH Giao thông Vận tải — Phân hiệu TP. Hồ Chí Minh
