const { setupTableControls } = window.AppTableControls || {};
const {
  K65_CLASS_OPTIONS,
  getRoomUpdates,
  setRoomUpdate,
  getRoomProfile,
  mapRoomApiToProfile,
  getRadioValueByName,
  setRadioValueByName,
  fillK65ClassSelects,
  getRoomAdditions,
  setRoomAdditions,
  addRoomRowToBuilding,
} = window.AppRoomHelpers || {};

if (!setupTableControls || !K65_CLASS_OPTIONS || !getRoomProfile || !mapRoomApiToProfile) {
  throw new Error("Missing shared frontend helpers. Ensure shared scripts are loaded before main.js.");
}

/** Live Server / nhiều server tĩnh mở URL không có đuôi .html — phải khớp cả hai dạng. */
function duongDanLaTrang(tenFileHtml) {
  const p = (window.location.pathname || "").replace(/\/+$/, "");
  const basename = String(tenFileHtml).replace(/^\//, "");
  const khongDuoi = basename.replace(/\.html$/i, "");
  return p.endsWith("/" + basename) || p.endsWith("/" + khongDuoi);
}

/** Phòng theo tòa — chỉ từ API, không seed tĩnh. */
let buildingRooms = {};

/** Các tòa E chỉ 1 tầng — không lấy chữ số trong mã phòng (P2E6 ≠ tầng 2). */
const SINGLE_FLOOR_BUILDINGS = new Set(["E3", "E4", "E5", "E6", "E8", "EB8"]);

const roomRowForUi = (row) => {
  const roomCode = String(row?.[0] ?? "").trim();
  const floor = String(row?.[1] ?? "").trim();
  const classStudying = String(row?.[2] ?? "").trim();
  const teacher = String(row?.[3] ?? "").trim();
  const capacity = String(row?.[4] ?? row?.[5] ?? "").trim();
  return [roomCode, floor, classStudying || "-", teacher || "--", capacity || ""];
};

const sortRoomRowsByFloor = (rows) =>
  [...(Array.isArray(rows) ? rows : [])].sort((a, b) => {
    const fa = Number(String(a?.[1] ?? "").replace(/\D/g, "")) || 0;
    const fb = Number(String(b?.[1] ?? "").replace(/\D/g, "")) || 0;
    if (fa !== fb) return fa - fb;
    return String(a?.[0] ?? "").localeCompare(String(b?.[0] ?? ""), undefined, { numeric: true });
  });

/** Mã phòng (số thẻ) → id DB để gọi DELETE/PUT /api/rooms/{id} (dùng chung các trang) */
window.maPhongTuDinhDanh = window.maPhongTuDinhDanh || Object.create(null);

const xacDinhHocKyTuNgay = (isoDate) => {
  const ref = isoDate ? new Date(`${isoDate}T00:00:00`) : new Date();
  const hk2Start = new Date("2026-03-02T00:00:00");
  const hk2End = new Date("2026-06-06T23:59:59");
  const hk1Start = new Date("2025-09-03T00:00:00");
  const hk1End = new Date("2026-01-10T23:59:59");
  if (ref >= hk2Start && ref <= hk2End) return "HK2-2025-2026";
  if (ref >= hk1Start && ref <= hk1End) return "HK1-2025-2026";
  return ref >= hk2Start ? "HK2-2025-2026" : "HK1-2025-2026";
};

const taiPhongTuMayChu = async (opts = {}) => {
  const api = window.CoSoApi;
  if (!api || typeof api.layDanhSachPhong !== "function") return;
  try {
    const params = {};
    const isoDate = opts.date || "";
    params.semester = xacDinhHocKyTuNgay(isoDate);
    if (isoDate) params.date = isoDate;
    if (opts.shift) params.shift = opts.shift;
    const buildingCode =
      opts.building ||
      String(new URLSearchParams(window.location.search).get("building") || "").trim();
    if (buildingCode) params.building = buildingCode;
    const ds = await api.layDanhSachPhong(params);
    if (!Array.isArray(ds) || ds.length === 0) {
      const code =
        opts.building ||
        String(new URLSearchParams(window.location.search).get("building") || "").trim();
      if (code) buildingRooms[code] = [];
      return;
    }
    Object.keys(buildingRooms).forEach((k) => {
      buildingRooms[k] = [];
    });
    for (const r of ds) {
      const b = String(r.buildingCode || r.building || r.building_code || "").trim() || "KHAC";
      const code = String(r.roomCode || r.room_code || "").trim();
      if (!code) continue;
      if (r.id != null) window.maPhongTuDinhDanh[code] = String(r.id);
      if (!buildingRooms[b]) buildingRooms[b] = [];
      const coLocLich = Boolean(opts.date || opts.shift);
      const lopRaw =
        r.classStudying ||
        r.class_studying ||
        r.classUsing ||
        r.class_using ||
        "";
      const gvRaw =
        r.teacherName ||
        r.teacher_name ||
        r.teacher ||
        r.giangVien ||
        "";
      const lop =
        lopRaw && String(lopRaw).trim()
          ? String(lopRaw).trim()
          : coLocLich
            ? "Trống"
            : "-";
      const gv =
        gvRaw && String(gvRaw).trim()
          ? String(gvRaw).trim()
          : coLocLich
            ? "--"
            : "-";
      const floorUi = SINGLE_FLOOR_BUILDINGS.has(b)
        ? "1"
        : String(r.floor ?? r.tang ?? "");
      const hang = roomRowForUi([
        code,
        floorUi,
        lop,
        gv,
        String(r.capacity ?? r.sucChua ?? ""),
      ]);
      buildingRooms[b].push(hang);
    }
    Object.keys(buildingRooms).forEach((k) => {
      buildingRooms[k] = sortRoomRowsByFloor(buildingRooms[k]);
    });
  } catch (err) {
    console.warn("[Phòng] Không tải được từ API:", err);
    const code =
      opts.building ||
      String(new URLSearchParams(window.location.search).get("building") || "").trim();
    if (code) buildingRooms[code] = [];
  }
};

const isRoomCodeTakenInBuilding = (buildingCode, roomCode) => {
  const staticRows = buildingRooms[buildingCode] || [];
  if (staticRows.some((r) => r[0] === roomCode)) return true;
  return false;
};

if (duongDanLaTrang("departments.html")) {
  const body = document.getElementById("roomTableBody");
  const departmentsTable = document.getElementById("departmentsTable");
  const departmentsTableHeadRow = document.getElementById("departmentsTableHeadRow");
  const departmentsSearchInput = document.getElementById("departmentsSearchInput");
  const departmentsShiftSelect = document.getElementById("departmentsShiftSelect");
  const departmentsDateInput = document.getElementById("departmentsDateInput");
  const deptPageTitle = document.querySelector(".departments-panel .page-title");
  const addRoomTabLink = document.querySelector('a.tab[href*="room-add"]');
  let refreshDepartmentTable = () => {};

  const DEPT_HK2_START = new Date("2026-03-02T00:00:00");
  const DEPT_HK2_END = new Date("2026-06-06T23:59:59");
  const DEPT_HK1_START = new Date("2025-09-03T00:00:00");
  const DEPT_HK1_END = new Date("2026-01-10T23:59:59");

  const layKhoangHocKyHienTai = () => {
    const now = new Date();
    if (now >= DEPT_HK2_START && now <= DEPT_HK2_END) {
      return { start: DEPT_HK2_START, end: DEPT_HK2_END };
    }
    if (now >= DEPT_HK1_START && now <= DEPT_HK1_END) {
      return { start: DEPT_HK1_START, end: DEPT_HK1_END };
    }
    return now >= DEPT_HK2_START
      ? { start: DEPT_HK2_START, end: DEPT_HK2_END }
      : { start: DEPT_HK1_START, end: DEPT_HK1_END };
  };

  /** Tiêu đề trang theo tòa đang chọn: «Quản lí nhà E1», «Quản lí nhà E3», ... */
  const giuTieuDeTrangPhong = (buildingCode) => {
    if (!deptPageTitle) return;
    const code = chuanHoaMaToa(buildingCode || maToaHienTai());
    deptPageTitle.removeAttribute("data-i18n");
    deptPageTitle.removeAttribute("data-i18n-params");
    if (!code) {
      deptPageTitle.textContent = "Quản lí phòng học";
      return;
    }
    if (code === "GDDN") {
      deptPageTitle.textContent = "Quản lí Giảng đường Đa Năng";
      return;
    }
    if (code === "CANTIN") {
      deptPageTitle.textContent = "Quản lí Căn Tin";
      return;
    }
    deptPageTitle.textContent = `Quản lí nhà ${code}`;
  };

  const chuanHoaMaToa = (code) => {
    const s = String(code || "").trim();
    if (!s) return "";
    if (s === "GDDN" || s === "CANTIN") return s;
    return s.toUpperCase();
  };

  const maToaHienTai = () => {
    const tuUrl = chuanHoaMaToa(new URLSearchParams(window.location.search).get("building"));
    if (tuUrl) return tuUrl;
    try {
      const stored = chuanHoaMaToa(sessionStorage.getItem("departmentsActiveBuilding"));
      if (stored) return stored;
    } catch (_) {
      /* ignore */
    }
    const tuHang = chuanHoaMaToa(
      document.querySelector("#roomTableBody tr[data-building]")?.getAttribute("data-building"),
    );
    if (tuHang) return tuHang;
    return "E1";
  };

  const dongBoBuildingTrenUrl = (code) => {
    const normalized = chuanHoaMaToa(code);
    if (!normalized || !window.history?.replaceState) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("building") === normalized) return;
      url.searchParams.set("building", normalized);
      history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (_) {
      /* ignore */
    }
  };

  const deptT = (key, params) => {
    const v = window.FmI18n?.t?.(key, params);
    return v != null && v !== key ? v : key;
  };

  const formatIsoDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const tinhNgayMacDinh = () => {
    const { start, end } = layKhoangHocKyHienTai();
    const now = new Date();
    if (now < start) return formatIsoDate(start);
    if (now > end) return formatIsoDate(end);
    return formatIsoDate(now);
  };

  const khoiTaoBoLoc = (resetNgay = false) => {
    if (departmentsDateInput) {
      departmentsDateInput.min = formatIsoDate(DEPT_HK1_START);
      departmentsDateInput.max = formatIsoDate(DEPT_HK2_END);
      if (resetNgay || !departmentsDateInput.value) {
        departmentsDateInput.value = tinhNgayMacDinh();
      }
      const v = departmentsDateInput.value;
      if (v && departmentsDateInput.min && v < departmentsDateInput.min) {
        departmentsDateInput.value = departmentsDateInput.min;
      }
      if (v && departmentsDateInput.max && v > departmentsDateInput.max) {
        departmentsDateInput.value = departmentsDateInput.max;
      }
    }
    if (departmentsShiftSelect && !departmentsShiftSelect.value) {
      departmentsShiftSelect.value = "MORNING";
    }
  };

  const buildingLabelForCode = (code) => {
    if (!code) return deptT("menu.building");
    if (code === "GDDN") return deptT("menu.venueLectureHall");
    if (code === "CANTIN") return deptT("menu.venueCanteen");
    return deptT("menu.buildingNamed", { name: code });
  };

  const renderDeptTableHead = (mode) => {
    if (!departmentsTableHeadRow) return;
    if (mode === "global") {
      departmentsTableHeadRow.innerHTML = `
    <th>${deptT("departments.colBuilding")}</th>
    <th>${deptT("departments.colRoomCode")}</th>
    <th>${deptT("departments.colFloor")}</th>
    <th>${deptT("departments.colClassUsing")}</th>
    <th>${deptT("departments.colTeacher")}</th>
    <th>${deptT("departments.colCapacity")}</th>
    <th>${deptT("departments.colActions")}</th>
  `;
      return;
    }
    departmentsTableHeadRow.innerHTML = `
    <th>${deptT("departments.colRoomCode")}</th>
    <th>${deptT("departments.colFloor")}</th>
    <th>${deptT("departments.colClassUsing")}</th>
    <th>${deptT("departments.colTeacher")}</th>
    <th>${deptT("departments.colCapacity")}</th>
    <th>${deptT("departments.colActions")}</th>
  `;
  };

  const setAddRoomLink = (buildingCode) => {
    const href = `../dashboard/room-add.html?building=${encodeURIComponent(buildingCode)}`;
    if (addRoomTabLink) addRoomTabLink.href = href;
    const addRoomBtn = document.getElementById("departmentsAddRoomLink");
    if (addRoomBtn) addRoomBtn.setAttribute("href", href);
    try {
      sessionStorage.setItem("departmentsActiveBuilding", buildingCode);
    } catch (_) {}
  };

  const roomActionCells = (roomCode) => `
          <td>
            <div class="room-action-buttons user-action-buttons">
              <button class="icon-btn room-view-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.viewRoom")}">
                <img src="/assets/icons/view_infor.svg" alt="${deptT("departments.viewRoom")}" />
              </button>
              <button class="icon-btn room-update-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.updateRoom")}">
                <img src="/assets/icons/update.svg" alt="${deptT("departments.updateRoom")}" />
              </button>
              <button class="icon-btn room-delete-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.deleteRoom")}">
                <img src="/assets/icons/delete.svg" alt="${deptT("departments.deleteRoom")}" />
              </button>
            </div>
          </td>`;

  const buildDepartmentRoomTr = (room, buildingCode, { withBuildingColumn }) => {
    const uiRow = roomRowForUi(room);
    const roomFloor = uiRow[1] != null && String(uiRow[1]).trim() !== "" ? String(uiRow[1]).trim() : "";
    const roomClass =
      uiRow[2] != null && String(uiRow[2]).trim() !== "" && uiRow[2] !== "-"
        ? String(uiRow[2]).trim()
        : "Trống";
    const roomTeacher =
      uiRow[3] != null && String(uiRow[3]).trim() !== "" && uiRow[3] !== "-"
        ? String(uiRow[3]).trim()
        : "--";
    const roomCapacity =
      uiRow[4] != null && String(uiRow[4]).trim() !== ""
        ? String(uiRow[4]).trim()
        : room[5] != null && String(room[5]).trim() !== ""
          ? String(room[5]).trim()
          : "";
    const idPhong = (window.maPhongTuDinhDanh && window.maPhongTuDinhDanh[uiRow[0]]) || "";
    const bCell = withBuildingColumn ? `<td>${buildingLabelForCode(buildingCode)}</td>` : "";
    return `
        <tr data-building="${buildingCode}" data-room-id="${idPhong}">
          ${bCell}
          <td>${uiRow[0]}</td>
          <td>${roomFloor}</td>
          <td>${roomClass}</td>
          <td>${roomTeacher}</td>
          <td>${roomCapacity}</td>
          ${roomActionCells(uiRow[0])}
        </tr>`;
  };

  const renderAllBuildingsForSearch = () => {
    if (!body || !departmentsTable) return;
    departmentsTable.setAttribute("data-dept-search-mode", "global");
    renderDeptTableHead("global");
    const codes = new Set(Object.keys(buildingRooms));
    const out = [];
    for (const code of Array.from(codes).sort()) {
      const rows = sortRoomRowsByFloor(buildingRooms[code] || []);
      for (const room of rows) {
        out.push(buildDepartmentRoomTr(room, code, { withBuildingColumn: true }));
      }
    }
    body.innerHTML = out.join("");
    giuTieuDeTrangPhong();
    setAddRoomLink(maToaHienTai());
    refreshDepartmentTable();
  };

  const renderRooms = (buildingCode, displayText) => {
    if (!body) return;
    const code = chuanHoaMaToa(buildingCode) || buildingCode;
    if (departmentsTable) departmentsTable.setAttribute("data-dept-search-mode", "single");
    renderDeptTableHead("single");
    setAddRoomLink(code);
    dongBoBuildingTrenUrl(code);
    const rows = sortRoomRowsByFloor(buildingRooms[code] || []);
    if (rows.length === 0) {
      body.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:24px">Không có phòng.</td></tr>';
    } else {
      body.innerHTML = rows
        .map((room) => buildDepartmentRoomTr(room, code, { withBuildingColumn: false }))
        .join("");
    }
    giuTieuDeTrangPhong(code);
    refreshDepartmentTable();
  };

  departmentsSearchInput?.addEventListener("input", () => {
    const q = departmentsSearchInput.value.trim();
    if (q) {
      renderAllBuildingsForSearch();
    } else {
      const code = maToaHienTai();
      renderRooms(code, buildingLabelForCode(code));
    }
  });

  refreshDepartmentTable = setupTableControls({
    tableBody: body,
    searchInput: departmentsSearchInput,
    getRowSearchText: (row) => {
      const mode = document.getElementById("departmentsTable")?.getAttribute("data-dept-search-mode");
      const cols = mode === "global" ? [3, 4, 5] : [2, 3, 4];
      return cols.map((i) => row.children[i]?.textContent?.trim() || "").join(" ");
    },
  });

  const taiLaiPhongTheoBoLoc = async () => {
    const building = maToaHienTai();
    const date = departmentsDateInput?.value || "";
    const shift = departmentsShiftSelect?.value || "";
    await taiPhongTuMayChu({
      building,
      date: date || undefined,
      shift: shift || undefined,
    });
    if (departmentsSearchInput?.value.trim()) {
      renderAllBuildingsForSearch();
    } else {
      taiTheoUrl();
    }
  };

  const onDateOrShiftFilterChange = () => {
    void taiLaiPhongTheoBoLoc();
  };
  departmentsDateInput?.addEventListener("change", onDateOrShiftFilterChange);
  departmentsDateInput?.addEventListener("input", onDateOrShiftFilterChange);
  departmentsShiftSelect?.addEventListener("change", () => {
    void taiLaiPhongTheoBoLoc();
  });

  const taiTheoUrl = () => {
    const code = maToaHienTai();
    setAddRoomLink(code);
    renderRooms(code, buildingLabelForCode(code));
  };

  window.addEventListener("fm-i18n-applied", () => {
    const mode = departmentsTable?.getAttribute("data-dept-search-mode");
    renderDeptTableHead(mode === "global" ? "global" : "single");
    khoiTaoBoLoc(false);
    queueMicrotask(giuTieuDeTrangPhong);
  });

  giuTieuDeTrangPhong();

  void (async () => {
    khoiTaoBoLoc(true);
    await taiLaiPhongTheoBoLoc();
    giuTieuDeTrangPhong();
  })();

  body?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".room-view-btn");
    const updateBtn = target.closest(".room-update-btn");
    const deleteBtn = target.closest(".room-delete-btn");
    const roomCode =
      viewBtn?.getAttribute("data-room-code") ||
      updateBtn?.getAttribute("data-room-code") ||
      deleteBtn?.getAttribute("data-room-code") ||
      "";
    if (!roomCode) return;
    if (viewBtn) {
      const tr = viewBtn.closest("tr");
      const idPhong = tr?.getAttribute("data-room-id") || "";
      const q = new URLSearchParams({ room: roomCode });
      if (idPhong) q.set("id", idPhong);
      const ngayLoc = departmentsDateInput?.value?.trim() || "";
      const caLoc = departmentsShiftSelect?.value?.trim() || "";
      const toaLoc =
        tr?.getAttribute("data-building") || maToaHienTai() || "";
      if (ngayLoc) q.set("date", ngayLoc);
      if (caLoc) q.set("shift", caLoc);
      if (toaLoc) q.set("building", toaLoc);
      window.location.href = `../dashboard/room-detail.html?${q.toString()}`;
      return;
    }
    if (updateBtn) {
      const tr = updateBtn.closest("tr");
      const idPhong = tr?.getAttribute("data-room-id") || "";
      let b =
        tr?.getAttribute("data-building") ||
        maToaHienTai() ||
        "";
      if (!b) {
        try {
          b = sessionStorage.getItem("departmentsActiveBuilding") || "";
        } catch (_) {
          b = "";
        }
      }
      const q = new URLSearchParams({ room: roomCode });
      if (b) q.set("building", b);
      if (idPhong) q.set("id", idPhong);
      window.location.href = `../dashboard/room-edit.html?${q.toString()}`;
      return;
    }
    if (deleteBtn) {
      const row = deleteBtn.closest("tr");
      if (!row) return;
      const confirmed = window.confirm(deptT("departments.confirmDeleteRoom", { code: roomCode }));
      if (!confirmed) return;
      const idPhong = row.getAttribute("data-room-id") || "";
      if (idPhong && window.CoSoApi && typeof window.CoSoApi.xoaPhong === "function") {
        void (async () => {
          try {
            await window.CoSoApi.xoaPhong(idPhong);
            row.remove();
            refreshDepartmentTable();
          } catch (e) {
            window.alert(deptT("departments.deleteRoomFailed"));
          }
        })();
        return;
      }
      row.remove();
      refreshDepartmentTable();
    }
  });

  document.getElementById("departmentsExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`phong-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      rows: Fm.tbodyToObjectsAuto(document.getElementById("roomTableBody")),
    });
  });
}

/* users.html -> users-page.js */

if (duongDanLaTrang("users-add.html")) {
  const userFormPageTitle = document.getElementById("userFormPageTitle");
  const userFormTabLabel = document.getElementById("userFormTabLabel");
  const userFormSubmitBtn = document.getElementById("userFormSubmitBtn");
  const userUsernameInput = document.getElementById("userUsernameInput");
  const userPasswordInput = document.getElementById("userPasswordInput");
  const userFullnameInput = document.getElementById("userFullnameInput");
  const userAddressInput = document.getElementById("userAddressInput");
  const userPhoneInput = document.getElementById("userPhoneInput");
  const userRoleInput = document.getElementById("userRoleInput");
  const avatarImage = document.getElementById("avatarImage");
  const avatarPlaceholder = document.getElementById("avatarPlaceholder");

  const usersByKey = {
    "tien-hop": {
      username: "canbo",
      password: "******",
      fullname: "Trần Tiến Hợp",
      address: "Bình Định",
      phone: "1263751380",
      role: "Cán bộ quản lý tài sản",
      avatar: "/assets/images/avatar/avatar_1.jpg",
    },
    "nhat-thanh": {
      username: "canbonhanvien",
      password: "******",
      fullname: "Đỗ Nhật Thanh",
      address: "An Giang",
      phone: "1263751380",
      role: "Cán bộ quản lý tài sản",
      avatar: "/assets/images/avatar/avatar_2.jpg",
    },
    "hoang-phuc": {
      username: "ht",
      password: "******",
      fullname: "Võ Hoàng Phúc",
      address: "Sóc Trăng",
      phone: "1234459015",
      role: "Hiệu trưởng",
      avatar: "/assets/images/avatar/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      username: "nv",
      password: "******",
      fullname: "Trần Huỳnh Hòa Phúc",
      address: "Tiền Giang",
      phone: "1263751380",
      role: "Lao Công",
      avatar: "/assets/images/avatar/avatar_4.jpg",
    },
  };

  const query = new URLSearchParams(window.location.search);
  const editKey = query.get("edit");
  const editIdFromUrl = query.get("id") || "";
  const userInfo = editKey ? usersByKey[editKey] : null;
  const isEditMode = Boolean(editKey);

  const dienFormNguoiDung = (info) => {
    if (!info) return;
    if (userFormPageTitle) userFormPageTitle.textContent = "Cập nhật user";
    if (userFormTabLabel) userFormTabLabel.textContent = "Cập nhật user";
    if (userFormSubmitBtn) userFormSubmitBtn.textContent = "Cập nhật";
    if (userUsernameInput) userUsernameInput.value = info.username || "";
    if (userPasswordInput) userPasswordInput.value = info.password || "******";
    if (userFullnameInput) userFullnameInput.value = info.fullname || "";
    if (userAddressInput) userAddressInput.value = info.address || "";
    if (userPhoneInput) userPhoneInput.value = info.phone || "";
    if (userRoleInput) userRoleInput.value = info.role || "";
    if (avatarImage && avatarPlaceholder) {
      avatarImage.src = info.avatar || "/assets/images/avatar/avatar_1.jpg";
      avatarImage.style.display = "block";
      avatarPlaceholder.style.display = "none";
    }
  };

  if (isEditMode && userInfo) {
    dienFormNguoiDung(userInfo);
  }

  if (isEditMode && editIdFromUrl && window.CoSoApi?.layNguoiDungTheoId) {
    void (async () => {
      try {
        const u = await window.CoSoApi.layNguoiDungTheoId(editIdFromUrl);
        dienFormNguoiDung({
          username: u.username || "",
          password: "******",
          fullname: u.fullName || u.fullname || "",
          address: u.address || "",
          phone: u.phoneNumber || u.phone_number || "",
          role: u.role || "",
          avatar:
            window.UserAvatar && typeof window.UserAvatar.resolve === "function"
              ? window.UserAvatar.resolve(u)
              : u.avatarUrl || u.avatar_url || "/assets/images/avatar/avatar_1.jpg",
        });
      } catch (e) {
        console.warn("[User] GET theo id:", e);
      }
    })();
  }

  userFormSubmitBtn?.addEventListener("click", () => {
    if (!userUsernameInput || !userFullnameInput || !userRoleInput) return;

    if (isEditMode) {
      const maNguoiDungCapNhat = editIdFromUrl || (userInfo && userInfo.id != null ? String(userInfo.id) : "");
      const payload = {
        userKey: editKey,
        username: userUsernameInput.value.trim(),
        fullname: userFullnameInput.value.trim(),
        role: userRoleInput.value.trim(),
        avatar: avatarImage?.src || "",
      };
      void (async () => {
        try {
          const fileInput = document.getElementById("avatarInput");
          const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
          if (hasFile && window.CoSoApi?.capNhatNguoiDungMultipart && maNguoiDungCapNhat) {
            const fd = new FormData();
            fd.append("username", userUsernameInput.value.trim());
            if (userPasswordInput?.value) fd.append("password", userPasswordInput.value);
            fd.append("fullName", userFullnameInput.value.trim());
            fd.append("address", userAddressInput?.value.trim() || "");
            fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
            fd.append("role", userRoleInput.value.trim());
            fd.append("avatar", fileInput.files[0]);
            await window.CoSoApi.capNhatNguoiDungMultipart(String(maNguoiDungCapNhat), fd);
          } else if (window.CoSoApi?.capNhatNguoiDung && maNguoiDungCapNhat) {
            await window.CoSoApi.capNhatNguoiDung(String(maNguoiDungCapNhat), {
              username: userUsernameInput.value.trim(),
              password: userPasswordInput?.value || undefined,
              fullName: userFullnameInput.value.trim(),
              address: userAddressInput?.value.trim() || "",
              phoneNumber: userPhoneInput?.value.trim() || "",
              role: userRoleInput.value.trim(),
            });
          }
        } catch (e) {
          console.warn("[User] Cập nhật API:", e);
        }
      })();
      sessionStorage.setItem("pendingUserUpdate", JSON.stringify(payload));
      window.alert("Cập nhật user thành công!");
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.href = "../profile/users.html";
      return;
    }

    void (async () => {
      try {
        const fileInput = document.getElementById("avatarInput");
        const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
        if (hasFile && window.CoSoApi?.taoNguoiDungMultipart) {
          const fd = new FormData();
          fd.append("username", userUsernameInput.value.trim());
          fd.append("password", userPasswordInput?.value || "");
          fd.append("fullName", userFullnameInput.value.trim());
          fd.append("address", userAddressInput?.value.trim() || "");
          fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
          fd.append("role", userRoleInput.value.trim());
          fd.append("avatar", fileInput.files[0]);
          await window.CoSoApi.taoNguoiDungMultipart(fd);
        } else if (window.CoSoApi?.taoNguoiDung) {
          await window.CoSoApi.taoNguoiDung({
            username: userUsernameInput.value.trim(),
            password: userPasswordInput?.value || "",
            fullName: userFullnameInput.value.trim(),
            address: userAddressInput?.value.trim() || "",
            phoneNumber: userPhoneInput?.value.trim() || "",
            role: userRoleInput.value.trim(),
          });
        }
      } catch (e) {
        console.warn("[User] Thêm API:", e);
      }
    })();
    window.alert("Thêm user thành công!");
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/users.html";
  });

  document.getElementById("userFormExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const form = document.getElementById("userForm");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`user-form-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      form: Fm.formToPlainObject(form),
    });
  });
}

if (duongDanLaTrang("categories.html")) {
  const pageTitle = document.querySelector(".page-title");
  const listTab = document.getElementById("categoryTabList");
  const addTab = document.getElementById("categoryTabAdd");
  const extraTab = document.getElementById("categoryTabExtra");
  const listSection = document.getElementById("categoryListSection");
  const addSection = document.getElementById("categoryAddSection");
  const categoryForm = document.getElementById("categoryForm");
  const categoryTableHeadRow = document.getElementById("categoryTableHeadRow");
  const categoryTableBody = document.getElementById("categoryTableBody");
  const categoryNameLabel = document.querySelector('label[for="categoryNameInput"]');
  const categoryCodeLabel = document.querySelector('label[for="categoryCodeInput"]');
  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryCodeInput = document.getElementById("categoryCodeInput");
  const categoryCodeSelect = document.getElementById("categoryCodeSelect");
  const categoryNameError = document.getElementById("categoryNameError");
  const categoryResetBtn = document.getElementById("categoryResetBtn");
  const categoryMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="categories.html"]'));
  let activeCategoryConfigKey = "default";
  let activeCategoryTab = "list";
  let refreshCategoryTable = () => {};

  const categoryConfigs = {
    default: {
      title: "Quản lý danh mục tài sản",
      listTabText: "Tất cả danh mục",
      addTabText: "Thêm danh mục",
      extraTabText: "",
      columns: ["ID", "Mã danh mục", "Tên danh mục", "Chức năng"],
      nameLabel: "Tên danh mục",
      codeLabel: "Mã danh mục",
      namePlaceholder: "Nhập tên danh mục",
      codePlaceholder: "Ví dụ: MM-TB",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [],
    },
    "nguon-kinh-phi": {
      title: "Quản lý nguồn kinh phí",
      listTabText: "Nguồn kinh phí",
      addTabText: "Thêm nguồn kinh phí",
      extraTabText: "",
      columns: ["ID", "Mã NKP", "Tên nguồn kinh phí", "Tổng ngân sách", "Tổng chi", "Tổng thanh lý", "Còn lại", "Chức năng"],
      nameLabel: "Tên nguồn kinh phí",
      codeLabel: "Mã nguồn kinh phí",
      namePlaceholder: "Vui lòng nhập tên nguồn kinh phí",
      codePlaceholder: "Vui lòng nhập mã nguồn kinh phí",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [],
    },
  };

  const mapDanhMucThanhHang = (list, configKey) => {
    const sorted = [...(Array.isArray(list) ? list : [])].sort((a, b) => {
      const idA = Number(a?.id);
      const idB = Number(b?.id);
      if (Number.isFinite(idA) && Number.isFinite(idB)) return idA - idB;
      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), undefined, { numeric: true });
    });
    const rows = sorted.map((c) => {
      const id = String(c.id != null ? c.id : "");
      const code = String(c.code || c.categoryCode || "");
      const name = String(c.name || c.categoryName || "");
      if (configKey === "nguon-kinh-phi") {
        return [id, code, name, "—", "—", "—", "—", "Sửa/Xóa"];
      }
      return [id, code, name, "Sửa/Xóa"];
    });
    return rows;
  };

  const taiDanhMucTuApi = async (type, configKey = "default") => {
    const api = window.FmApi || window.CoSoApi;
    const cfg = categoryConfigs[configKey] || categoryConfigs.default;
    if (!api || typeof api.layDanhSachDanhMuc !== "function") return false;
    try {
      const thamSo = type ? { type } : {};
      const list = await api.layDanhSachDanhMuc(thamSo);
      cfg.rows = mapDanhMucThanhHang(list, configKey);
      return true;
    } catch (err) {
      console.warn("[Danh mục] Không tải được từ API:", err);
      cfg.rows = [];
      return false;
    }
  };

  const switchCategoryTab = (tabName) => {
    if (!listTab || !addTab || !listSection || !addSection) return;
    activeCategoryTab = tabName;
    const isList = tabName === "list";
    const isAdd = tabName === "add";
    const isExtra = tabName === "extra";

    listSection.hidden = !isList;
    addSection.hidden = isList;
    listTab.classList.toggle("tab-active", isList);
    addTab.classList.toggle("tab-active", isAdd);
    extraTab?.classList.toggle("tab-active", isExtra);
    const pag = listSection.nextElementSibling;
    if (pag && pag.classList.contains("table-pagination")) {
      pag.hidden = !isList;
    }
  };

  const getNextCategoryId = () => {
    if (!categoryTableBody) return 1;
    const ids = Array.from(categoryTableBody.querySelectorAll("tr td:first-child"))
      .map((cell) => Number(cell.textContent?.trim()))
      .filter((value) => Number.isFinite(value));
    if (ids.length === 0) return 1;
    return Math.max(...ids) + 1;
  };

  const buildCategoryCodeFromName = (name) =>
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("-")
      .slice(0, 10);

  const resetCategoryForm = () => {
    if (!categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;
    categoryNameInput.value = "";
    categoryCodeInput.value = "";
    categoryCodeSelect.value = "";
    const reqKey = "categories.validationRequired";
    categoryNameError.setAttribute("data-i18n", reqKey);
    categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "Hãy nhập danh mục của bạn !";
    categoryNameError.hidden = true;
  };

  const toMoneyNumber = (text) => Number((text || "").replace(/[^\d]/g, "")) || 0;
  const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  const escapeCategoryAttr = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");

  const escapeCategoryText = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  /** Cột chức năng: cập nhật + xóa (ô vuông, icon; không có xem chi tiết) */
  const categoryActionButtonsHtml = (id, code) => {
    const a = escapeCategoryAttr(id);
    const b = escapeCategoryAttr(code);
    return `<td>
      <div class="category-icon-actions">
        <button class="category-icon-btn category-update-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.updateTitle" title="Cập nhật">
          <img src="/assets/icons/update.svg" alt="" />
        </button>
        <button class="category-icon-btn category-delete-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.deleteTitle" title="Xóa">
          <img src="/assets/icons/delete.svg" alt="" />
        </button>
      </div>
    </td>`;
  };

  const renderCategoryRows = (rows) => {
    if (!categoryTableBody) return;
    categoryTableBody.innerHTML = rows
      .map((row) => {
        if (!row || row.length === 0) return "";
        const cells = [...row];
        cells.pop();
        const id = cells[0] ?? "";
        const code = cells[1] ?? "";
        const dataTds = cells.map((c) => `<td>${c}</td>`).join("");
        return `<tr>${dataTds}${categoryActionButtonsHtml(id, code)}</tr>`;
      })
      .join("");
  };

  const renderCategoryHead = (columns) => {
    if (!categoryTableHeadRow) return;
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    categoryTableHeadRow.innerHTML = (columns || [])
      .map((fallback, i) => {
        const key = `categories.views.${vk}.columns.${i}`;
        const translated = window.FmI18n?.t?.(key);
        const text = translated && translated !== key ? translated : fallback;
        return `<th data-i18n="${key}">${escapeCategoryText(text)}</th>`;
      })
      .join("");
  };

  const populateBudgetTypeSelect = () => {
    if (!categoryCodeSelect || !categoryTableBody) return;
    const options = Array.from(categoryTableBody.querySelectorAll("tr"))
      .map((row) => {
        const cells = row.querySelectorAll("td");
        const code = cells[1]?.textContent?.trim() || "";
        const name = cells[2]?.textContent?.trim() || "";
        const value = code || name;
        const label = code ? `${code} - ${name}` : name;
        return { value, label };
      })
      .filter((item) => item.value);

    categoryCodeSelect.innerHTML = `
      <option value="" data-i18n="categories.budgetSelectPlaceholder">-- Chọn loại kinh phí --</option>
      ${options.map((item) => `<option value="${item.value}">${item.label}</option>`).join("")}
    `;
    window.FmI18n?.apply?.(categoryCodeSelect);
  };

  const setActiveCategoryMenuItem = (viewKey) => {
    categoryMenuLinks.forEach((link) => link.classList.remove("active"));
    const matchedLink = categoryMenuLinks.find((link) => {
      const href = link.getAttribute("href") || "";
      const slug = (href.split("#")[1] || "").trim();
      if (!viewKey || viewKey === "default") return slug === "" || slug === "default";
      return slug === viewKey;
    });
    if (matchedLink) {
      matchedLink.classList.add("active");
    }
  };

  const applyCategoryView = async () => {
    let viewKey = window.location.hash.replace("#", "").trim();
    if (viewKey && viewKey !== "default" && viewKey !== "nguon-kinh-phi") {
      viewKey = "default";
      try {
        const url = new URL(window.location.href);
        url.hash = "";
        window.history.replaceState(null, "", url);
      } catch (_) {}
    }
    if (!viewKey || viewKey === "default") {
      await taiDanhMucTuApi("ASSET", "default");
    } else if (viewKey === "nguon-kinh-phi") {
      await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
    }
    const config = categoryConfigs[viewKey] || categoryConfigs.default;
    activeCategoryConfigKey = categoryConfigs[viewKey] ? viewKey : "default";
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    const vp = (field) => `categories.views.${vk}.${field}`;
    const ct = (field, fb) => {
      const key = vp(field);
      const v = window.FmI18n?.t?.(key);
      return v && v !== key ? v : fb;
    };

    if (pageTitle) {
      pageTitle.setAttribute("data-i18n", vp("title"));
      pageTitle.textContent = ct("title", config.title);
    }
    if (listTab) {
      listTab.setAttribute("data-i18n", vp("listTab"));
      listTab.textContent = ct("listTab", config.listTabText);
    }
    if (addTab) {
      addTab.setAttribute("data-i18n", vp("addTab"));
      addTab.textContent = ct("addTab", config.addTabText);
    }
    if (extraTab) {
      const hasExtraTab = Boolean(config.extraTabText);
      extraTab.hidden = !hasExtraTab;
      if (hasExtraTab) {
        extraTab.setAttribute("data-i18n", vp("extraTab"));
        extraTab.textContent = ct("extraTab", config.extraTabText);
      } else {
        extraTab.removeAttribute("data-i18n");
        extraTab.textContent = "";
      }
    }
    if (categoryNameLabel) {
      categoryNameLabel.setAttribute("data-i18n", vp("nameLabel"));
      categoryNameLabel.textContent = ct("nameLabel", config.nameLabel);
    }
    if (categoryCodeLabel) {
      categoryCodeLabel.setAttribute("data-i18n", vp("codeLabel"));
      categoryCodeLabel.textContent = ct("codeLabel", config.codeLabel);
    }
    if (categoryNameInput) {
      categoryNameInput.setAttribute("data-i18n-placeholder", vp("namePlaceholder"));
      categoryNameInput.placeholder = ct("namePlaceholder", config.namePlaceholder);
    }
    if (categoryCodeInput) {
      categoryCodeInput.setAttribute("data-i18n-placeholder", vp("codePlaceholder"));
      categoryCodeInput.placeholder = ct("codePlaceholder", config.codePlaceholder);
      categoryCodeInput.hidden = false;
    }
    if (categoryCodeSelect) categoryCodeSelect.hidden = true;
    const submitBtn = categoryForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.setAttribute("data-i18n", vp("submitBtn"));
      submitBtn.textContent = ct("submitBtn", window.FmI18n?.t?.("buttons.add") || "Thêm");
    }
    if (categoryResetBtn) {
      categoryResetBtn.setAttribute("data-i18n", vp("resetBtn"));
      categoryResetBtn.textContent = ct("resetBtn", window.FmI18n?.t?.("userForm.btnReset") || "Nhập lại");
    }
    renderCategoryHead(config.columns);
    renderCategoryRows(config.rows);
    setActiveCategoryMenuItem(categoryConfigs[viewKey] ? viewKey : "");
    resetCategoryForm();
    switchCategoryTab("list");
    refreshCategoryTable();
    window.FmI18n?.apply?.(document.querySelector("main.content"));
  };

  const setupAddFormForCurrentTab = () => {
    const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
    const isBudgetView = activeCategoryConfigKey === "nguon-kinh-phi";
    const isExtra = activeCategoryTab === "extra";
    const vk = String(activeCategoryConfigKey || "default").replace(/-/g, "_");
    const vp = (field) => `categories.views.${vk}.${field}`;
    const ct = (field, fb) => {
      const key = vp(field);
      const v = window.FmI18n?.t?.(key);
      return v && v !== key ? v : fb;
    };

    if (!categoryNameInput || !categoryCodeInput || !categoryCodeSelect || !categoryNameLabel || !categoryCodeLabel) return;

    if (isBudgetView && isExtra) {
      categoryNameLabel.setAttribute("data-i18n", vp("extraNameLabel"));
      categoryNameLabel.textContent = ct("extraNameLabel", config.extraNameLabel);
      categoryCodeLabel.setAttribute("data-i18n", vp("extraCodeLabel"));
      categoryCodeLabel.textContent = ct("extraCodeLabel", config.extraCodeLabel);
      categoryNameInput.setAttribute("data-i18n-placeholder", vp("extraNamePlaceholder"));
      categoryNameInput.placeholder = ct("extraNamePlaceholder", config.extraNamePlaceholder);
      categoryCodeInput.hidden = true;
      categoryCodeSelect.hidden = false;
      populateBudgetTypeSelect();
      window.FmI18n?.apply?.(document.getElementById("categoryForm"));
      return;
    }

    categoryNameLabel.setAttribute("data-i18n", vp("nameLabel"));
    categoryNameLabel.textContent = ct("nameLabel", config.nameLabel);
    categoryCodeLabel.setAttribute("data-i18n", vp("codeLabel"));
    categoryCodeLabel.textContent = ct("codeLabel", config.codeLabel);
    categoryNameInput.setAttribute("data-i18n-placeholder", vp("namePlaceholder"));
    categoryNameInput.placeholder = ct("namePlaceholder", config.namePlaceholder);
    categoryCodeInput.setAttribute("data-i18n-placeholder", vp("codePlaceholder"));
    categoryCodeInput.placeholder = ct("codePlaceholder", config.codePlaceholder);
    categoryCodeInput.hidden = false;
    categoryCodeSelect.hidden = true;
    window.FmI18n?.apply?.(document.getElementById("categoryForm"));
  };

  listTab?.addEventListener("click", () => {
    switchCategoryTab("list");
  });
  addTab?.addEventListener("click", () => {
    switchCategoryTab("add");
    setupAddFormForCurrentTab();
  });
  extraTab?.addEventListener("click", () => {
    switchCategoryTab("extra");
    setupAddFormForCurrentTab();
  });

  categoryNameInput?.addEventListener("input", () => {
    if (!categoryCodeInput) return;
    const name = categoryNameInput.value;
    if (!categoryCodeInput.value.trim()) {
      categoryCodeInput.value = buildCategoryCodeFromName(name);
    }
    if (categoryNameError) {
      categoryNameError.hidden = name.trim().length > 0;
    }
  });

  categoryResetBtn?.addEventListener("click", () => resetCategoryForm());

  categoryTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".category-update-btn");
    const deleteBtn = target.closest(".category-delete-btn");
    const row = target.closest("tr");
    if (!row || (!updateBtn && !deleteBtn)) return;

    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;
    const name = cells[2]?.textContent?.trim() || "";
    const code = cells[1]?.textContent?.trim() || "";

    if (updateBtn) {
      const config = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
      const labels = (config.columns || []).slice(0, -1);
      const dataTds = Array.from(cells).slice(0, -1);
      const values = dataTds.map((td) => td.textContent?.trim() || "");
      try {
        sessionStorage.setItem(
          "categoryEditDraft",
          JSON.stringify({
            configKey: activeCategoryConfigKey,
            pageTitle: config.title,
            labels,
            values,
            returnHash: window.location.hash || "",
          })
        );
      } catch (_) {}
      window.location.href = "category-update.html";
      return;
    }
    if (deleteBtn) {
      const delMsg = window.FmI18n?.t?.("categories.confirmDelete", { name }) || `Bạn có chắc muốn xóa danh mục "${name}"?`;
      if (!window.confirm(delMsg)) return;
      const idDanhMuc = cells[0]?.textContent?.trim() || "";
      if (idDanhMuc && window.CoSoApi?.xoaDanhMuc) {
        void (async () => {
          try {
            await window.CoSoApi.xoaDanhMuc(idDanhMuc);
            if (activeCategoryConfigKey === "nguon-kinh-phi") {
              await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
            } else if (!activeCategoryConfigKey || activeCategoryConfigKey === "default") {
              await taiDanhMucTuApi("ASSET", "default");
            } else {
              row.remove();
            }
            const cfg = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
            renderCategoryRows(cfg.rows);
            refreshCategoryTable();
          } catch (e) {
            window.alert(window.FmI18n?.t?.("categories.deleteServerFail") || "Xóa danh mục trên máy chủ thất bại.");
          }
        })();
        return;
      }
      row.remove();
      refreshCategoryTable();
    }
  });

  categoryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!categoryTableBody || !categoryNameInput || !categoryCodeInput || !categoryNameError || !categoryCodeSelect) return;

    const categoryName = categoryNameInput.value.trim();
    const typedCode = categoryCodeInput.hidden ? categoryCodeSelect.value.trim() : categoryCodeInput.value.trim();
    const categoryCode = typedCode || buildCategoryCodeFromName(categoryName);

    if (!categoryName) {
      categoryNameError.hidden = false;
      const reqKey = "categories.validationRequired";
      categoryNameError.setAttribute("data-i18n", reqKey);
      categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "Hãy nhập danh mục của bạn !";
      categoryNameInput.focus();
      return;
    }

    categoryNameError.hidden = true;

    const dungApiDanhMuc =
      !activeCategoryConfigKey ||
      activeCategoryConfigKey === "default" ||
      activeCategoryConfigKey === "nguon-kinh-phi";

    if (dungApiDanhMuc) {
      const jsonDanhMuc = {
        code: categoryCode,
        name: categoryName,
        type: activeCategoryConfigKey === "nguon-kinh-phi" ? "FUND_SOURCE" : "ASSET",
      };
      void (async () => {
        try {
          if (window.CoSoApi?.taoDanhMuc) await window.CoSoApi.taoDanhMuc(jsonDanhMuc);
          if (activeCategoryConfigKey === "nguon-kinh-phi") {
            await taiDanhMucTuApi("FUND_SOURCE", "nguon-kinh-phi");
          } else {
            await taiDanhMucTuApi("ASSET", "default");
          }
          const cfg = categoryConfigs[activeCategoryConfigKey] || categoryConfigs.default;
          renderCategoryRows(cfg.rows);
          resetCategoryForm();
          switchCategoryTab("list");
          refreshCategoryTable();
        } catch (e) {
          console.warn("[Danh mục] Thêm API thất bại:", e);
          window.alert(window.FmI18n?.t?.("categories.loadError") || "Không lưu được danh mục. Kiểm tra backend đang chạy.");
        }
      })();
      return;
    }
  });

  refreshCategoryTable = setupTableControls({
    tableBody: categoryTableBody,
    searchInput: document.getElementById("categorySearchInput"),
    pageSizeSelect: document.getElementById("categoryPageSizeSelect"),
  });

  window.addEventListener("hashchange", () => {
    void applyCategoryView();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      void applyCategoryView();
    }
  });

  document.getElementById("categoriesExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const iso = new Date().toISOString();
    if (listSection && !listSection.hidden && categoryTableBody) {
      Fm.download(`categories-list-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(categoryTableBody),
      });
      return;
    }
    if (categoryForm) {
      Fm.download(`categories-form-${stamp}.json`, {
        exportedAt: iso,
        form: Fm.formToPlainObject(categoryForm),
      });
    }
  });

  void applyCategoryView();
}

if (duongDanLaTrang("category-update.html")) {
  const root = document.getElementById("categoryEditFormRoot");
  const codeLabel = document.getElementById("categoryEditCodeLabel");
  const typeLabel = document.getElementById("categoryEditTypeLabel");
  const form = document.getElementById("categoryEditForm");
  const cancelBtn = document.getElementById("categoryEditCancelBtn");
  const raw = sessionStorage.getItem("categoryEditDraft");
  if (!raw || !root) {
    window.location.replace("categories.html");
  } else {
    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = null;
    }
    if (!payload) {
      window.location.replace("categories.html");
    } else {
      const configKey = payload.configKey || "default";
      const vk = String(configKey).replace(/-/g, "_");
      const labels = Array.isArray(payload.labels) ? payload.labels : [];
      const values = Array.isArray(payload.values) ? payload.values : [];
      const h = payload.returnHash || "";
      const codeDisplay =
        values[1] != null && String(values[1]).trim() !== ""
          ? String(values[1])
          : values[0] != null
            ? String(values[0])
            : "—";
      if (codeLabel) codeLabel.textContent = codeDisplay;
      if (typeLabel) {
        const tk = `categories.views.${vk}.title`;
        typeLabel.setAttribute("data-i18n", tk);
        typeLabel.textContent = window.FmI18n?.t?.(tk) || payload.pageTitle || "—";
      }

      const goBackToCategories = () => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = `categories.html${h}`;
        }
      };

      const n = Math.max(labels.length, values.length, 0);
      root.textContent = "";
      for (let i = 0; i < n; i += 1) {
        const wrap = document.createElement("div");
        wrap.className = "field";
        const lab = document.createElement("label");
        lab.htmlFor = `catEditField_${i}`;
        const hasLabel = labels[i] != null && labels[i] !== "";
        if (hasLabel) {
          lab.setAttribute("data-i18n", `categories.views.${vk}.columns.${i}`);
          lab.textContent = String(labels[i]);
        } else {
          const kFb = "categories.edit.fieldFallback";
          lab.setAttribute("data-i18n", kFb);
          lab.setAttribute("data-i18n-params", JSON.stringify({ n: i + 1 }));
          lab.textContent = window.FmI18n?.t?.(kFb, { n: i + 1 }) || `Trường ${i + 1}`;
        }
        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `catEditField_${i}`;
        inp.name = `field_${i}`;
        inp.value = values[i] != null ? String(values[i]) : "";
        const labelForReadonly = hasLabel ? String(labels[i]) : "";
        if (
          /^mã\b/i.test(labelForReadonly) ||
          /^code\b/i.test(labelForReadonly) ||
          /^(Số|STT)\b/i.test(labelForReadonly) ||
          /^id$/i.test(labelForReadonly.trim())
        ) {
          inp.readOnly = true;
        }
        wrap.appendChild(lab);
        wrap.appendChild(inp);
        root.appendChild(wrap);
      }
      window.FmI18n?.apply?.(document.querySelector("main.content"));

      window.addEventListener("fm-i18n-applied", () => {
        if (!duongDanLaTrang("category-update.html")) return;
        window.FmI18n?.apply?.(document.querySelector("main.content"));
      });

      cancelBtn?.addEventListener("click", goBackToCategories);
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const newData = [];
        for (let i = 0; i < n; i += 1) {
          const el = document.getElementById(`catEditField_${i}`);
          newData.push(el ? el.value.trim() : "");
        }
        const rowId = String(values[0] ?? "");
        const than = {
          code: newData[1] || "",
          name: newData[2] || "",
          type: configKey === "nguon-kinh-phi" ? "FUND_SOURCE" : "ASSET",
        };
        void (async () => {
          try {
            if (rowId && window.CoSoApi?.capNhatDanhMuc) await window.CoSoApi.capNhatDanhMuc(rowId, than);
          } catch (err) {
            console.warn("[Danh mục] Cập nhật API thất bại:", err);
          }
        })();
        try {
          sessionStorage.removeItem("categoryEditDraft");
        } catch (_) {}
        window.alert(window.FmI18n?.t?.("categories.successUpdateAlert") || "Cập nhật danh mục thành công!");
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.href = `categories.html${h}`;
      });
    }
  }
}

if (duongDanLaTrang("assets.html")) {
  const assetPageTitle = document.getElementById("assetPageTitle");
  const assetTabs = document.getElementById("assetTabs");
  const assetTabList = document.getElementById("assetTabList");
  const assetTabDetail = document.getElementById("assetTabDetail");
  const assetTabTransfer = document.getElementById("assetTabTransfer");
  const assetListSection = document.getElementById("assetListSection");
  const assetDetailSection = document.getElementById("assetDetailSection");
  const assetTransferSection = document.getElementById("assetTransferSection");
  const assetRatingSection = document.getElementById("assetRatingSection");
  const assetReRatingSection = document.getElementById("assetReRatingSection");
  const reRatingTableSection = document.getElementById("reRatingTableSection");
  const reRatingFormSection = document.getElementById("reRatingFormSection");
  const reRatingTabAllAssets = document.getElementById("reRatingTabAllAssets");
  const reRatingTabRatedAssets = document.getElementById("reRatingTabRatedAssets");
  const reRatingTableBody = document.getElementById("reRatingTableBody");
  const reRatingHistorySection = document.getElementById("reRatingHistorySection");
  const reRatingHistoryTitle = document.getElementById("reRatingHistoryTitle");
  const reRatingHistoryList = document.getElementById("reRatingHistoryList");
  const assetRatingTableBody = document.getElementById("assetRatingTableBody");
  const reRateSaveBtn = document.getElementById("reRateSaveBtn");
  const reRateCancelBtn = document.getElementById("reRateCancelBtn");
  const reInfoName = document.getElementById("reInfoName");
  const reInfoUnit = document.getElementById("reInfoUnit");
  const reInfoQuantity = document.getElementById("reInfoQuantity");
  const reInfoPrice = document.getElementById("reInfoPrice");
  const reInfoDuration = document.getElementById("reInfoDuration");
  const reRateReviewer = document.getElementById("reRateReviewer");
  const reRateStars = document.getElementById("reRateStars");
  const reRateDate = document.getElementById("reRateDate");
  const reRateNote = document.getElementById("reRateNote");
  const assetTableBody = document.getElementById("assetTableBody");
  const assetDetailForm = document.getElementById("assetDetailForm");
  const assetMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="assets.html"]'));


  const thoatThuocTinh = (chuoi) =>
    String(chuoi ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const dinhDangTienVn = (so) => {
    if (so == null || so === "") return "";
    const n = Number(so);
    if (Number.isNaN(n)) return String(so);
    return n.toLocaleString("vi-VN") + " đ";
  };
  const taoMaTaiSanNoiBo = () => {
    const random4 = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `AUTO-${Date.now()}-${random4}`;
  };
  const ganTuyChonCode = (id, options, placeholder) => {
    const select = document.getElementById(id);
    if (!(select instanceof HTMLSelectElement)) return;
    const htmlOptions = options
      .map((o) => `<option value="${thoatThuocTinh(o.value)}">${thoatThuocTinh(o.label)}</option>`)
      .join("");
    const placeholderOption = placeholder ? `<option value="">${thoatThuocTinh(placeholder)}</option>` : "";
    select.innerHTML = `${placeholderOption}${htmlOptions}`;
  };
  const taiTuyChonDanhMucChoFormTaiSan = async () => {
    const api = window.FmApi || window.CoSoApi;
    if (!api?.layDanhSachDanhMuc) return;
    try {
      const [assets, funds] = await Promise.all([
        api.layDanhSachDanhMuc({ type: "ASSET" }),
        api.layDanhSachDanhMuc({ type: "FUND_SOURCE" }),
      ]);
      const toOpts = (list) =>
        (Array.isArray(list) ? list : []).map((c) => ({
          value: String(c.code || c.categoryCode || ""),
          label: String(c.name || c.categoryName || c.code || ""),
        }));
      ganTuyChonCode("assetCategoryInput", toOpts(assets), "-- Chọn danh mục --");
      ganTuyChonCode("assetFundInput", toOpts(funds), "-- Chọn nguồn kinh phí --");
    } catch (err) {
      console.warn("[Tài sản] Không tải danh mục cho form:", err);
    }
  };

  const ganTenNguoiBanGiaoTuPhien = () => {
    const el = document.getElementById("transferGiverInput");
    const user = window.AppAuth?.getUser?.();
    if (el && user) {
      el.value = String(user.fullName || user.username || "").trim();
    }
  };

  const reRatingBaseRows = [];
  const syncReRatingBaseFromAssets = () => {
    reRatingBaseRows.length = 0;
    Array.from(assetTableBody?.querySelectorAll("tr[data-card-number]") || []).forEach((row) => {
      reRatingBaseRows.push({
        card: row.dataset.cardNumber || "",
        name: row.dataset.assetName || "",
        unit: row.dataset.classroom || "",
        quantity: row.dataset.quantity || "",
        price: row.dataset.unitPrice || "",
        building: row.dataset.department || "",
        className: row.dataset.classroom || "",
      });
    });
  };

  const taoHangTaiSanTuDto = (a) => {
          const id = a.id != null ? String(a.id) : "";
          const card = a.cardNumber || a.card_number || "";
          const ten = a.assetName || a.asset_name || "";
          const nhaCungCap = a.provider || "";
          const nuoc = a.country || "";
          const khoa = a.department || "";
          const phong = a.roomCode || a.room_code || a.classroom || "";
          const loaiTs = a.assetType || a.asset_type || "";
          const dm = a.itemCategory || a.item_category || "";
          const namSx = a.manufactureYear != null ? String(a.manufactureYear) : "";
          const dg = a.unitPrice != null ? String(a.unitPrice) : "";
          const sl = a.quantity != null ? String(a.quantity) : "";
          const nguyenGia = a.originalPrice != null ? String(a.originalPrice) : "";
          const nguon = a.fundSource || a.fund_source || "";
          const tgSd = a.usageTime != null ? String(a.usageTime) : "";
          const ngayMua = a.purchaseDate || a.purchase_date || "";
          const namSd = a.usageYear != null ? String(a.usageYear) : "";
          const ghiChu = a.note || "";
          const nguoiMua = a.buyer || "";
          const toa = a.building || a.buildingName || "";
          const roomId = a.roomId != null ? String(a.roomId) : "";
          const tt = String(a.status || "IN_USE").toUpperCase();
          const dangHoatDong = tt === "IN_USE" || tt === "ACTIVE";
          return `<tr
            data-asset-id="${thoatThuocTinh(id)}"
            data-status="${thoatThuocTinh(tt)}"
            data-asset-name="${thoatThuocTinh(ten)}"
            data-provider="${thoatThuocTinh(nhaCungCap)}"
            data-country="${thoatThuocTinh(nuoc)}"
            data-card-number="${thoatThuocTinh(card)}"
            data-department="${thoatThuocTinh(khoa)}"
            data-building="${thoatThuocTinh(toa)}"
            data-room-id="${thoatThuocTinh(roomId)}"
            data-room-code="${thoatThuocTinh(phong)}"
            data-classroom="${thoatThuocTinh(phong)}"
            data-asset-type="${thoatThuocTinh(loaiTs)}"
            data-item-category="${thoatThuocTinh(dm)}"
            data-manufacture-year="${thoatThuocTinh(namSx)}"
            data-unit-price="${thoatThuocTinh(dg)}"
            data-quantity="${thoatThuocTinh(sl)}"
            data-original-price="${thoatThuocTinh(nguyenGia)}"
            data-fund-source="${thoatThuocTinh(nguon)}"
            data-usage-time="${thoatThuocTinh(tgSd)}"
            data-purchase-date="${thoatThuocTinh(ngayMua)}"
            data-usage-year="${thoatThuocTinh(namSd)}"
            data-note="${thoatThuocTinh(ghiChu)}"
            data-buyer="${thoatThuocTinh(nguoiMua)}"
            data-quantity="${thoatThuocTinh(sl)}"
          >
            <td>${thoatThuocTinh(dm)}</td>
            <td>${thoatThuocTinh(ten)}</td>
            <td>${thoatThuocTinh(sl)}</td>
            <td>${thoatThuocTinh(phong || toa)}</td>
            <td><button type="button" class="status-pill asset-status-pill${dangHoatDong ? " on" : ""}" aria-pressed="${dangHoatDong}" data-asset-active="${dangHoatDong ? "1" : "0"}" title="${dangHoatDong ? "Đang sử dụng — bấm để bảo trì" : "Đang bảo trì — bấm để đưa vào sử dụng"}"></button></td>
            <td>
              <div class="room-action-buttons user-action-buttons">
                <button class="icon-btn asset-view-btn" type="button" title="Xem chi tiết">
                  <img src="/assets/icons/view_infor.svg" alt="Xem chi tiết" />
                </button>
                <button class="icon-btn asset-transfer-btn" type="button" title="Điều chuyển">
                  <img src="/assets/icons/dieu_chuyen_1.svg" alt="Điều chuyển" />
                </button>
                <button class="icon-btn asset-update-btn" type="button" title="Cập nhật">
                  <img src="/assets/icons/update.svg" alt="Cập nhật" />
                </button>
              </div>
            </td>
          </tr>`;
  };

  let refreshAssetTable = () => {};
  const taiBangTaiSanTuApi = async () => {
    const api = window.FmApi || window.CoSoApi;
    if (!assetTableBody || !api?.layDanhSachTaiSan) return;
    try {
      const list = await api.layDanhSachTaiSan();
      if (!Array.isArray(list)) {
        assetTableBody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;padding:16px;color:#b3261e">Dữ liệu API không hợp lệ.</td></tr>';
        refreshAssetTable();
        return;
      }
      const filtered = list.filter((a) => {
        const b = String(a?.building || a?.buildingName || "").toUpperCase();
        return b === "E7" || b === "GDDN";
      });
      if (filtered.length === 0) {
        assetTableBody.innerHTML =
          '<tr><td colspan="6" style="text-align:center;padding:24px">Không có tài sản thuộc E7 hoặc Giảng đường đa năng.</td></tr>';
        refreshAssetTable();
        syncReRatingBaseFromAssets();
        renderReRatingRows();
        return;
      }
      assetTableBody.innerHTML = filtered.map(taoHangTaiSanTuDto).join("");
      refreshAssetTable();
      syncReRatingBaseFromAssets();
      renderReRatingRows();
    } catch (err) {
      console.warn("[Tài sản] Không tải được từ API:", err);
      assetTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:16px;color:#b3261e">Không tải được từ API. (${thoatThuocTinh(err?.message || err)})</td></tr>`;
      refreshAssetTable();
    }
  };
  let activeReRatingTab = "all";
  let selectedReRatingCard = "";
  let selectedHistoryCard = "";

  let assetRatingHistory = {};

  const formatStars = (stars) => "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN");
  };

  const latestRatingForCard = (card) => {
    const list = assetRatingHistory[String(card)] || [];
    return list.length ? list[list.length - 1] : null;
  };

  const renderAssetRatingRows = () => {
    if (!assetRatingTableBody) return;
    const unrated = reRatingBaseRows.filter((item) => (assetRatingHistory[item.card] || []).length === 0);
    if (unrated.length === 0) {
      assetRatingTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:24px">Không có tài sản cần đánh giá.</td></tr>';
      return;
    }
    assetRatingTableBody.innerHTML = unrated
      .map(
        (item) =>
          `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
            <td>${item.name}</td>
            <td>${item.building}</td>
            <td>${item.className}</td>
            <td>
              <span>Chưa đánh giá</span>
              <button class="btn btn-primary asset-rate-now-btn" type="button" style="margin-left:8px;padding:4px 8px">Đánh giá ngay</button>
            </td>
          </tr>`
      )
      .join("");
  };

  const renderReRatingRows = () => {
    if (!reRatingTableBody) return;
    const rows = reRatingBaseRows.filter((item) => {
      const count = (assetRatingHistory[item.card] || []).length;
      return activeReRatingTab === "all" ? true : count > 0;
    });
    if (rows.length === 0) {
      reRatingTableBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;padding:24px">Không có tài sản.</td></tr>';
      renderAssetRatingRows();
      return;
    }
    reRatingTableBody.innerHTML = rows
      .map((item, idx) => {
        const latest = latestRatingForCard(item.card);
        const actionLabel = activeReRatingTab === "all" ? "Đánh giá lại" : "Xem lịch sử";
        const latestInfo = latest
          ? `<div style="font-size:12px;color:#4a4a4a;margin-top:4px">${formatStars(Number(latest.stars || 0))} • ${formatDateTime(latest.ratedAt)}</div>`
          : "";
        return `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
          <td>${idx + 1}</td>
          <td>${item.name}</td>
          <td>${item.building}</td>
          <td>${item.className}</td>
          <td><button class="btn btn-primary asset-rerating-btn" type="button" style="padding:4px 8px">${actionLabel}</button>${latestInfo}</td>
        </tr>`;
      })
      .join("");
    renderAssetRatingRows();
  };

  const renderHistoryPanel = (card) => {
    if (!reRatingHistorySection || !reRatingHistoryList || !reRatingHistoryTitle) return;
    const rows = reRatingBaseRows.find((r) => r.card === card);
    const history = assetRatingHistory[String(card)] || [];
    if (!rows || history.length === 0) {
      reRatingHistorySection.hidden = true;
      reRatingHistoryList.innerHTML = "";
      return;
    }
    reRatingHistorySection.hidden = false;
    reRatingHistoryTitle.textContent = `Lịch sử đánh giá - ${rows.name}`;
    reRatingHistoryList.innerHTML = history
      .map(
        (item, idx) => `<div style="border:1px solid #ffd4b3;border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <strong>Lần ${idx + 1} - ${formatDateTime(item.ratedAt)}</strong>
          <button class="btn btn-success rating-delete-btn" type="button" data-card="${card}" data-rate-id="${item.id}" style="padding:4px 8px">Xóa</button>
        </div>
        <div>${formatStars(Number(item.stars || 0))}</div>
        <div>Người đánh giá: ${item.reviewer || "-"}</div>
        <div>${item.content || ""}</div>
      </div>`
      )
      .join("");
  };

  const openReRatingFormByCard = (card) => {
    const row = reRatingBaseRows.find((item) => String(item.card) === String(card));
    if (!row) return;
    if (reInfoName) reInfoName.value = row.name || "";
    if (reInfoUnit) reInfoUnit.value = row.unit || "";
    if (reInfoQuantity) reInfoQuantity.value = row.quantity || "";
    if (reInfoPrice) reInfoPrice.value = row.price || "";
    if (reInfoDuration) reInfoDuration.value = row.duration || "";
    selectedReRatingCard = String(row.card);
    selectedHistoryCard = selectedReRatingCard;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    if (reRateDate) reRateDate.value = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    if (reRateReviewer) reRateReviewer.value = "";
    if (reRateStars) reRateStars.value = "";
    if (reRateNote) reRateNote.value = "";

    if (reRatingTableSection) reRatingTableSection.hidden = true;
    if (reRatingFormSection) reRatingFormSection.hidden = false;
    if (reRatingHistorySection) reRatingHistorySection.hidden = true;
  };

  const fieldMap = {
    assetNameInput: "assetName",
    assetRoomInput: "roomId",
    assetStatusInput: "status",
    assetPurchaseDateInput: "purchaseDate",
    assetFundInput: "fundSource",
    assetNoteInput: "note",
    assetCategoryInput: "itemCategory",
    assetQuantityInput: "quantity",
    assetProviderInput: "provider",
    assetCountryInput: "country",
    assetCardInput: "cardNumber",
    assetTypeInput: "assetType",
    assetManufactureYearInput: "manufactureYear",
    assetUnitPriceInput: "unitPrice",
    assetOriginalPriceInput: "originalPrice",
    assetUsageTimeInput: "usageTime",
    assetUsageYearInput: "usageYear",
  };

  const switchAssetTab = (tabName) => {
    const isList = tabName === "list";
    const isDetail = tabName === "detail";
    const isTransfer = tabName === "transfer";
    if (assetListSection) assetListSection.hidden = !isList;
    if (assetDetailSection) assetDetailSection.hidden = !isDetail;
    if (assetTransferSection) assetTransferSection.hidden = !isTransfer;
    if (assetRatingSection) assetRatingSection.hidden = true;
    if (assetReRatingSection) assetReRatingSection.hidden = true;
    assetTabList?.classList.toggle("tab-active", isList);
    assetTabDetail?.classList.toggle("tab-active", isDetail);
    assetTabTransfer?.classList.toggle("tab-active", isTransfer);
  };

  const setActiveAssetMenuItem = (modeKey) => {
    assetMenuLinks.forEach((link) => link.classList.remove("active"));
    const found = assetMenuLinks.find((link) => assetsMenuHashMap[link.textContent?.trim() || ""] === modeKey);
    if (found) found.classList.add("active");
  };

  const applyAssetMode = () => {
    const modeKey = window.location.hash.replace("#", "").trim();
    const isRatingMode = modeKey === "danh-gia-tai-san";
    const isReRatingMode = modeKey === "danh-gia-lai-tai-san";
    if (isRatingMode || isReRatingMode) {
      if (assetPageTitle) {
        assetPageTitle.setAttribute("data-i18n", isReRatingMode ? "assets.pageReRating" : "assets.pageRating");
        assetPageTitle.textContent =
          (typeof window.FmI18n?.t === "function" && window.FmI18n.t(assetPageTitle.getAttribute("data-i18n") || "")) ||
          (isReRatingMode ? "Đánh giá lại tài sản" : "Đánh giá tài sản");
      }
      if (assetTabs) assetTabs.hidden = true;
      if (assetListSection) assetListSection.hidden = true;
      if (assetDetailSection) assetDetailSection.hidden = true;
      if (assetTransferSection) assetTransferSection.hidden = true;
      if (assetRatingSection) assetRatingSection.hidden = !isRatingMode;
      if (assetReRatingSection) assetReRatingSection.hidden = !isReRatingMode;
      if (reRatingTableSection) reRatingTableSection.hidden = false;
      if (reRatingFormSection) reRatingFormSection.hidden = true;
      reRatingTabAllAssets?.classList.add("tab-active");
      reRatingTabRatedAssets?.classList.remove("tab-active");
      assetTabList?.classList.remove("tab-active");
      assetTabDetail?.classList.remove("tab-active");
      assetTabTransfer?.classList.remove("tab-active");
      setActiveAssetMenuItem(modeKey);
      return;
    }
    if (assetPageTitle) {
      assetPageTitle.setAttribute("data-i18n", "assets.pageTitle");
      assetPageTitle.textContent =
        (typeof window.FmI18n?.t === "function" && window.FmI18n.t("assets.pageTitle")) || "Quản lý tài sản";
    }
    if (assetTabs) assetTabs.hidden = false;
    setActiveAssetMenuItem("");
    switchAssetTab("list");
  };

  const fillAssetDetailForm = (row) => {
    if (!row) return;
    Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
      const input = document.getElementById(fieldId);
      if (!input) return;
      const value = row.dataset[dataKey] || "";
      input.value = value;
    });
    const selectedRoomId = row.dataset.roomId || "";
    const selectedRoomCode = row.dataset.roomCode || row.dataset.classroom || "";
    void taiDanhSachPhongChoTaiSan(selectedRoomId, selectedRoomCode);
  };

  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const toAssetPayloadFromRow = (row) => {
    const payload = {};
    Object.values(fieldMap).forEach((dataKey) => {
      payload[dataKey] = row.dataset[dataKey] || "";
    });
    payload.roomCode = row.dataset.roomCode || row.dataset.classroom || "";
    payload.classroom = row.dataset.classroom || "";
    if (row.dataset.assetId) payload.id = row.dataset.assetId;
    return payload;
  };

  const goToAssetPage = (pageName, row) => {
    if (!row) return;
    try {
      sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify(toAssetPayloadFromRow(row)));
    } catch (_) {}
    window.location.href = pageName;
  };

  const fillAssetTransferForm = (row) => {
    if (!row) return;
    const mappings = [
      ["transferCardInput", row.dataset.cardNumber || ""],
      ["transferNameInput", row.dataset.assetName || ""],
      ["transferCurrentRoomInput", row.dataset.classroom || row.dataset.building || ""],
      ["transferGiverInput", "admin"],
    ];
    mappings.forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
  };
  const taiDanhSachPhongChoTaiSan = async (selectedRoomId = "", selectedRoomCode = "") => {
    const roomSelect = document.getElementById("assetRoomInput");
    if (!(roomSelect instanceof HTMLSelectElement)) return;
    try {
      const api = window.FmApi || window.CoSoApi;
      if (!api?.layDanhSachPhong) return;
      const rooms = await api.layDanhSachPhong();
      if (!Array.isArray(rooms)) return;
      const options = rooms
        .map((room) => {
          const id = room.id != null ? String(room.id) : "";
          const roomCode = String(room.roomCode || "").trim();
          const buildingCode = String(room.buildingCode || "").trim();
          if (!id || !roomCode) return "";
          const label = `${roomCode}${buildingCode ? ` - Nhà ${buildingCode}` : ""}`;
          return `<option value="${thoatThuocTinh(id)}" data-room-code="${thoatThuocTinh(roomCode)}">${thoatThuocTinh(label)}</option>`;
        })
        .filter(Boolean)
        .join("");
      roomSelect.innerHTML = `<option value="">-- Chọn phòng --</option>${options}`;
      if (selectedRoomId && [...roomSelect.options].some((o) => o.value === selectedRoomId)) {
        roomSelect.value = selectedRoomId;
      } else if (selectedRoomCode) {
        const opt = [...roomSelect.options].find((o) => (o.getAttribute("data-room-code") || "") === selectedRoomCode);
        if (opt) roomSelect.value = opt.value;
      }
    } catch (error) {
      console.warn("[Tài sản] Không tải được danh sách phòng:", error);
    }
  };

  assetTabList?.addEventListener("click", () => switchAssetTab("list"));
  assetTabDetail?.addEventListener("click", () => {
    assetDetailForm?.reset();
    void taiTuyChonDanhMucChoFormTaiSan();
    void taiDanhSachPhongChoTaiSan();
    switchAssetTab("detail");
  });
  assetTabTransfer?.addEventListener("click", () => {
    switchAssetTab("transfer");
    ganTenNguoiBanGiaoTuPhien();
  });

  assetDetailForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const than = {};
    Object.entries(fieldMap).forEach(([fieldId, jsonKey]) => {
      const el = document.getElementById(fieldId);
      if (el) than[jsonKey] = el.value.trim();
    });
    than.roomId = than.roomId ? Number(than.roomId) : null;
    const roomSelect = document.getElementById("assetRoomInput");
    if (roomSelect instanceof HTMLSelectElement) {
      const selectedOption = roomSelect.selectedOptions?.[0];
      than.classroom = selectedOption?.getAttribute("data-room-code") || "";
    }
    if (!than.cardNumber) {
      than.cardNumber = taoMaTaiSanNoiBo();
      const hiddenCard = document.getElementById("assetCardInput");
      if (hiddenCard instanceof HTMLInputElement) hiddenCard.value = than.cardNumber;
    }
    void (async () => {
      try {
        if (window.CoSoApi?.taoTaiSan) await window.CoSoApi.taoTaiSan(than);
      } catch (e) {
        window.alert("Gửi thêm tài sản lên máy chủ thất bại.");
      }
      window.alert("Thêm tài sản thành công!");
      assetDetailForm.reset();
      switchAssetTab("list");
      await taiBangTaiSanTuApi();
    })();
  });

  const setAssetPillVisual = (pill, active) => {
    pill.classList.toggle("on", active);
    pill.setAttribute("aria-pressed", active ? "true" : "false");
    pill.dataset.assetActive = active ? "1" : "0";
    pill.title = active ? "Đang sử dụng — bấm để bảo trì" : "Đang bảo trì — bấm để đưa vào sử dụng";
  };

  const capNhatTrangThaiTaiSan = async (assetId, active) => {
    const api = window.FmApi || window.CoSoApi;
    if (!api?.capNhatTaiSan) throw new Error("API cập nhật tài sản chưa sẵn sàng");
    const status = active ? "IN_USE" : "MAINTENANCE";
    return api.capNhatTaiSan(assetId, { status });
  };

  assetTableBody?.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const pill = target.closest("button.asset-status-pill");
      if (pill && assetTableBody.contains(pill)) {
        event.preventDefault();
        event.stopPropagation();
        const row = pill.closest("tr");
        if (!row) return;
        const assetId = row.dataset.assetId || "";
        if (!assetId) return;

        const wasActive = pill.classList.contains("on");
        const willBeActive = !wasActive;
        setAssetPillVisual(pill, willBeActive);
        pill.disabled = true;

        void (async () => {
          try {
            await capNhatTrangThaiTaiSan(assetId, willBeActive);
            row.dataset.status = willBeActive ? "IN_USE" : "MAINTENANCE";
          } catch (e) {
            setAssetPillVisual(pill, wasActive);
            window.alert(
              willBeActive
                ? "Không thể đưa tài sản vào sử dụng. Kiểm tra backend (cổng 8080)."
                : "Không thể chuyển sang bảo trì. Kiểm tra backend (cổng 8080)."
            );
          } finally {
            pill.disabled = false;
          }
        })();
        return;
      }
    },
    true
  );

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const viewBtn = target.closest(".asset-view-btn");
    if (!viewBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-view.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const updateBtn = target.closest(".asset-update-btn");
    if (!updateBtn) return;
    const row = target.closest("tr");
    goToAssetPage("asset-update.html", row);
  });

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const transferBtn = target.closest(".asset-transfer-btn");
    if (!transferBtn) return;
    const row = transferBtn.closest("tr");
    if (!row) return;
    fillAssetTransferForm(row);
    switchAssetTab("transfer");
  });

  document.getElementById("assetTransferForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    const formData = new FormData(form);
    const sourceRoom = String(formData.get("sourceRoom") || "").trim();
    const targetRoom = String(formData.get("targetRoom") || "").trim();
    const transferQuantity = Number(formData.get("transferQuantity") || 0);
    const giverName = String(formData.get("giverName") || "").trim();
    const receiverName = String(formData.get("receiverName") || "").trim();
    const receivedDate = String(formData.get("receivedDate") || "").trim();
    const note = String(formData.get("note") || "").trim();

    if (!targetRoom || !transferQuantity || !receivedDate || !giverName || !receiverName) {
      window.alert("Vui lòng nhập đủ thông tin điều chuyển.");
      return;
    }
    if (sourceRoom && sourceRoom === targetRoom) {
      window.alert("Phòng đích phải khác phòng hiện tại.");
      return;
    }

    const activeRow = assetTableBody?.querySelector(
      `tr[data-card-number="${CSS.escape(String(formData.get("cardNumber") || ""))}"]`
    );
    if (!(activeRow instanceof HTMLTableRowElement)) {
      window.alert("Không tìm thấy tài sản để điều chuyển.");
      return;
    }
    const currentQuantity = Number(activeRow.dataset.quantity || 0);
    if (transferQuantity > currentQuantity) {
      window.alert("Số lượng điều chuyển không được vượt quá số lượng hiện có.");
      return;
    }

    void (async () => {
      try {
        const api = window.FmApi || window.CoSoApi;
        const assetId = activeRow.dataset.assetId || "";
        if (!assetId || !api?.taoPhieuDieuChuyenTaiSan) {
          throw new Error("Thiếu API điều chuyển tài sản.");
        }
        await api.taoPhieuDieuChuyenTaiSan(assetId, {
          targetRoomCode: targetRoom,
          transferQuantity,
          transferDate: receivedDate,
          giverName,
          receiverName,
          note,
        });
        window.alert("Điều chuyển tài sản thành công.");
        form.reset();
        await taiBangTaiSanTuApi();
        switchAssetTab("list");
      } catch (error) {
        window.alert(`Điều chuyển thất bại: ${error?.message || error}`);
      }
    })();
  });

  window.addEventListener("hashchange", applyAssetMode);

  let refreshReRatingTable = () => {};
  const switchReRatingTab = (tabName) => {
    activeReRatingTab = tabName;
    if (reRatingTableSection) reRatingTableSection.hidden = false;
    if (reRatingFormSection) reRatingFormSection.hidden = true;
    reRatingTabAllAssets?.classList.toggle("tab-active", tabName === "all");
    reRatingTabRatedAssets?.classList.toggle("tab-active", tabName === "rated");
    selectedHistoryCard = "";
    if (reRatingHistorySection) reRatingHistorySection.hidden = true;
    renderReRatingRows();
    refreshReRatingTable();
  };

  reRatingTabAllAssets?.addEventListener("click", () => switchReRatingTab("all"));
  reRatingTabRatedAssets?.addEventListener("click", () => switchReRatingTab("rated"));

  reRatingTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const rerateBtn = target.closest(".asset-rerating-btn");
    if (!rerateBtn) return;
    const row = rerateBtn.closest("tr");
    if (!row) return;

    selectedReRatingCard = row.dataset.card || "";
    selectedHistoryCard = selectedReRatingCard;

    if (activeReRatingTab === "rated") {
      renderHistoryPanel(selectedHistoryCard);
      return;
    }
    openReRatingFormByCard(selectedReRatingCard);
  });

  assetRatingTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const rateBtn = target.closest(".asset-rate-now-btn");
    if (!rateBtn) return;
    const row = rateBtn.closest("tr");
    const card = row?.getAttribute("data-card") || "";
    if (!card) return;
    window.location.hash = "danh-gia-lai-tai-san";
    applyAssetMode();
    switchReRatingTab("all");
    openReRatingFormByCard(card);
  });

  reRateCancelBtn?.addEventListener("click", () => {
    if (reRatingTableSection) reRatingTableSection.hidden = false;
    if (reRatingFormSection) reRatingFormSection.hidden = true;
  });

  reRateSaveBtn?.addEventListener("click", () => {
    if (!selectedReRatingCard) {
      window.alert("Vui lòng chọn tài sản cần đánh giá lại.");
      return;
    }
    const reviewer = reRateReviewer?.value.trim() || "";
    const stars = Number(reRateStars?.value || 0);
    const ratedAt = reRateDate?.value || "";
    const content = reRateNote?.value.trim() || "";
    if (!reviewer || !stars || !ratedAt || !content) {
      window.alert("Vui lòng nhập đầy đủ người đánh giá, số sao, thời gian và nội dung đánh giá.");
      return;
    }
    const key = String(selectedReRatingCard);
    if (!Array.isArray(assetRatingHistory[key])) assetRatingHistory[key] = [];
    assetRatingHistory[key].push({
      id: `rate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reviewer,
      stars,
      ratedAt,
      content,
    });
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(key);
    window.alert("Đã lưu đánh giá lại tài sản.");
    selectedReRatingCard = "";
    switchReRatingTab("rated");
  });

  reRatingHistoryList?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const delBtn = target.closest(".rating-delete-btn");
    if (!delBtn) return;
    const card = delBtn.getAttribute("data-card") || "";
    const rateId = delBtn.getAttribute("data-rate-id") || "";
    if (!card || !rateId) return;
    const list = Array.isArray(assetRatingHistory[card]) ? assetRatingHistory[card] : [];
    assetRatingHistory[card] = list.filter((item) => item.id !== rateId);
    if (assetRatingHistory[card].length === 0) delete assetRatingHistory[card];
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(card);
  });

  refreshAssetTable = setupTableControls({
    tableBody: assetTableBody,
    searchInput: document.getElementById("assetListSearchInput"),
    pageSizeSelect: document.getElementById("assetListPageSizeSelect"),
  });
  void taiTuyChonDanhMucChoFormTaiSan();
  ganTenNguoiBanGiaoTuPhien();
  void taiDanhSachPhongChoTaiSan();
  void taiBangTaiSanTuApi();
  renderAssetRatingRows();
  setupTableControls({
    tableBody: assetRatingTableBody,
    searchInput: document.getElementById("assetRatingSearchInput"),
    pageSizeSelect: document.getElementById("assetRatingPageSizeSelect"),
  });
  renderReRatingRows();
  refreshReRatingTable = setupTableControls({
    tableBody: reRatingTableBody,
    searchInput: document.getElementById("assetReRatingSearchInput"),
    pageSizeSelect: document.getElementById("assetReRatingPageSizeSelect"),
  });
  renderReRatingRows();

  document.getElementById("assetsExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const iso = new Date().toISOString();
    if (assetListSection && !assetListSection.hidden && assetTableBody) {
      Fm.download(`assets-list-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(assetTableBody),
      });
      return;
    }
    if (assetDetailSection && !assetDetailSection.hidden && assetDetailForm) {
      Fm.download(`asset-detail-form-${stamp}.json`, {
        exportedAt: iso,
        form: Fm.formToPlainObject(assetDetailForm),
      });
      return;
    }
    if (assetTransferSection && !assetTransferSection.hidden) {
      const tf = document.getElementById("assetTransferForm");
      if (tf) {
        Fm.download(`asset-transfer-${stamp}.json`, {
          exportedAt: iso,
          form: Fm.formToPlainObject(tf),
        });
        return;
      }
    }
    if (assetRatingSection && !assetRatingSection.hidden && assetRatingTableBody) {
      Fm.download(`assets-rating-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(assetRatingTableBody),
      });
      return;
    }
    if (
      assetReRatingSection &&
      !assetReRatingSection.hidden &&
      reRatingTableSection &&
      !reRatingTableSection.hidden &&
      reRatingTableBody
    ) {
      Fm.download(`assets-rerating-table-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(reRatingTableBody),
      });
      return;
    }
    if (assetReRatingSection && !assetReRatingSection.hidden && reRatingFormSection && !reRatingFormSection.hidden) {
      const blocks = Array.from(document.querySelectorAll("#reRatingFormSection form"));
      const merged = {};
      blocks.forEach((f) => Object.assign(merged, Fm.formToPlainObject(f)));
      Fm.download(`assets-rerating-forms-${stamp}.json`, { exportedAt: iso, form: merged });
    }
  });

  applyAssetMode();
}

if (duongDanLaTrang("asset-view.html") || duongDanLaTrang("asset-update.html")) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const ganTuyChonCode = (id, options, placeholder) => {
    const select = document.getElementById(id);
    if (!(select instanceof HTMLSelectElement)) return;
    const htmlOptions = options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("");
    select.innerHTML = `${placeholder ? `<option value="">${esc(placeholder)}</option>` : ""}${htmlOptions}`;
  };
  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const payloadRaw = sessionStorage.getItem(ASSET_SELECTED_KEY);
  let payload = null;
  try {
    payload = payloadRaw ? JSON.parse(payloadRaw) : null;
  } catch {
    payload = null;
  }
  if (!payload) {
    window.location.replace("assets.html");
  } else {
    const fieldMap = {
      assetNameInput: "assetName",
      assetRoomInput: "roomId",
      assetStatusInput: "status",
      assetPurchaseDateInput: "purchaseDate",
      assetFundInput: "fundSource",
      assetNoteInput: "note",
      assetCategoryInput: "itemCategory",
      assetQuantityInput: "quantity",
      assetProviderInput: "provider",
      assetCountryInput: "country",
      assetCardInput: "cardNumber",
      assetTypeInput: "assetType",
      assetManufactureYearInput: "manufactureYear",
      assetUnitPriceInput: "unitPrice",
      assetOriginalPriceInput: "originalPrice",
      assetUsageTimeInput: "usageTime",
      assetUsageYearInput: "usageYear",
    };

    const tuDoiTuongTaiSan = (a) =>
      a && typeof a === "object"
        ? {
            id: a.id != null ? String(a.id) : payload.id != null ? String(payload.id) : "",
            assetName: a.assetName || a.asset_name || "",
            provider: a.provider || "",
            country: a.country || "",
            cardNumber: a.cardNumber || a.card_number || "",
            roomId: a.roomId != null ? String(a.roomId) : "",
            roomCode: a.roomCode || a.room_code || "",
            classroom: a.classroom || "",
            assetType: a.assetType || a.asset_type || "",
            itemCategory: a.itemCategory || a.item_category || "",
            manufactureYear: a.manufactureYear != null ? String(a.manufactureYear) : "",
            unitPrice: a.unitPrice != null ? String(a.unitPrice) : "",
            quantity: a.quantity != null ? String(a.quantity) : "",
            originalPrice: a.originalPrice != null ? String(a.originalPrice) : "",
            fundSource: a.fundSource || a.fund_source || "",
            usageTime: a.usageTime != null ? String(a.usageTime) : "",
            purchaseDate: a.purchaseDate || a.purchase_date || "",
            usageYear: a.usageYear != null ? String(a.usageYear) : "",
            note: a.note || "",
            status: a.status || "IN_USE",
          }
        : null;

    const taiDanhSachPhong = async (selectedRoomId = "", selectedRoomCode = "") => {
      const roomSelect = document.getElementById("assetRoomInput");
      if (!(roomSelect instanceof HTMLSelectElement)) return;
      try {
        const api = window.FmApi || window.CoSoApi;
        if (!api?.layDanhSachPhong) return;
        const rooms = await api.layDanhSachPhong();
        if (!Array.isArray(rooms)) return;
        const options = rooms
          .map((room) => {
            const id = room.id != null ? String(room.id) : "";
            const roomCode = String(room.roomCode || "").trim();
            const buildingCode = String(room.buildingCode || "").trim();
            if (!id || !roomCode) return "";
            const label = `${roomCode}${buildingCode ? ` - Nhà ${buildingCode}` : ""}`;
            return `<option value="${esc(id)}" data-room-code="${esc(roomCode)}">${esc(label)}</option>`;
          })
          .filter(Boolean)
          .join("");
        roomSelect.innerHTML = `<option value="">-- Chọn phòng --</option>${options}`;
        if (selectedRoomId && [...roomSelect.options].some((o) => o.value === selectedRoomId)) {
          roomSelect.value = selectedRoomId;
        } else if (selectedRoomCode) {
          const opt = [...roomSelect.options].find((o) => (o.getAttribute("data-room-code") || "") === selectedRoomCode);
          if (opt) roomSelect.value = opt.value;
        }
      } catch (e) {
        console.warn("[Tài sản] Không tải được danh sách phòng:", e);
      }
    };

    const taiTuyChonDanhMucChoForm = async () => {
      const api = window.FmApi || window.CoSoApi;
      if (!api?.layDanhSachDanhMuc) return;
      try {
        const [assets, funds] = await Promise.all([
          api.layDanhSachDanhMuc({ type: "ASSET" }),
          api.layDanhSachDanhMuc({ type: "FUND_SOURCE" }),
        ]);
        const toOpts = (list) =>
          (Array.isArray(list) ? list : []).map((c) => ({
            value: String(c.code || c.categoryCode || ""),
            label: String(c.name || c.categoryName || c.code || ""),
          }));
        ganTuyChonCode("assetCategoryInput", toOpts(assets), "-- Chọn danh mục --");
        ganTuyChonCode("assetFundInput", toOpts(funds), "-- Chọn nguồn kinh phí --");
      } catch (err) {
        console.warn("[Tài sản] Không tải danh mục cho form:", err);
      }
    };

    const applyAssetDetailFields = (p) => {
      Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const v = p[dataKey];
        input.value = v != null && v !== "" ? String(v) : "";
      });
      void taiDanhSachPhong(String(p.roomId || ""), String(p.roomCode || p.classroom || ""));
    };
    void taiTuyChonDanhMucChoForm().then(() => applyAssetDetailFields(payload));

    const idTaiSan = payload.id != null ? String(payload.id) : "";
    if (idTaiSan && window.CoSoApi?.layTaiSanTheoId) {
      void (async () => {
        try {
          const raw = await window.CoSoApi.layTaiSanTheoId(idTaiSan);
          const p2 = tuDoiTuongTaiSan(raw);
          if (p2) {
            applyAssetDetailFields({ ...payload, ...p2 });
            try {
              sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify({ ...payload, ...p2 }));
            } catch (_) {}
          }
        } catch (e) {
          console.warn("[Tài sản] GET theo id:", e);
        }
      })();
    }

    const isView = duongDanLaTrang("asset-view.html");
    const form = document.getElementById("assetViewForm") || document.getElementById("assetUpdateForm");
    const backBtn = document.getElementById("assetViewBackBtn") || document.getElementById("assetUpdateBackBtn");

    if (isView && form) {
      const fields = form.querySelectorAll("input, select, textarea");
      fields.forEach((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          field.readOnly = true;
        } else if (field instanceof HTMLSelectElement) {
          field.disabled = true;
        }
      });
    }

    backBtn?.addEventListener("click", () => {
      window.location.href = "assets.html";
    });

    const updateForm = document.getElementById("assetUpdateForm");
    updateForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      let payloadSubmit = payload;
      try {
        const raw = sessionStorage.getItem(ASSET_SELECTED_KEY);
        if (raw) payloadSubmit = JSON.parse(raw);
      } catch (_) {}
      const maTaiSan =
        payloadSubmit.id != null ? String(payloadSubmit.id) : payloadSubmit.cardNumber || "";
      const than = {};
      Object.entries(fieldMap).forEach(([fieldId, jsonKey]) => {
        const el = document.getElementById(fieldId);
        if (el) than[jsonKey] = el.value.trim();
      });
      than.roomId = than.roomId ? Number(than.roomId) : null;
      const roomSelect = document.getElementById("assetRoomInput");
      if (roomSelect instanceof HTMLSelectElement) {
        const selectedOption = roomSelect.selectedOptions?.[0];
        than.classroom = selectedOption?.getAttribute("data-room-code") || "";
      }
      void (async () => {
        try {
          if (maTaiSan && window.CoSoApi?.capNhatTaiSan) await window.CoSoApi.capNhatTaiSan(maTaiSan, than);
        } catch (e) {
          window.alert("Cập nhật trên máy chủ thất bại.");
        }
        window.alert("Cập nhật tài sản thành công!");
        window.location.href = "assets.html";
      })();
    });
  }
}


if (duongDanLaTrang("statistics.html")) {
  const statisticsKpiTotalQty = document.getElementById("statisticsKpiTotalQty");
  const statisticsKpiInUse = document.getElementById("statisticsKpiInUse");
  const statisticsKpiLiquidated = document.getElementById("statisticsKpiLiquidated");
  const statisticsSummaryBody = document.getElementById("statisticsSummaryBody");
  const statisticsStatusMessage = document.getElementById("statisticsStatusMessage");

  const statT = (key, fallback) => {
    const v = window.FmI18n?.t?.(key);
    if (!v || v === key) return fallback;
    return String(v).replace(/<[^>]+>/g, "");
  };

  const mapStatusCode = (raw) => String(raw || "IN_USE").trim().toUpperCase();

  const buildingLabel = (a) => {
    const b = a.building || a.buildingName || a.building_code || "";
    const s = String(b).trim();
    return s || statT("statistics.buildingUnknown", "Khác");
  };

  const chuanHoaMaToa = (raw) =>
    String(raw || "")
      .trim()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toUpperCase();

  /** Loại KHAC và tài sản không xác định tòa khỏi thống kê. */
  const isExcludedBuildingKey = (buildingKey) => {
    const s = String(buildingKey || "").trim();
    if (!s) return true;
    if (chuanHoaMaToa(s) === "KHAC") return true;
    const unknown = statT("statistics.buildingUnknown", "Khác");
    if (s === unknown || /^kh[aá]c$/i.test(s)) return true;
    return false;
  };

  const layHangThongKe = () => allRows.filter((r) => !isExcludedBuildingKey(r.buildingKey));

  const isInUseStatus = (code) => code === "IN_USE" || code === "ACTIVE";
  const isLiquidatedStatus = (code) => code === "LIQUIDATED";

  const soLuongTaiSan = (a) => {
    const n = Number(a.quantity);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  const chuanHoaTaiSan = (list) =>
    (Array.isArray(list) ? list : []).map((a) => {
      const statusCode = mapStatusCode(a.status);
      return {
        buildingKey: buildingLabel(a),
        statusCode,
        quantity: soLuongTaiSan(a),
      };
    });

  let allRows = [];
  let buildingChart = null;
  let statusChart = null;

  const statisticsChartBuilding = document.getElementById("statisticsChartBuilding");
  const statisticsChartStatus = document.getElementById("statisticsChartStatus");
  const statisticsChartBuildingEmpty = document.getElementById("statisticsChartBuildingEmpty");
  const statisticsChartStatusEmpty = document.getElementById("statisticsChartStatusEmpty");
  const statisticsSummaryFoot = document.getElementById("statisticsSummaryFoot");
  const statisticsTotalQty = document.getElementById("statisticsTotalQty");
  const statisticsTotalInUse = document.getElementById("statisticsTotalInUse");

  const STAT_CHART_PRIMARY = "#ff6600";
  const STAT_CHART_IN_USE = "#22a06b";
  const STAT_CHART_PENDING = "#2684ff";
  const STAT_CHART_LIQUIDATED = "#e34935";

  const destroyCharts = () => {
    buildingChart?.destroy();
    statusChart?.destroy();
    buildingChart = null;
    statusChart = null;
  };

  const barValuePlugin = {
    id: "statisticsBarValues",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta?.data?.length) return;
      ctx.save();
      ctx.fillStyle = "#5c3d1e";
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      meta.data.forEach((bar, index) => {
        const value = chart.data.datasets[0].data[index];
        if (value == null) return;
        ctx.fillText(String(value), bar.x, bar.y - 6);
      });
      ctx.restore();
    },
  };

  const donutLegendLabels = (chart, labels, values) => {
    const total = values.reduce((sum, v) => sum + v, 0);
    const { data } = chart;
    return labels.map((label, i) => {
      const value = values[i];
      const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
      const box = data.datasets[0].backgroundColor[i];
      return {
        text: `${label} (${value}) — ${pct}%`,
        fillStyle: box,
        strokeStyle: box,
        lineWidth: 0,
        hidden: false,
        index: i,
      };
    });
  };

  const setChartEmpty = (canvas, emptyEl, isEmpty) => {
    if (emptyEl) {
      emptyEl.classList.toggle("is-visible", isEmpty);
      emptyEl.hidden = isEmpty;
      if (isEmpty) {
        emptyEl.textContent = statT("statistics.emptySummary", "Không có dữ liệu.");
      }
    }
    if (canvas) {
      canvas.hidden = false;
      canvas.style.visibility = isEmpty ? "hidden" : "visible";
    }
  };

  const renderBuildingChart = (groups) => {
    if (typeof Chart === "undefined" || !statisticsChartBuilding) return;
    buildingChart?.destroy();
    buildingChart = null;
    if (!groups.length) {
      setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, true);
      return;
    }
    setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, false);
    const labels = groups.map((g) => g.building);
    const values = groups.map((g) => g.quantity);
    buildingChart = new Chart(statisticsChartBuilding, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: STAT_CHART_PRIMARY,
            borderRadius: 4,
            maxBarThickness: 48,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y} ${statT("statistics.unitPieces", "(cái)")}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#5c3d1e", font: { weight: "600" } },
          },
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: "rgba(0,0,0,0.06)" },
          },
        },
      },
      plugins: [barValuePlugin],
    });
  };

  const gopTheoTrangThai = (rows) => {
    let inUseQty = 0;
    let pendingQty = 0;
    let liquidatedQty = 0;
    for (const r of rows) {
      if (isLiquidatedStatus(r.statusCode)) liquidatedQty += r.quantity;
      else if (isInUseStatus(r.statusCode)) inUseQty += r.quantity;
      else pendingQty += r.quantity;
    }
    return { inUseQty, pendingQty, liquidatedQty };
  };

  const renderStatusChart = (rows) => {
    if (typeof Chart === "undefined" || !statisticsChartStatus) return;
    statusChart?.destroy();
    statusChart = null;
    const { inUseQty, pendingQty, liquidatedQty } = gopTheoTrangThai(rows);
    const values = [inUseQty, pendingQty, liquidatedQty];
    const total = values.reduce((a, b) => a + b, 0);
    if (!total) {
      setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, true);
      return;
    }
    setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, false);
    const labels = [
      statT("statistics.statusInUse", "Đang sử dụng"),
      statT("statistics.statusPending", "Chờ xử lý"),
      statT("statistics.statusLiquidated", "Thanh lý"),
    ];
    const colors = [STAT_CHART_IN_USE, STAT_CHART_PENDING, STAT_CHART_LIQUIDATED];
    statusChart = new Chart(statisticsChartStatus, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "58%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 14,
              padding: 14,
              color: "#333",
              font: { size: 12 },
              generateLabels: (chart) => donutLegendLabels(chart, labels, values),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed;
                const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
                return `${ctx.label}: ${v} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  };

  const setStatusMessage = (text, isError = false) => {
    if (!statisticsStatusMessage) return;
    if (!text) {
      statisticsStatusMessage.hidden = true;
      statisticsStatusMessage.textContent = "";
      statisticsStatusMessage.classList.remove("is-error");
      return;
    }
    statisticsStatusMessage.hidden = false;
    statisticsStatusMessage.textContent = text;
    statisticsStatusMessage.classList.toggle("is-error", isError);
  };

  const tinhKpi = (rows) => {
    let totalQty = 0;
    let inUseQty = 0;
    let liquidatedQty = 0;
    for (const r of rows) {
      totalQty += r.quantity;
      if (isInUseStatus(r.statusCode)) inUseQty += r.quantity;
      if (isLiquidatedStatus(r.statusCode)) liquidatedQty += r.quantity;
    }
    return { totalQty, inUseQty, liquidatedQty };
  };

  const gopTheoToa = (rows) => {
    const map = new Map();
    for (const r of rows) {
      const cur = map.get(r.buildingKey) || { quantity: 0, inUseQty: 0 };
      cur.quantity += r.quantity;
      if (isInUseStatus(r.statusCode)) cur.inUseQty += r.quantity;
      map.set(r.buildingKey, cur);
    }
    return Array.from(map.entries())
      .map(([building, agg]) => ({ building, ...agg }))
      .sort((a, b) => a.building.localeCompare(b.building, "vi"));
  };

  const render = () => {
    const rows = layHangThongKe();
    const kpi = tinhKpi(rows);
    const groups = gopTheoToa(rows);

    if (statisticsKpiTotalQty) statisticsKpiTotalQty.textContent = String(kpi.totalQty);
    if (statisticsKpiInUse) statisticsKpiInUse.textContent = String(kpi.inUseQty);
    if (statisticsKpiLiquidated) statisticsKpiLiquidated.textContent = String(kpi.liquidatedQty);

    renderBuildingChart(groups);
    renderStatusChart(rows);

    if (!statisticsSummaryBody) return;
    if (!groups.length) {
      statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">${statT("statistics.emptySummary", "Không có dữ liệu.")}</td></tr>`;
      if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = true;
      return;
    }
    const escHtml = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    statisticsSummaryBody.innerHTML = groups
      .map(
        (g) =>
          `<tr><td>${escHtml(g.building)}</td><td>${g.quantity}</td><td>${g.inUseQty}</td></tr>`
      )
      .join("");
    if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = false;
    if (statisticsTotalQty) statisticsTotalQty.textContent = String(kpi.totalQty);
    if (statisticsTotalInUse) statisticsTotalInUse.textContent = String(kpi.inUseQty);
    window.FmI18n?.apply?.(statisticsSummaryFoot || document);
  };

  const taiThongKe = async () => {
    setStatusMessage("");
    destroyCharts();
    setChartEmpty(statisticsChartBuilding, statisticsChartBuildingEmpty, true);
    setChartEmpty(statisticsChartStatus, statisticsChartStatusEmpty, true);
    if (statisticsSummaryBody) {
      statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">${statT("statistics.loading", "Đang tải…")}</td></tr>`;
    }
    if (statisticsSummaryFoot) statisticsSummaryFoot.hidden = true;
    const api = window.FmApi || window.CoSoApi;
    if (!api?.layDanhSachTaiSan) {
      setStatusMessage(statT("statistics.loadError", "Không tải được dữ liệu tài sản."), true);
      return;
    }
    try {
      const list = await api.layDanhSachTaiSan();
      allRows = chuanHoaTaiSan(list);
      render();
    } catch (err) {
      console.warn("[Thống kê] Lỗi API:", err);
      setStatusMessage(statT("statistics.loadError", "Không tải được dữ liệu tài sản."), true);
      if (statisticsSummaryBody) {
        statisticsSummaryBody.innerHTML = `<tr><td colspan="3" class="statistics-placeholder">—</td></tr>`;
      }
    }
  };

  void taiThongKe();

  window.addEventListener("fm-i18n-applied", () => {
    window.FmI18n?.apply?.(document.querySelector("main.content") || document);
    render();
  });
}

if (duongDanLaTrang("room-detail.html")) {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const idPhongTuUrl = params.get("id") || "";
  const filterDate = params.get("date")?.trim() || "";
  const filterShift = params.get("shift")?.trim() || "";
  const filterBuilding = params.get("building")?.trim() || "";

  const nhanCaChiTiet = (shift) => {
    const s = String(shift || "").toUpperCase();
    if (s === "MORNING") return "Sáng";
    if (s === "AFTERNOON") return "Chiều";
    if (s === "EVENING") return "Tối";
    return shift || "";
  };

  const hienThiBoLocLich = () => {
    const el = document.getElementById("roomScheduleContext");
    if (!el) return;
    if (!filterDate && !filterShift) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    const parts = [];
    if (filterShift) parts.push(`Ca ${nhanCaChiTiet(filterShift)}`);
    if (filterDate) {
      const [y, m, d] = filterDate.split("-");
      parts.push(d && m && y ? `${d}/${m}/${y}` : filterDate);
    }
    el.hidden = false;
    el.textContent = `Lịch theo bộ lọc: ${parts.join(" · ")}`;
  };

  const chuoiCoNghia = (v) => {
    const s = v != null ? String(v).trim() : "";
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower === "trống" || lower === "trong" || s === "--" || s === "-") return "";
    return s;
  };

  const apDungLopGvTuLich = (profile, rawRow) => {
    const next = { ...profile };
    if (!filterDate && !filterShift) {
      return { profile: next, showTeacherClass: true };
    }
    const lopRaw = chuoiCoNghia(
      rawRow?.classStudying ||
        rawRow?.class_studying ||
        rawRow?.classUsing ||
        rawRow?.class_using ||
        "",
    );
    const gvRaw = chuoiCoNghia(
      rawRow?.teacherName || rawRow?.teacher_name || rawRow?.teacher || "",
    );
    if (!lopRaw && !gvRaw) {
      next.classStudying = "";
      next.classUsing = "";
      next.className = "";
      next.teacher = "";
      return { profile: next, showTeacherClass: false };
    }
    if (lopRaw) next.classStudying = lopRaw;
    if (gvRaw) next.teacher = gvRaw;
    return { profile: next, showTeacherClass: true };
  };

  const chonSoLuongThietBi = (tuTongHop, tuPhong) => {
    const n = Number(tuTongHop);
    if (tuTongHop != null && tuTongHop !== "" && !Number.isNaN(n) && n > 0) return String(n);
    return tuPhong != null && tuPhong !== "" ? String(tuPhong) : "";
  };

  const datAnHienOLich = (show) => {
    ["roomTeacher", "roomClass"].forEach((id) => {
      const el = document.getElementById(id);
      const box = el?.closest(".info-box");
      if (box) box.hidden = !show;
    });
  };

  const applyRoomDetail = (profile, summary = null, { showTeacherClass = true } = {}) => {
    const roomCodeLabel = document.getElementById("roomCodeLabel");
    if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
    hienThiBoLocLich();
    datAnHienOLich(showTeacherClass);
    const mapped = summary || {};
    const mappings = [
      ["roomTeacher", profile.teacher],
      ["roomClass", profile.classStudying || profile.classUsing || profile.className],
      ["roomDesks", chonSoLuongThietBi(mapped.desks, profile.desks)],
      ["roomChairs", chonSoLuongThietBi(mapped.chairs, profile.chairs)],
      ["roomSpeakers", chonSoLuongThietBi(mapped.speakers, profile.speakers)],
      ["roomAirConditioner", chonSoLuongThietBi(mapped.airConditioners, profile.airConditioner)],
      ["roomMicrophone", chonSoLuongThietBi(mapped.microphones, profile.microphone)],
      ["roomGlassDoor", profile.glassDoor],
      ["roomCeilingFan", profile.ceilingFan],
      ["roomCurtain", profile.curtain],
    ];
    mappings.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value != null ? String(value) : "";
    });
  };
  const thamSoLichPhong = () => {
    if (!filterDate && !filterShift) return null;
    const p = {};
    if (filterDate) p.date = filterDate;
    if (filterShift) p.shift = filterShift;
    p.semester = xacDinhHocKyTuNgay(filterDate);
    return p;
  };

  void (async () => {
    try {
      const api = window.CoSoApi;
      if (!api) {
        applyRoomDetail(getRoomProfile(roomCode));
        return;
      }
      const lichParams = thamSoLichPhong();
      let raw = null;
      if (idPhongTuUrl && typeof api.layPhongTheoId === "function") {
        raw = await api.layPhongTheoId(idPhongTuUrl, lichParams || undefined);
      } else if (typeof api.layDanhSachPhong === "function") {
        const thamSoDs = lichParams ? { ...lichParams } : {};
        if (filterBuilding) thamSoDs.building = filterBuilding;
        const ds = await api.layDanhSachPhong(Object.keys(thamSoDs).length ? thamSoDs : undefined);
        raw = ds.find((r) => String(r.roomCode || r.room_code || "").trim() === roomCode);
      }

      let fromApi = mapRoomApiToProfile(raw);
      const lichRow = filterDate || filterShift ? raw : raw;
      const { profile: profileLich, showTeacherClass } = apDungLopGvTuLich(
        fromApi || getRoomProfile(roomCode),
        lichRow,
      );
      let summary = null;
      try {
        const idPhong = idPhongTuUrl || raw?.id || "";
        if (idPhong && typeof api.layTongHopTaiSanTheoPhong === "function") {
          summary = await api.layTongHopTaiSanTheoPhong(idPhong);
        }
      } catch (e) {
        console.warn("[Phòng] Tổng hợp tài sản theo phòng API:", e);
      }
      applyRoomDetail(profileLich, summary, { showTeacherClass });
    } catch (e) {
      console.warn("[Phòng] Chi tiết API:", e);
      applyRoomDetail(getRoomProfile(roomCode));
    }
  })();
}

if (duongDanLaTrang("room-edit.html")) {
  const form = document.getElementById("roomEditForm");
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const idPhongTuUrl = params.get("id") || "";
  const profile = getRoomProfile(roomCode);
  const buildingParam = params.get("building") || profile.buildingCode || "";
  const roomCodeLabel = document.getElementById("roomEditCodeLabel");
  if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
  const roomCodeReadonly = document.getElementById("roomCodeReadonly");
  if (roomCodeReadonly) roomCodeReadonly.value = roomCode;
  if (buildingParam) {
    const buildingHint = document.getElementById("roomEditBuildingHint");
    const roomEditBuildingLabel = document.getElementById("roomEditBuildingLabel");
    if (buildingHint) buildingHint.hidden = false;
    if (roomEditBuildingLabel) roomEditBuildingLabel.textContent = `Tòa nhà ${buildingParam}`;
  }
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
  // Khóa chỉnh tay số lượng thiết bị: dữ liệu được tổng hợp từ bảng assets.
  [
    "roomDesksInput",
    "roomChairsInput",
    "roomSpeakersInput",
    "roomAirConditionerInput",
    "roomMicrophoneInput",
    "roomCeilingFanInput",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el instanceof HTMLInputElement) {
      el.readOnly = true;
      el.title = "Được tổng hợp tự động từ Quản lý tài sản";
    }
  });
  const ensureK65OrLegacy = (id, v) => {
    const s = document.getElementById(id);
    if (!s || v == null || v === "") return;
    if ([...s.options].some((o) => o.value === v)) {
      s.value = v;
      return;
    }
    s.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
    s.value = v;
  };
  const applyRoomEditForm = (p) => {
    const mappings = [
      ["roomFloorInput", p.floor],
      ["roomClassUsingInput", p.className],
      ["roomClassInput", p.classStudying || p.className],
      ["roomTeacherInput", p.teacher],
      ["roomDesksInput", p.desks],
      ["roomChairsInput", p.chairs],
      ["roomSpeakersInput", p.speakers],
      ["roomAirConditionerInput", p.airConditioner],
      ["roomMicrophoneInput", p.microphone],
      ["roomCeilingFanInput", p.ceilingFan],
      ["roomCapacityInput", p.capacity],
    ];
    mappings.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value != null ? String(value) : "";
    });
    ensureK65OrLegacy("roomClassUsingInput", p.className);
    ensureK65OrLegacy("roomClassInput", p.classStudying || p.className);
    setRadioValueByName("roomStatus", p.status);
    setRadioValueByName("roomGlassDoor", p.glassDoor);
    setRadioValueByName("roomCurtain", p.curtain);
  };
  applyRoomEditForm(profile);
  void (async () => {
    try {
      const api = window.CoSoApi;
      if (!api) return;
      let raw = null;
      if (idPhongTuUrl && typeof api.layPhongTheoId === "function") {
        raw = await api.layPhongTheoId(idPhongTuUrl);
      } else if (typeof api.layDanhSachPhong === "function") {
        const ds = await api.layDanhSachPhong();
        raw = ds.find((r) => String(r.roomCode || r.room_code || "").trim() === roomCode);
      }
      const fromApi = mapRoomApiToProfile(raw);
      if (fromApi) applyRoomEditForm({ ...getRoomProfile(roomCode), ...fromApi });
    } catch (e) {
      console.warn("[Phòng] Tải form sửa API:", e);
    }
  })();

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }
    let b = buildingParam;
    if (!b) {
      try {
        b = sessionStorage.getItem("departmentsActiveBuilding") || "";
      } catch (_) {
        b = "";
      }
    }
    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const status = getRadioValueByName("roomStatus");
    const floor = document.getElementById("roomFloorInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    setRoomUpdate(roomCode, {
      buildingCode: b,
      className,
      classStudying: document.getElementById("roomClassInput")?.value.trim() || "",
      floor,
      teacher: document.getElementById("roomTeacherInput")?.value.trim() || "",
      desks: document.getElementById("roomDesksInput")?.value.trim() || "",
      chairs: document.getElementById("roomChairsInput")?.value.trim() || "",
      speakers: document.getElementById("roomSpeakersInput")?.value.trim() || "",
      airConditioner: document.getElementById("roomAirConditionerInput")?.value.trim() || "",
      microphone: document.getElementById("roomMicrophoneInput")?.value.trim() || "",
      glassDoor: getRadioValueByName("roomGlassDoor"),
      ceilingFan: document.getElementById("roomCeilingFanInput")?.value.trim() || "",
      curtain: getRadioValueByName("roomCurtain"),
      status,
      capacity,
    });
    const idPhongCapNhat =
      idPhongTuUrl || (window.maPhongTuDinhDanh && window.maPhongTuDinhDanh[roomCode]) || "";
    const jsonCapNhatPhong = {
      buildingCode: b,
      roomCode,
      floor: Number(floor) || 0,
      classUsing: className,
      classStudying: document.getElementById("roomClassInput")?.value.trim() || "",
      capacity: Number(capacity) || 0,
      status,
      teacherName: document.getElementById("roomTeacherInput")?.value.trim() || "",
      glassDoorStatus: getRadioValueByName("roomGlassDoor"),
      curtainStatus: getRadioValueByName("roomCurtain"),
    };
    void (async () => {
      try {
        if (idPhongCapNhat && window.CoSoApi?.capNhatPhong) {
          await window.CoSoApi.capNhatPhong(idPhongCapNhat, jsonCapNhatPhong);
        }
      } catch (e) {
        console.warn("[Phòng] Cập nhật API:", e);
      }
    })();
    if (b) {
      const inAdded = (getRoomAdditions()[b] || []).some((r) => r[0] === roomCode);
      if (inAdded) {
        addRoomRowToBuilding(b, [roomCode, floor, className, "-", status, capacity]);
      }
    }
    window.alert("Cập nhật phòng thành công!");
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../dashboard/departments.html";
  });
}

if (duongDanLaTrang("room-add.html")) {
  const form = document.getElementById("roomAddForm");
  const params = new URLSearchParams(window.location.search);
  let building = params.get("building");
  if (!building) {
    try {
      building = sessionStorage.getItem("departmentsActiveBuilding");
    } catch (_) {
      building = null;
    }
  }
  if (!building) building = "E1";
  try {
    sessionStorage.setItem("departmentsActiveBuilding", building);
  } catch (_) {}
  const hidden = document.getElementById("roomTargetBuilding");
  if (hidden) hidden.value = building;
  const addLbl = document.getElementById("roomAddBuildingLabel");
  if (addLbl) addLbl.textContent = `Tòa nhà ${building}`;
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
  // Khóa nhập tay số lượng thiết bị ở màn thêm phòng.
  [
    "roomDesksInput",
    "roomChairsInput",
    "roomSpeakersInput",
    "roomAirConditionerInput",
    "roomMicrophoneInput",
    "roomCeilingFanInput",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el instanceof HTMLInputElement) {
      el.readOnly = true;
      el.value = "0";
      el.title = "Được tổng hợp tự động từ Quản lý tài sản";
    }
  });
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add("submitted");
      form.reportValidity();
      return;
    }
    const roomCode = document.getElementById("roomCodeInput")?.value.trim() || "";
    const className = document.getElementById("roomClassUsingInput")?.value.trim() || "";
    const classStudying = document.getElementById("roomClassInput")?.value.trim() || "";
    const floor = document.getElementById("roomFloorInput")?.value.trim() || "";
    const capacity = document.getElementById("roomCapacityInput")?.value.trim() || "";
    const status = getRadioValueByName("roomStatus");
    if (isRoomCodeTakenInBuilding(building, roomCode)) {
      window.alert("Mã phòng này đã có trong tòa đã chọn. Vui lòng nhập mã khác.");
      return;
    }
    setRoomUpdate(roomCode, {
      buildingCode: building,
      className,
      classStudying,
      floor,
      capacity,
      status,
      teacher: document.getElementById("roomTeacherInput")?.value.trim() || "",
      desks: document.getElementById("roomDesksInput")?.value.trim() || "",
      chairs: document.getElementById("roomChairsInput")?.value.trim() || "",
      speakers: document.getElementById("roomSpeakersInput")?.value.trim() || "",
      airConditioner: document.getElementById("roomAirConditionerInput")?.value.trim() || "",
      microphone: document.getElementById("roomMicrophoneInput")?.value.trim() || "",
      glassDoor: getRadioValueByName("roomGlassDoor"),
      ceilingFan: document.getElementById("roomCeilingFanInput")?.value.trim() || "",
      curtain: getRadioValueByName("roomCurtain"),
    });
    addRoomRowToBuilding(building, [roomCode, floor, className, "-", status, capacity]);
    const jsonPhong = {
      buildingCode: building,
      roomCode,
      floor: Number(floor) || 0,
      classUsing: className,
      capacity: Number(capacity) || 0,
      status,
      teacherName: document.getElementById("roomTeacherInput")?.value.trim() || "",
      classStudying,
      glassDoorStatus: getRadioValueByName("roomGlassDoor"),
      curtainStatus: getRadioValueByName("roomCurtain"),
    };
    void (async () => {
      try {
        if (window.CoSoApi?.taoPhong) await window.CoSoApi.taoPhong(jsonPhong);
      } catch (e) {
        console.warn("[Phòng] Thêm API:", e);
      }
    })();
    window.alert("Thêm phòng thành công!");
    window.location.href = "../dashboard/departments.html";
  });
}

if (duongDanLaTrang("contact-profile.html")) {
  const profileName = document.getElementById("profileName");
  const profileRole = document.getElementById("profileRole");
  const profilePhone = document.getElementById("profilePhone");
  const profileEmail = document.getElementById("profileEmail");
  const profileAddress = document.getElementById("profileAddress");
  const profileAvatarImage = document.getElementById("profileAvatarImage");
  const backToPreviousPageBtn = document.getElementById("backToPreviousPageBtn");

  const roleLabel = (role) => {
    const r = String(role || "").trim();
    if (!r) return "—";
    const map = {
      ADMIN: "Administrator",
      MANAGER: "Quản lý",
      STAFF: "Cán bộ quản lý tài sản",
      STUDENT: "Sinh viên",
    };
    return map[r.toUpperCase()] || r;
  };

  const emailFromUsername = (username) => {
    const name = String(username || "").trim();
    if (!name) return "—";
    return name.includes("@") ? name : `${name}@hotmail.com`;
  };

  const contactProfiles = {
    "tien-hop": {
      name: "Trần Tiến Hợp",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "trantienhop@hotmail.com",
      address: "Bình Định",
      avatar: "/assets/images/avatar/avatar_1.jpg",
    },
    "nhat-thanh": {
      name: "Đỗ Nhật Thanh",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "donhatthanh@hotmail.com",
      address: "An Giang",
      avatar: "/assets/images/avatar/avatar_2.jpg",
    },
    "hoang-phuc": {
      name: "Võ Hoàng Phúc",
      role: "Cán bộ quản lý tài sản",
      phone: "1234459015",
      email: "vohoangphuc@hotmail.com",
      address: "Sóc Trăng",
      avatar: "/assets/images/avatar/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      name: "Trần Huỳnh Hòa Phúc",
      role: "Cán bộ quản lý tài sản",
      phone: "1263751380",
      email: "tranhuynhhoaphuc@hotmail.com",
      address: "Tiền Giang",
      avatar: "/assets/images/avatar/avatar_4.jpg",
    },
  };

  const dienTuApi = (u) => {
    if (!u) return;
    const fullName = u.fullName || u.fullname || u.username || "—";
    const av =
      window.UserAvatar && typeof window.UserAvatar.resolve === "function"
        ? window.UserAvatar.resolve(u)
        : "/assets/images/avatar/avatar_1.jpg";
    if (profileName) profileName.textContent = String(fullName).toUpperCase();
    if (profileRole) profileRole.textContent = roleLabel(u.role);
    if (profilePhone) profilePhone.textContent = u.phoneNumber || u.phone_number || "—";
    if (profileEmail) profileEmail.textContent = emailFromUsername(u.username);
    if (profileAddress) profileAddress.textContent = u.address || "—";
    if (profileAvatarImage) {
      profileAvatarImage.src = av;
      profileAvatarImage.alt = `avatar ${fullName}`;
    }
  };

  const dienTuBangCung = (profile) => {
    if (profileName) profileName.textContent = profile.name.toUpperCase();
    if (profileRole) profileRole.textContent = profile.role;
    if (profilePhone) profilePhone.textContent = profile.phone;
    if (profileEmail) profileEmail.textContent = profile.email;
    if (profileAddress) profileAddress.textContent = profile.address;
    if (profileAvatarImage) profileAvatarImage.src = profile.avatar;
  };

  const params = new URLSearchParams(window.location.search);
  const userKey = params.get("user") || "tien-hop";
  const userIdTuUrl = params.get("id") || "";

  void (async () => {
    try {
      if (userIdTuUrl && window.CoSoApi?.layNguoiDungTheoId) {
        dienTuApi(await window.CoSoApi.layNguoiDungTheoId(userIdTuUrl));
        return;
      }
      if (window.CoSoApi?.layDanhSachNguoiDung) {
        const list = await window.CoSoApi.layDanhSachNguoiDung();
        const found = list.find(
          (x) =>
            String(x.username || "") === userKey || String(x.id) === String(userKey).replace(/^id-/, ""),
        );
        if (found) {
          dienTuApi(found);
          return;
        }
      }
    } catch (e) {
      console.warn("[Contact profile]", e);
    }
    const profile = contactProfiles[userKey] || contactProfiles["tien-hop"];
    dienTuBangCung(profile);
  })();

  backToPreviousPageBtn?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = "../profile/users.html";
  });
}
