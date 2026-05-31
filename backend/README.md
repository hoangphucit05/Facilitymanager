# Backend (Spring Boot)

Gói gốc: `com.facilitymanager`. Java **21** (`pom.xml`); cần **JDK 21+** và `JAVA_HOME` trỏ đúng bản 21 để `mvn compile` thành công.

## Cấu trúc `src/main/java/com/facilitymanager`

| Thư mục | Vai trò |
|----------|---------|
| `config` | `CauHinhTaiLieuApi`, `CauHinhBaoMat`, `CauHinhRedis` (Redis khi có starter) |
| `controller` | Ví dụ `DieuKhienKiemTraSucKhoe` |
| `service` | Nghiệp vụ |
| `repository` | Spring Data JPA (thêm interface khi entity đã `@Entity`) |
| `entity` | Mô hình domain / ánh xạ DB (hiện là POJO; thêm JPA khi khớp schema) |
| `enums` | Enum dùng chung (nếu có) |
| `dto` | Request / response |
| `mapper` | MapStruct: chuyển entity ↔ DTO |
| `exception` | `XuLyNgoaiLeChung` — bắt ngoại lệ toàn cục |

## Tài nguyên

- `src/main/resources/application.yml` — datasource, JPA
- `database/` — script MySQL và CSV mẫu

## Chạy nhanh

```bash
mvn spring-boot:run
```

- API health: `GET /api/health`
- Swagger UI: `/swagger-ui/index.html` (đã mở quyền trong `CauHinhBaoMat`)
- Lớp chạy: `com.facilitymanager.UngDungHeThong`

## Frontend trong repo

`frontend/docs/api-contract.md` mô tả mapping form ↔ DTO dự kiến.
