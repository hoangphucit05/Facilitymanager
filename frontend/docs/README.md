# Tài liệu Frontend — Facility Manager

Bộ tài liệu tham chiếu cho team frontend khi nối UI tĩnh (`frontend/src/`) với Spring Boot backend.

| Tài liệu | Nội dung |
|----------|----------|
| [api-contract.md](./api-contract.md) | Endpoint REST, DTO, mapping form ↔ JSON |
| [routing.md](./routing.md) | Trang HTML, hash URL, sidebar, nginx |
| [rbac.md](./rbac.md) | Menu động, vai trò, phân quyền nút |
| [i18n.md](./i18n.md) | Đa ngôn ngữ vi / en / ja |

## Client API chính

- **`window.FmApi`** (`src/assets/js/api/api-client.js`) — gọi REST, tự gắn `Authorization: Bearer <token>`.
- **`window.CoSoApi`** — alias deprecated của `FmApi`.

## Base URL

| Môi trường | Base URL |
|------------|----------|
| Dev local (frontend `:5173` / `:3000`) | `http://<host>:8080` |
| Docker (nginx proxy) | cùng origin trang ( `/api/` → backend ) |
| Tùy chỉnh | `window.API_BASE_URL` hoặc `window.API_CO_SO` trước khi load `api-client.js` |

## Swagger

Backend bật Springdoc: `http://localhost:8080/swagger-ui/index.html`
