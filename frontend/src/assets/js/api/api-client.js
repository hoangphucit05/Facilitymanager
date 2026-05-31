/**
 * Gọi REST theo API_CONTRACT.md (camelCase JSON).
 *
 * Kiến trúc luồng dữ liệu:
 *   Frontend  →  SQL Sync Server (:8081)  →  Spring Boot (:8080)  →  MySQL
 *                       ↓ (sau mỗi POST/PUT/PATCH/DELETE thành công)
 *                 Tự export lại database/mysql/schema.sql
 *
 * Để đổi địa chỉ: gán window.API_BASE_URL (hoặc API_CO_SO) = 'http://host:port' trước khi load script.
 * Mặc định: Spring Boot trực tiếp — cùng hostname với trang (localhost hoặc IP LAN) + cổng 8080.
 * SQL Sync Server (proxy 8081): gán window.API_CO_SO = 'http://<host>:8081' trước khi load script.
 */
(function () {
  function coSo() {
    if (typeof window !== "undefined" && (window.API_BASE_URL || window.API_CO_SO)) {
      return window.API_BASE_URL || window.API_CO_SO;
    }
    const loc = typeof window !== "undefined" ? window.location : null;
    const hostname = loc && loc.hostname ? loc.hostname : "localhost";
    const protocol = loc && loc.protocol === "https:" ? "https:" : "http:";
    const port = loc && loc.port ? loc.port : "";
    if (port === "3000" || port === "8088" || port === "80" || port === "443") {
      return `${protocol}//${loc.host}`;
    }
    return `${protocol}//${hostname}:8080`;
  }

  async function goiDuongDan(phuongThuc, duongDan, tuyChon) {
    const tuyChonNoiBo = tuyChon || {};
    const url = coSo().replace(/\/$/, "") + duongDan;
    const headers = Object.assign({}, tuyChonNoiBo.headers || {});
    const token =
      typeof window !== "undefined" && window.AppAuth?.getSession?.()?.accessToken
        ? window.AppAuth.getSession().accessToken
        : null;
    if (token && !headers["Authorization"] && !headers["authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const fetchInit = {
      method: phuongThuc,
      headers,
      credentials: tuyChonNoiBo.credentials || "omit",
    };
    if (tuyChonNoiBo.body !== undefined) {
      if (tuyChonNoiBo.body instanceof FormData) {
        fetchInit.body = tuyChonNoiBo.body;
      } else if (typeof tuyChonNoiBo.body === "string") {
        fetchInit.body = tuyChonNoiBo.body;
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      } else {
        fetchInit.body = JSON.stringify(tuyChonNoiBo.body);
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json; charset=UTF-8";
      }
    }
    const phanHoi = await fetch(url, fetchInit);
    const loai = phanHoi.headers.get("Content-Type") || "";
    const chuoiRong = phanHoi.status === 204 || phanHoi.status === 205;
    let than = null;
    if (!chuoiRong) {
      than = loai.includes("application/json") ? await phanHoi.json() : await phanHoi.text();
    }
    if (!phanHoi.ok) {
      const loi = new Error(typeof than === "string" ? than : than?.thongDiep || phanHoi.statusText);
      loi.trangThai = phanHoi.status;
      loi.than = than;
      throw loi;
    }
    return than;
  }

  function chuanHoaDanhSach(than) {
    if (Array.isArray(than)) return than;
    if (than && Array.isArray(than.content)) return than.content;
    if (than && Array.isArray(than.items)) return than.items;
    if (than && Array.isArray(than.data)) return than.data;
    return [];
  }

  window.FmApi = {
    coSo,

    layDanhSachPhong(thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/rooms" + q).then(chuanHoaDanhSach);
    },
    layPhongTheoId(maPhong, thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/rooms/" + encodeURIComponent(maPhong) + q);
    },
    layTongHopTaiSanTheoPhong(maPhong) {
      return goiDuongDan("GET", "/api/rooms/" + encodeURIComponent(maPhong) + "/asset-summary");
    },
    layLichTheoMaPhong(maPhong) {
      return goiDuongDan("GET", "/api/rooms/code/" + encodeURIComponent(maPhong) + "/schedule").then(chuanHoaDanhSach);
    },
    layLopDangHocTheoMaPhong(maPhong, atIso) {
      const q = atIso ? ("?at=" + encodeURIComponent(atIso)) : "";
      return goiDuongDan("GET", "/api/rooms/code/" + encodeURIComponent(maPhong) + "/current-class" + q);
    },
    taoPhong(doiTuongJson) {
      return goiDuongDan("POST", "/api/rooms", { body: doiTuongJson });
    },
    capNhatPhong(maPhong, doiTuongJson) {
      return goiDuongDan("PUT", "/api/rooms/" + encodeURIComponent(maPhong), { body: doiTuongJson });
    },
    xoaPhong(maPhong) {
      return goiDuongDan("DELETE", "/api/rooms/" + encodeURIComponent(maPhong));
    },
    patchPhong(maPhong, doiTuongJson) {
      return goiDuongDan("PATCH", "/api/rooms/" + encodeURIComponent(maPhong), { body: doiTuongJson });
    },

    layDanhSachTaiSan(thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/assets" + q).then(chuanHoaDanhSach);
    },
    layTaiSanTheoId(maTaiSan) {
      return goiDuongDan("GET", "/api/assets/" + encodeURIComponent(maTaiSan));
    },
    taoTaiSan(doiTuongJson) {
      return goiDuongDan("POST", "/api/assets", { body: doiTuongJson });
    },
    capNhatTaiSan(maTaiSan, doiTuongJson) {
      return goiDuongDan("PUT", "/api/assets/" + encodeURIComponent(maTaiSan), { body: doiTuongJson });
    },
    xoaTaiSan(maTaiSan) {
      return goiDuongDan("DELETE", "/api/assets/" + encodeURIComponent(maTaiSan));
    },
    taoPhieuDieuChuyenTaiSan(maTaiSan, doiTuongJson) {
      return goiDuongDan("POST", "/api/assets/" + encodeURIComponent(maTaiSan) + "/transfer", { body: doiTuongJson });
    },

    layDanhSachDanhMuc(thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/categories" + q).then(chuanHoaDanhSach);
    },
    layDanhMucTheoId(maDanhMuc) {
      return goiDuongDan("GET", "/api/categories/" + encodeURIComponent(maDanhMuc));
    },
    taoDanhMuc(doiTuongJson) {
      return goiDuongDan("POST", "/api/categories", { body: doiTuongJson });
    },
    capNhatDanhMuc(maDanhMuc, doiTuongJson) {
      return goiDuongDan("PUT", "/api/categories/" + encodeURIComponent(maDanhMuc), { body: doiTuongJson });
    },
    xoaDanhMuc(maDanhMuc) {
      return goiDuongDan("DELETE", "/api/categories/" + encodeURIComponent(maDanhMuc));
    },

    layDanhSachYeuCau(thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/requests" + q).then(chuanHoaDanhSach);
    },
    layDanhSachNguoiPhanViec() {
      return goiDuongDan("GET", "/api/requests/assignees").then(chuanHoaDanhSach);
    },
    demYeuCauMoi() {
      return goiDuongDan("GET", "/api/requests/count-new");
    },
    layYeuCauTheoId(id) {
      return goiDuongDan("GET", "/api/requests/" + encodeURIComponent(id));
    },
    taoYeuCau(doiTuongJson) {
      return goiDuongDan("POST", "/api/requests", { body: doiTuongJson });
    },
    luuNhapYeuCau(doiTuongJson) {
      return goiDuongDan("POST", "/api/requests/drafts", { body: doiTuongJson });
    },
    capNhatYeuCau(id, doiTuongJson) {
      return goiDuongDan("PUT", "/api/requests/" + encodeURIComponent(id), { body: doiTuongJson });
    },
    patchYeuCau(id, doiTuongJson) {
      return goiDuongDan("PATCH", "/api/requests/" + encodeURIComponent(id), { body: doiTuongJson });
    },
    xoaYeuCau(id) {
      return goiDuongDan("DELETE", "/api/requests/" + encodeURIComponent(id));
    },

    layDanhSachKiemKe() {
      return goiDuongDan("GET", "/api/audits").then(chuanHoaDanhSach);
    },
    layKiemKeTheoId(id) {
      return goiDuongDan("GET", "/api/audits/" + encodeURIComponent(id));
    },
    taoKiemKe(doiTuongJson) {
      return goiDuongDan("POST", "/api/audits", { body: doiTuongJson });
    },
    capNhatChiTietKiemKe(id, rows) {
      return goiDuongDan("PUT", "/api/audits/" + encodeURIComponent(id) + "/details", { body: rows });
    },
    hoanTatKiemKe(id) {
      return goiDuongDan("POST", "/api/audits/" + encodeURIComponent(id) + "/complete");
    },
    xuatKiemKeJson(id) {
      return goiDuongDan("GET", "/api/audits/" + encodeURIComponent(id) + "/export");
    },

    layDanhSachNguoiDung(thamSo) {
      const q = thamSo ? "?" + new URLSearchParams(thamSo).toString() : "";
      return goiDuongDan("GET", "/api/users" + q).then(chuanHoaDanhSach);
    },
    layNguoiDungTheoId(maNguoiDung) {
      return goiDuongDan("GET", "/api/users/" + encodeURIComponent(maNguoiDung));
    },
    taoNguoiDung(doiTuongJson) {
      return goiDuongDan("POST", "/api/users", { body: doiTuongJson });
    },
    taoNguoiDungMultipart(formData) {
      return goiDuongDan("POST", "/api/users", { body: formData });
    },
    capNhatNguoiDung(maNguoiDung, doiTuongJson) {
      return goiDuongDan("PUT", "/api/users/" + encodeURIComponent(maNguoiDung), { body: doiTuongJson });
    },
    capNhatNguoiDungMultipart(maNguoiDung, formData) {
      return goiDuongDan("PUT", "/api/users/" + encodeURIComponent(maNguoiDung), { body: formData });
    },
    xoaNguoiDung(maNguoiDung) {
      return goiDuongDan("DELETE", "/api/users/" + encodeURIComponent(maNguoiDung));
    },
    patchNguoiDung(maNguoiDung, doiTuongJson) {
      return goiDuongDan("PATCH", "/api/users/" + encodeURIComponent(maNguoiDung), { body: doiTuongJson });
    },

    /**
     * Kích hoạt export SQL thủ công (cập nhật database/mysql/schema.sql).
     * Chỉ hoạt động khi dùng qua SQL Sync Server (port 8081).
     */
    exportSql() {
      window.open(coSo().replace(/\/$/, "") + "/api/export-sql", "_blank");
    },
  };

  /** @deprecated Use window.FmApi */
  window.CoSoApi = window.FmApi;
})();
