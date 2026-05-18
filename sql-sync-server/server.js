/**
 * SQL Sync Server — FacilityManager
 * ===================================
 * Server Node.js chạy cổng 8081, đứng trước Spring Boot backend (8080).
 * Chức năng:
 *  1. Proxy tất cả request /api/* sang Spring Boot
 *  2. Sau mỗi thao tác POST/PUT/PATCH/DELETE thành công → tự export lại
 *     file schema_main.sql từ MySQL (dùng mysqldump hoặc truy vấn trực tiếp)
 *  3. Endpoint GET /api/export-sql → tải file SQL mới nhất
 *  4. CORS mở rộng để frontend truy cập được
 *
 * Khởi động: node server.js
 * (hoặc: npm start)
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const mysql = require("mysql2/promise");

// ─── Cấu hình ──────────────────────────────────────────────────────────────
const CONFIG = {
  // Cổng proxy này lắng nghe (frontend sẽ trỏ vào đây)
  PROXY_PORT: 8081,
  // Địa chỉ Spring Boot backend
  BACKEND_HOST: "localhost",
  BACKEND_PORT: 8080,
  // MySQL
  DB_HOST: "localhost",
  DB_PORT: 3306,
  DB_NAME: "asset_management",
  DB_USER: "root",
  DB_PASS: process.env.DB_PASS || "1234567891",
  // Đường dẫn file SQL đầu ra (cập nhật mỗi khi có thay đổi)
  SQL_OUTPUT_PATH: path.join(__dirname, "../backend/database/mysql/schema_main.sql"),
  // Dùng mysqldump nếu có, nếu không dùng truy vấn trực tiếp
  USE_MYSQLDUMP: true,
  MYSQLDUMP_BIN: "mysqldump", // hoặc đường dẫn tuyệt đối nếu cần
};

// ─── Pool kết nối MySQL ─────────────────────────────────────────────────────
let pool;
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASS,
      database: CONFIG.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      charset: "utf8mb4",
    });
  }
  return pool;
}

// ─── Xuất SQL bằng mysqldump ────────────────────────────────────────────────
function exportViaDump() {
  return new Promise((resolve, reject) => {
    const cmd = [
      CONFIG.MYSQLDUMP_BIN,
      `-u${CONFIG.DB_USER}`,
      `-p${CONFIG.DB_PASS}`,
      `--host=${CONFIG.DB_HOST}`,
      `--port=${CONFIG.DB_PORT}`,
      `--single-transaction`,
      `--routines`,
      `--triggers`,
      `--set-charset`,
      `--default-character-set=utf8mb4`,
      CONFIG.DB_NAME,
    ].join(" ");

    exec(cmd, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`mysqldump thất bại: ${stderr || err.message}`));
        return;
      }
      const header = `-- Tự động export bởi sql-sync-server\n-- Thời điểm: ${new Date().toISOString()}\n-- Chạy: mysql -u root -p < schema_main.sql\n\n`;
      resolve(header + stdout);
    });
  });
}

// ─── Xuất SQL bằng truy vấn trực tiếp (fallback khi không có mysqldump) ────
async function exportViaQuery() {
  const conn = await getPool();
  const tables = ["users", "categories", "rooms", "assets", "requests",
                  "asset_transfers", "asset_ratings", "asset_liquidations"];

  let sql = `-- Tự động export bởi sql-sync-server\n-- Thời điểm: ${new Date().toISOString()}\n\n`;
  sql += `DROP DATABASE IF EXISTS ${CONFIG.DB_NAME};\n`;
  sql += `CREATE DATABASE ${CONFIG.DB_NAME}\n  CHARACTER SET utf8mb4\n  COLLATE utf8mb4_unicode_ci;\n\nUSE ${CONFIG.DB_NAME};\n\n`;
  sql += `SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const table of tables) {
    // Lấy CREATE TABLE
    try {
      const [rows] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
      sql += `-- Bảng: ${table}\n`;
      sql += rows[0]["Create Table"] + ";\n\n";

      // Lấy dữ liệu
      const [data] = await conn.query(`SELECT * FROM \`${table}\``);
      if (data.length > 0) {
        const cols = Object.keys(data[0]).map(c => `\`${c}\``).join(", ");
        const vals = data.map(row => {
          const v = Object.values(row).map(val => {
            if (val === null) return "NULL";
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
            if (typeof val === "object") return `CAST('${JSON.stringify(val).replace(/'/g, "\\'")}' AS JSON)`;
            if (typeof val === "number") return String(val);
            return `'${String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
          });
          return `(${v.join(", ")})`;
        });
        sql += `INSERT INTO \`${table}\` (${cols}) VALUES\n${vals.join(",\n")};\n\n`;
      }
    } catch (e) {
      sql += `-- WARN: Không thể export bảng ${table}: ${e.message}\n\n`;
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  return sql;
}

// ─── Hàm chính: xuất và ghi file ───────────────────────────────────────────
let exportInProgress = false;
async function doExportSql(reason) {
  if (exportInProgress) return;
  exportInProgress = true;
  try {
    console.log(`[SQL Sync] Bắt đầu export (${reason || "thủ công"})...`);
    let sqlContent;
    if (CONFIG.USE_MYSQLDUMP) {
      try {
        sqlContent = await exportViaDump();
      } catch (e) {
        console.warn("[SQL Sync] mysqldump thất bại, dùng query fallback:", e.message);
        sqlContent = await exportViaQuery();
      }
    } else {
      sqlContent = await exportViaQuery();
    }
    fs.writeFileSync(CONFIG.SQL_OUTPUT_PATH, sqlContent, "utf8");
    console.log(`[SQL Sync] ✅ Đã cập nhật: ${CONFIG.SQL_OUTPUT_PATH}`);
  } catch (e) {
    console.error("[SQL Sync] ❌ Export thất bại:", e.message);
  } finally {
    exportInProgress = false;
  }
}

// ─── Proxy request tới Spring Boot ─────────────────────────────────────────
function proxyRequest(clientReq, clientRes) {
  const method = clientReq.method;
  const url = clientReq.url;

  // Thêm CORS headers
  clientRes.setHeader("Access-Control-Allow-Origin", "*");
  clientRes.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  clientRes.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    clientRes.writeHead(204);
    clientRes.end();
    return;
  }

  // Endpoint xuất SQL thủ công
  if (url === "/api/export-sql" && method === "GET") {
    doExportSql("manual").then(() => {
      const filePath = CONFIG.SQL_OUTPUT_PATH;
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        clientRes.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="schema_main.sql"`,
          "Content-Length": stat.size,
        });
        fs.createReadStream(filePath).pipe(clientRes);
      } else {
        clientRes.writeHead(404, { "Content-Type": "application/json" });
        clientRes.end(JSON.stringify({ error: "Chưa có file SQL" }));
      }
    });
    return;
  }

  // Thu thập body request
  const chunks = [];
  clientReq.on("data", (chunk) => chunks.push(chunk));
  clientReq.on("end", () => {
    const body = Buffer.concat(chunks);

    const options = {
      hostname: CONFIG.BACKEND_HOST,
      port: CONFIG.BACKEND_PORT,
      path: url,
      method: method,
      headers: { ...clientReq.headers, host: `${CONFIG.BACKEND_HOST}:${CONFIG.BACKEND_PORT}` },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Gộp headers từ backend + CORS
      const resHeaders = { ...proxyRes.headers };
      resHeaders["Access-Control-Allow-Origin"] = "*";
      resHeaders["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
      resHeaders["Access-Control-Allow-Headers"] = "Content-Type, Authorization";

      clientRes.writeHead(proxyRes.statusCode, resHeaders);

      const resChunks = [];
      proxyRes.on("data", (chunk) => {
        resChunks.push(chunk);
        clientRes.write(chunk);
      });

      proxyRes.on("end", () => {
        clientRes.end();

        // Nếu là thao tác thay đổi dữ liệu và thành công → sync SQL
        const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
        const isSuccess = proxyRes.statusCode >= 200 && proxyRes.statusCode < 300;
        if (isWriteMethod && isSuccess) {
          // Delay nhỏ để Spring Boot commit xong transaction
          setTimeout(() => doExportSql(`${method} ${url}`), 500);
        }
      });
    });

    proxyReq.on("error", (err) => {
      console.error("[Proxy] Lỗi kết nối backend:", err.message);
      if (!clientRes.headersSent) {
        clientRes.writeHead(502, { "Content-Type": "application/json" });
        clientRes.end(JSON.stringify({
          error: "Backend Spring Boot không phản hồi",
          detail: err.message,
          hint: "Đảm bảo Spring Boot đang chạy trên cổng " + CONFIG.BACKEND_PORT,
        }));
      }
    });

    if (body.length > 0) proxyReq.write(body);
    proxyReq.end();
  });
}

// ─── Khởi động server ───────────────────────────────────────────────────────
const server = http.createServer(proxyRequest);
server.listen(CONFIG.PROXY_PORT, () => {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║        FacilityManager — SQL Sync Server         ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(`║  Proxy:    http://localhost:${CONFIG.PROXY_PORT}               ║`);
  console.log(`║  Backend:  http://localhost:${CONFIG.BACKEND_PORT} (Spring Boot)  ║`);
  console.log(`║  Database: ${CONFIG.DB_NAME} @ ${CONFIG.DB_HOST}:${CONFIG.DB_PORT}        ║`);
  console.log(`║  SQL file: schema_main.sql (tự cập nhật)         ║`);
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  Frontend trỏ window.API_CO_SO = '             ' ║");
  console.log(`║  'http://localhost:${CONFIG.PROXY_PORT}'                       ║`);
  console.log("╚══════════════════════════════════════════════════╝");

  // Export SQL ngay khi khởi động
  doExportSql("khởi động server");
});
