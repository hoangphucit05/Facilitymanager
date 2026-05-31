# Facility Manager

## Overview

This repository contains a **facility / asset management** web application: a **Spring Boot** REST API and a **static HTML/CSS/JavaScript** frontend (`frontend/src/` → `npm run build` → `frontend/dist/`).

It is **not** a React + Tailwind stack; the UI is classic multi-page HTML with shared assets under `frontend/src/assets/`.

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for **development** and **testing**.

### Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Node.js** | 18+ (cho `frontend/` — `npm run build`) |
| **npm** | Comes with Node |
| **JDK** | **21** (`JAVA_HOME` must point to JDK 21) |
| **Maven** | 3.9+ |
| **MySQL** | 8.x |
| **Redis** | 6+ (required by the backend for captcha and token storage) |
| **MySQL client** | `mysql` CLI để import `database/mysql/schema.sql`

An IDE (IntelliJ IDEA, Eclipse, or VS Code with Java extensions) is optional.

**Backend libraries** (declared in `backend/pom.xml`): Spring Boot 4 (Web MVC, Data JPA, Security, Data Redis), Hibernate/JPA, MySQL driver, MapStruct, Springdoc OpenAPI (Swagger UI).

---

## Installation

1. **Clone** the repository to your local machine:

   ```bash
   git clone <your-repository-url>
   ```

2. **Navigate** into the project directory (repository root):

   ```bash
   cd Facility_manager_project
   ```

3. **Import database:**

   ```bash
   mysql -u root -p --default-character-set=utf8mb4 < database/mysql/schema.sql
   mysql -u root -p --default-character-set=utf8mb4 < database/mysql/seed_tkb.sql
   ```

   File `schema.sql` tự tạo database `asset_management`. Với Docker Compose, script chạy tự động khi khởi tạo MySQL lần đầu.

   Hibernate `ddl-auto` is `none`; schema được quản lý bởi file SQL này.

4. **Start Redis** on `127.0.0.1:6379` (or set `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` to match your environment).

5. **Backend — install dependencies** (Maven downloads dependencies automatically on first run):

   ```bash
   cd backend
   mvn -q -DskipTests dependency:go-offline
   ```

   Adjust `spring.datasource.*` in `application.yml` (or use `MYSQL_PASSWORD` and related env vars) so the app can reach MySQL.

6. **Frontend:**

   ```bash
   cd frontend
   npm install
   npm run build
   npm run dev
   ```

   Docker Compose builds frontend from `src/` automatically.

---

## Available Scripts

### Backend (`backend/`)

Run these from the `backend` directory.

| Command | Description |
|---------|-------------|
| `mvn spring-boot:run` | Runs the Spring Boot app in development mode. Default API base: **http://localhost:8080**. Health: `/api/health`. Swagger UI: `/swagger-ui/index.html`. |
| `mvn -DskipTests package` | Builds the executable JAR under `target/` (e.g. `facility-manager-backend-0.0.1-SNAPSHOT.jar`). |
| `java -jar target/facility-manager-backend-0.0.1-SNAPSHOT.jar` | Runs the packaged JAR (after `package`). |
| `mvn -q -DskipTests compile` | Compiles Java sources without running tests (similar in spirit to a typecheck gate). |

Main class: `com.facilitymanager.UngDungHeThong`.

If `mvn compile` fails with missing types (e.g. `MenuVo`, `User`, `UserRepository`), your checkout is incomplete compared to the upstream branch—restore the missing Java files or sync again before `spring-boot:run`.

---

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run build` | Copy `src/` → `dist/` |
| `npm run dev` | Build then serve `dist/` on port 5173 |

**API base URL:** set in HTML before loading `api-client.js`:

```html
<script>window.API_BASE_URL = 'http://localhost:8080';</script>
```

---

## Suggested dev startup order

1. MySQL (`schema.sql` + `seed_tkb.sql` đã import)  
2. Redis  
3. `mvn spring-boot:run` in `backend/`  
4. `npm run dev` in `frontend/`  

---

## Further documentation

- `backend/README.md` — Java package layout  
- `frontend/docs/api-contract.md` — form fields ↔ API mapping  
- `database/mysql/README.md` — MySQL script notes  

---

## License

Set according to your organization (no default license file is implied here).
