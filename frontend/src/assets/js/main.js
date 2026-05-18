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

/** Live Server / nhiá»u server tÄ©nh má»Ÿ URL khÃ´ng cÃ³ Ä‘uÃ´i .html â€” pháº£i khá»›p cáº£ hai dáº¡ng. */
function duongDanLaTrang(tenFileHtml) {
  const p = (window.location.pathname || "").replace(/\/+$/, "");
  const basename = String(tenFileHtml).replace(/^\//, "");
  const khongDuoi = basename.replace(/\.html$/i, "");
  return p.endsWith("/" + basename) || p.endsWith("/" + khongDuoi);
}

const sampleClasses = K65_CLASS_OPTIONS;
const timeSlots = [
  "Ca 1 (07:00 - 09:30)",
  "Ca 2 (09:45 - 12:00)",
  "Ca 3 (13:00 - 15:30)",
  "Ca 4 (15:45 - 18:00)",
];

const detectFloor = (roomCode) => {
  const match = roomCode.match(/(\d)/);
  return match ? match[1] : "1";
};

const toRows = (roomCodes) =>
  roomCodes.map((code, index) => [
    code,
    detectFloor(code),
    sampleClasses[index % sampleClasses.length],
    timeSlots[index % timeSlots.length],
    "Äang sá»­ dá»¥ng",
    `${45 + (index % 4) * 5}`,
  ]);

const roomCodeMap = {
  E3: ["P1E3", "P2E3", "P3E3"],
  E4: ["P1E4", "P2E4", "P3E4"],
  E5: ["P2E5", "P3E5"],
  E6: ["P1E6", "P2E6", "P3E6", "P4E6"],
  E8: ["P3E8", "P4E8", "P5E8", "P5E8B"],
  E9: ["P2E9-1", "P2E9-2", "P3E9-1", "P3E9-2", "P4E9"],
  GDDN: [
    "201DN",
    "202DN",
    "203DN",
    "204DN",
    "301DN",
    "303DN",
    "304DN",
    "401DN",
    "402DN",
    "403DN",
    "404DN",
    "501DN",
    "502DN",
    "503DN",
    "504DN",
  ],
  C2: [
    "P101C2",
    "P102C2",
    "P103C2",
    "P104C2",
    "P201C2",
    "P202C2",
    "P203C2",
    "P301C2",
    "P302C2",
    "P303C2",
    "P304C2",
    "P401C2",
    "P402C2",
    "P403C2",
    "P404C2",
    "P501C2",
    "P502C2",
    "P503C2",
    "P504C2",
  ],
};

let buildingRooms = {
  E1: [
    ["E1-101", "1", "CNTT", "Ca 1 (07:00 - 09:30)", "Äang sá»­ dá»¥ng", "60"],
    ["E1-202", "2", "QTKD", "Ca 2 (09:45 - 12:00)", "Äang sá»­ dá»¥ng", "55"],
  ],
  E7: [
    ["P102E7", "1", "CNTT", "Ca 1 (07:00 - 09:30)", "Äang sá»­ dá»¥ng", "55"],
    ["P106E7", "1", "CNTT_N_1", "Ca 2 (09:45 - 12:00)", "Äang sá»­ dá»¥ng", "50"],
    ["P111E7", "1", "KTTH", "Ca 3 (13:00 - 15:30)", "Äang sá»­ dá»¥ng", "45"],
    ["P202E7", "2", "CNTT_N_2", "Ca 1 (07:00 - 09:30)", "Äang sá»­ dá»¥ng", "55"],
    ["P203E7", "2", "KDQT", "Ca 2 (09:45 - 12:00)", "Äang sá»­ dá»¥ng", "50"],
    ["P204E7", "2", "KTÄTVT", "Ca 3 (13:00 - 15:30)", "Äang sá»­ dá»¥ng", "50"],
    ["P205E7", "2", "KTCÄT", "Ca 4 (15:45 - 18:00)", "Äang sá»­ dá»¥ng", "45"],
    ["P206E7", "2", "QTKD", "Ca tá»‘i (18:30 - 20:30)", "Äang sá»­ dá»¥ng", "45"],
  ],
  ...Object.fromEntries(Object.entries(roomCodeMap).map(([building, rooms]) => [building, toRows(rooms)])),
  CANTIN: [["CT-01", "1", "-", "-", "Trá»‘ng", "80"]],
};

const fallbackRooms = [["NA-001", "1", "-", "-", "Trá»‘ng", "40"]];

/** MÃ£ phÃ²ng (sá»‘ tháº») â†’ id DB Ä‘á»ƒ gá»i DELETE/PUT /api/rooms/{id} (dÃ¹ng chung cÃ¡c trang) */
window.maPhongTuDinhDanh = window.maPhongTuDinhDanh || Object.create(null);

const taiPhongTuMayChu = async () => {
  const api = window.FmApi;
  if (!api || typeof api.layDanhSachPhong !== "function") return;
  try {
    const ds = await api.layDanhSachPhong();
    if (!Array.isArray(ds) || ds.length === 0) return;
    // XÃ³a dá»¯ liá»‡u cá»©ng, chá»‰ dÃ¹ng dá»¯ liá»‡u tá»« MySQL
    Object.keys(buildingRooms).forEach((k) => { buildingRooms[k] = []; });
    for (const r of ds) {
      const b = String(r.buildingCode || r.building || r.building_code || "").trim() || "KHAC";
      const code = String(r.roomCode || r.room_code || "").trim();
      if (!code) continue;
      if (r.id != null) window.maPhongTuDinhDanh[code] = String(r.id);
      if (!buildingRooms[b]) buildingRooms[b] = [];
      const lop =
        r.classStudying ||
        r.class_studying ||
        r.classUsing ||
        r.class_using ||
        "-";
      const hang = [
        code,
        String(r.floor ?? r.tang ?? ""),
        lop,
        "-",
        window.AppRoomHelpers?.mapRoomStatusLabel?.(r.status || r.trangThai) || r.status || r.trangThai || "Trá»‘ng",
        String(r.capacity ?? r.sucChua ?? ""),
      ];
      buildingRooms[b].push(hang);
    }
  } catch (err) {
    console.warn("[PhÃ²ng] KhÃ´ng táº£i Ä‘Æ°á»£c tá»« API, dÃ¹ng dá»¯ liá»‡u cá»¥c bá»™:", err);
  }
};

const isRoomCodeTakenInBuilding = (buildingCode, roomCode) => {
  const staticRows = buildingRooms[buildingCode] || [];
  if (staticRows.some((r) => r[0] === roomCode)) return true;
  const added = getRoomAdditions()[buildingCode] || [];
  return added.some((r) => r[0] === roomCode);
};

if (duongDanLaTrang("departments.html")) {
  const body = document.getElementById("roomTableBody");
  const departmentsTable = document.getElementById("departmentsTable");
  const departmentsTableHeadRow = document.getElementById("departmentsTableHeadRow");
  const departmentsSearchInput = document.getElementById("departmentsSearchInput");
  const departmentsPageSizeSelect = document.getElementById("departmentsPageSizeSelect");
  const deptPageTitle = document.querySelector(".departments-panel .page-title");
  const addRoomTabLink = document.querySelector('a.tab[href*="room-add"]');
  let refreshDepartmentTable = () => {};

  /** TiÃªu Ä‘á» trang luÃ´n chá»‰ Â«Quáº£n lÃ½ tÃ²a nhÃ Â» (khÃ´ng gáº¯n mÃ£ tÃ²a E1/E3â€¦). */
  const giuTieuDeTrangPhong = () => {
    if (!deptPageTitle) return;
    deptPageTitle.setAttribute("data-i18n", "departments.pageTitle");
    deptPageTitle.removeAttribute("data-i18n-params");
    const text = deptT("departments.pageTitle");
    if (window.FmI18n?.apply) window.FmI18n.apply(deptPageTitle);
    else deptPageTitle.textContent = text;
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
    <th>${deptT("departments.colCapacity")}</th>
    <th>${deptT("departments.colStatus")}</th>
    <th>${deptT("departments.colActions")}</th>
  `;
      return;
    }
    departmentsTableHeadRow.innerHTML = `
    <th>${deptT("departments.colRoomCode")}</th>
    <th>${deptT("departments.colFloor")}</th>
    <th>${deptT("departments.colClassUsing")}</th>
    <th>${deptT("departments.colCapacity")}</th>
    <th>${deptT("departments.colStatus")}</th>
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
                <img src="../../assets/icons/view-info.svg" alt="${deptT("departments.viewRoom")}" />
              </button>
              <button class="icon-btn room-update-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.updateRoom")}">
                <img src="../../assets/icons/update.svg" alt="${deptT("departments.updateRoom")}" />
              </button>
              <button class="icon-btn room-delete-btn" type="button" data-room-code="${roomCode}" title="${deptT("departments.deleteRoom")}">
                <img src="../../assets/icons/delete.svg" alt="${deptT("departments.deleteRoom")}" />
              </button>
            </div>
          </td>`;

  const buildDepartmentRoomTr = (room, buildingCode, { withBuildingColumn }) => {
    const roomFloor = room[1] != null && String(room[1]).trim() !== "" ? String(room[1]).trim() : "";
    const roomClass = room[2] != null && String(room[2]).trim() !== "" && room[2] !== "-" ? String(room[2]).trim() : "-";
    const roomStatus = room[4] != null && String(room[4]).trim() !== "" ? String(room[4]).trim() : "";
    const roomCapacity = room[5] != null && String(room[5]).trim() !== "" ? String(room[5]).trim() : "";
    const idPhong = (window.maPhongTuDinhDanh && window.maPhongTuDinhDanh[room[0]]) || "";
    const bCell = withBuildingColumn ? `<td>${buildingLabelForCode(buildingCode)}</td>` : "";
    return `
        <tr data-building="${buildingCode}" data-room-id="${idPhong}">
          ${bCell}
          <td>${room[0]}</td>
          <td>${roomFloor}</td>
          <td>${roomClass}</td>
          <td>${roomCapacity}</td>
          <td>${roomStatus}</td>
          ${roomActionCells(room[0])}
        </tr>`;
  };

  const renderAllBuildingsForSearch = () => {
    if (!body || !departmentsTable) return;
    departmentsTable.setAttribute("data-dept-search-mode", "global");
    renderDeptTableHead("global");
    const codes = new Set([...Object.keys(buildingRooms), ...Object.keys(getRoomAdditions() || {})]);
    const out = [];
    for (const code of Array.from(codes).sort()) {
      const base = buildingRooms[code] || [];
      const extra = getRoomAdditions()[code] || [];
      const baseCodes = new Set(base.map((r) => r[0]));
      const rows = [...base, ...extra.filter((r) => !baseCodes.has(r[0]))];
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
    const base = buildingRooms[code] || fallbackRooms;
    const extra = getRoomAdditions()[code] || [];
    const baseCodes = new Set(base.map((r) => r[0]));
    const rows = [...base, ...extra.filter((r) => !baseCodes.has(r[0]))];
    body.innerHTML = rows.map((room) => buildDepartmentRoomTr(room, code, { withBuildingColumn: false })).join("");
    giuTieuDeTrangPhong();
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
    pageSizeSelect: departmentsPageSizeSelect,
    getRowSearchText: (row) => {
      const mode = document.getElementById("departmentsTable")?.getAttribute("data-dept-search-mode");
      const cols = mode === "global" ? [3, 4] : [2, 3];
      return cols.map((i) => row.children[i]?.textContent?.trim() || "").join(" ");
    },
  });

  const taiTheoUrl = () => {
    const code = maToaHienTai();
    setAddRoomLink(code);
    renderRooms(code, buildingLabelForCode(code));
  };

  window.addEventListener("fm-i18n-applied", () => {
    const mode = departmentsTable?.getAttribute("data-dept-search-mode");
    renderDeptTableHead(mode === "global" ? "global" : "single");
    queueMicrotask(giuTieuDeTrangPhong);
  });

  giuTieuDeTrangPhong();

  void (async () => {
    await taiPhongTuMayChu();
    if (departmentsSearchInput?.value.trim()) {
      renderAllBuildingsForSearch();
    } else {
      taiTheoUrl();
    }
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
      if (idPhong && window.FmApi && typeof window.FmApi.xoaPhong === "function") {
        void (async () => {
          try {
            await window.FmApi.xoaPhong(idPhong);
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
      fullname: "Tráº§n Tiáº¿n Há»£p",
      address: "BÃ¬nh Äá»‹nh",
      phone: "1263751380",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      avatar: "/assets/images/avatar/avatar_1.jpg",
    },
    "nhat-thanh": {
      username: "canbonhanvien",
      password: "******",
      fullname: "Äá»— Nháº­t Thanh",
      address: "An Giang",
      phone: "1263751380",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      avatar: "/assets/images/avatar/avatar_2.jpg",
    },
    "hoang-phuc": {
      username: "ht",
      password: "******",
      fullname: "VÃµ HoÃ ng PhÃºc",
      address: "SÃ³c TrÄƒng",
      phone: "1234459015",
      role: "Hiá»‡u trÆ°á»Ÿng",
      avatar: "/assets/images/avatar/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      username: "nv",
      password: "******",
      fullname: "Tráº§n Huá»³nh HÃ²a PhÃºc",
      address: "Tiá»n Giang",
      phone: "1263751380",
      role: "Lao CÃ´ng",
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
    if (userFormPageTitle) userFormPageTitle.textContent = "Cáº­p nháº­t user";
    if (userFormTabLabel) userFormTabLabel.textContent = "Cáº­p nháº­t user";
    if (userFormSubmitBtn) userFormSubmitBtn.textContent = "Cáº­p nháº­t";
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

  if (isEditMode && editIdFromUrl && window.FmApi?.layNguoiDungTheoId) {
    void (async () => {
      try {
        const u = await window.FmApi.layNguoiDungTheoId(editIdFromUrl);
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
          if (hasFile && window.FmApi?.capNhatNguoiDungMultipart && maNguoiDungCapNhat) {
            const fd = new FormData();
            fd.append("username", userUsernameInput.value.trim());
            if (userPasswordInput?.value) fd.append("password", userPasswordInput.value);
            fd.append("fullName", userFullnameInput.value.trim());
            fd.append("address", userAddressInput?.value.trim() || "");
            fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
            fd.append("role", userRoleInput.value.trim());
            fd.append("avatar", fileInput.files[0]);
            await window.FmApi.capNhatNguoiDungMultipart(String(maNguoiDungCapNhat), fd);
          } else if (window.FmApi?.capNhatNguoiDung && maNguoiDungCapNhat) {
            await window.FmApi.capNhatNguoiDung(String(maNguoiDungCapNhat), {
              username: userUsernameInput.value.trim(),
              password: userPasswordInput?.value || undefined,
              fullName: userFullnameInput.value.trim(),
              address: userAddressInput?.value.trim() || "",
              phoneNumber: userPhoneInput?.value.trim() || "",
              role: userRoleInput.value.trim(),
            });
          }
        } catch (e) {
          console.warn("[User] Cáº­p nháº­t API:", e);
        }
      })();
      sessionStorage.setItem("pendingUserUpdate", JSON.stringify(payload));
      window.alert("Cáº­p nháº­t user thÃ nh cÃ´ng!");
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
        if (hasFile && window.FmApi?.taoNguoiDungMultipart) {
          const fd = new FormData();
          fd.append("username", userUsernameInput.value.trim());
          fd.append("password", userPasswordInput?.value || "");
          fd.append("fullName", userFullnameInput.value.trim());
          fd.append("address", userAddressInput?.value.trim() || "");
          fd.append("phoneNumber", userPhoneInput?.value.trim() || "");
          fd.append("role", userRoleInput.value.trim());
          fd.append("avatar", fileInput.files[0]);
          await window.FmApi.taoNguoiDungMultipart(fd);
        } else if (window.FmApi?.taoNguoiDung) {
          await window.FmApi.taoNguoiDung({
            username: userUsernameInput.value.trim(),
            password: userPasswordInput?.value || "",
            fullName: userFullnameInput.value.trim(),
            address: userAddressInput?.value.trim() || "",
            phoneNumber: userPhoneInput?.value.trim() || "",
            role: userRoleInput.value.trim(),
          });
        }
      } catch (e) {
        console.warn("[User] ThÃªm API:", e);
      }
    })();
    window.alert("ThÃªm user thÃ nh cÃ´ng!");
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
      title: "Quáº£n lÃ½ danh má»¥c tÃ i sáº£n",
      listTabText: "Táº¥t cáº£ danh má»¥c",
      addTabText: "ThÃªm danh má»¥c",
      extraTabText: "",
      columns: ["ID", "MÃ£ danh má»¥c", "TÃªn danh má»¥c", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn danh má»¥c",
      codeLabel: "MÃ£ danh má»¥c",
      namePlaceholder: "Nháº­p tÃªn danh má»¥c",
      codePlaceholder: "VÃ­ dá»¥: MM-TB",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "MM-TB", "MÃ¡y mÃ³c, thiáº¿t bá»‹", "Sá»­a/XÃ³a"],
        ["2", "CC-DC", "CÃ´ng cá»¥, dá»¥ng cá»¥", "Sá»­a/XÃ³a"],
      ],
    },
    "may-moc-thiet-bi": {
      title: "Quáº£n lÃ½ danh má»¥c mÃ¡y mÃ³c, thiáº¿t bá»‹",
      listTabText: "MÃ¡y mÃ³c, thiáº¿t bá»‹",
      addTabText: "ThÃªm MÃ¡y mÃ³c, thiáº¿t bá»‹",
      extraTabText: "",
      columns: ["ID", "MÃ£", "TÃªn", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn",
      codeLabel: "MÃ£",
      namePlaceholder: "Nháº­p tÃªn",
      codePlaceholder: "VÃ­ dá»¥: MM-01",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "MM-01", "Gháº¿", "Sá»­a/XÃ³a"],
        ["2", "MM-02", "Ká»‡ gÃ³c", "Sá»­a/XÃ³a"],
        ["3", "MM-03", "Báº£ng Meci", "Sá»­a/XÃ³a"],
        ["4", "MM-04", "BÃ n vi tÃ­nh", "Sá»­a/XÃ³a"],
        ["5", "MM-05", "BÃ n", "Sá»­a/XÃ³a"],
        ["6", "MM-06", "Tá»§", "Sá»­a/XÃ³a"],
      ],
    },
    "cong-cu-dung-cu": {
      title: "Quáº£n lÃ½ danh má»¥c cÃ´ng cá»¥, dá»¥ng cá»¥",
      listTabText: "CÃ´ng cá»¥, dá»¥ng cá»¥",
      addTabText: "ThÃªm CÃ´ng cá»¥, dá»¥ng cá»¥",
      extraTabText: "",
      columns: ["ID", "MÃ£", "TÃªn", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn",
      codeLabel: "MÃ£",
      namePlaceholder: "Nháº­p tÃªn",
      codePlaceholder: "VÃ­ dá»¥: CC-01",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "CC-01", "KÃ¬m Ä‘iá»‡n", "Sá»­a/XÃ³a"],
        ["2", "CC-02", "Cá» lÃª", "Sá»­a/XÃ³a"],
        ["3", "CC-03", "Má» láº¿t", "Sá»­a/XÃ³a"],
      ],
    },
    "nguon-kinh-phi": {
      title: "Quáº£n lÃ½ nguá»“n kinh phÃ­",
      listTabText: "Nguá»“n kinh phÃ­",
      addTabText: "ThÃªm nguá»“n kinh phÃ­",
      extraTabText: "Bá»• sung nguá»“n kinh phÃ­",
      columns: ["ID", "MÃ£ NKP", "TÃªn nguá»“n kinh phÃ­", "Tá»•ng ngÃ¢n sÃ¡ch", "Tá»•ng chi", "Tá»•ng thanh lÃ½", "CÃ²n láº¡i", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn nguá»“n kinh phÃ­",
      codeLabel: "MÃ£ nguá»“n kinh phÃ­",
      namePlaceholder: "Vui lÃ²ng nháº­p tÃªn nguá»“n kinh phÃ­",
      codePlaceholder: "Vui lÃ²ng nháº­p mÃ£ nguá»“n kinh phÃ­",
      extraNameLabel: "ThÃªm kinh phÃ­",
      extraCodeLabel: "Loáº¡i kinh phÃ­",
      extraNamePlaceholder: "Vui lÃ²ng nháº­p sá»‘ tiá»n cáº§n bá»• sung",
      rows: [
        ["1", "", "NhÃ  trÆ°á»ng", "500.000.000 Ä‘", "386.409.000 Ä‘", "237.100.000 Ä‘", "113.591.000 Ä‘", "Sá»­a/XÃ³a"],
        ["2", "DA", "Dá»± Ã¡n", "400.000.000 Ä‘", "269.870.000 Ä‘", "120.000.000 Ä‘", "130.130.000 Ä‘", "Sá»­a/XÃ³a"],
      ],
    },
    "nha-cung-cap": {
      title: "Quáº£n lÃ½ nhÃ  cung cáº¥p",
      listTabText: "Táº¥t cáº£ nhÃ  cung cáº¥p",
      addTabText: "ThÃªm nhÃ  cung cáº¥p má»›i",
      extraTabText: "",
      columns: ["ID", "MÃ£ nhÃ  cung cáº¥p", "TÃªn nhÃ  cung cáº¥p", "Äá»‹a chá»‰", "Email", "SDT", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn nhÃ  cung cáº¥p",
      codeLabel: "MÃ£ nhÃ  cung cáº¥p",
      namePlaceholder: "Vui lÃ²ng nháº­p tÃªn nhÃ  cung cáº¥p",
      codePlaceholder: "Vui lÃ²ng nháº­p mÃ£ nhÃ  cung cáº¥p",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "", "CÃ´ng ty MTV Quang Minh táº¡i Quáº£ng Nam", "Tam ká»³ quáº£ng Nam", "quangminh@gmail.com", "120202345", "Sá»­a/XÃ³a"],
        ["2", "", "CÃ´ng ty TNHH Tráº§n TÃ¢m", "Háº£i ChÃ¢u ÄÃ  Náºµng", "trantam@gmail.com", "126784774", "Sá»­a/XÃ³a"],
        ["3", "", "CÃ´ng ty cung cáº¥p mÃ¡y tÃ­nh Tam Ká»³", "117 LÃª Lá»£i TP Tam Ká»³ Quáº£ng Nam", "maytinhtamky@gmail.com", "126784774", "Sá»­a/XÃ³a"],
        ["4", "", "CÃ´ng ty TNHH Ã‚m nháº¡c Tam ká»³", "Tam An PhÃº Ninh Quáº£ng Nam", "amnhactamky@gmail.com", "1230012574", "Sá»­a/XÃ³a"],
      ],
    },
    nuoc: {
      title: "Quáº£n lÃ½ nÆ°á»›c",
      listTabText: "NÆ°á»›c",
      addTabText: "ThÃªm nÆ°á»›c",
      extraTabText: "",
      columns: ["ID", "MÃ£ nÆ°á»›c", "TÃªn nÆ°á»›c", "Chá»©c nÄƒng"],
      nameLabel: "TÃªn nÆ°á»›c",
      codeLabel: "MÃ£ nÆ°á»›c",
      namePlaceholder: "Vui lÃ²ng nháº­p tÃªn nÆ°á»›c",
      codePlaceholder: "Vui lÃ²ng nháº­p mÃ£ nÆ°á»›c",
      extraNameLabel: "",
      extraCodeLabel: "",
      extraNamePlaceholder: "",
      rows: [
        ["1", "BL", "Ba Lan", "Sá»­a/XÃ³a"],
        ["2", "HL", "HÃ  Lan", "Sá»­a/XÃ³a"],
        ["3", "", "HÃ n Quá»‘c", "Sá»­a/XÃ³a"],
        ["4", "", "Nga", "Sá»­a/XÃ³a"],
        ["5", "", "Viá»‡t Nam", "Sá»­a/XÃ³a"],
      ],
    },
  };

  const taiDanhMucMacDinhTuApi = async () => {
    if (!window.FmApi || typeof window.FmApi.layDanhSachDanhMuc !== "function") return;
    try {
      const list = await window.FmApi.layDanhSachDanhMuc();
      if (!Array.isArray(list) || list.length === 0) return;
      categoryConfigs.default.rows = list.map((c) => [
        String(c.id != null ? c.id : ""),
        String(c.code || c.categoryCode || ""),
        String(c.name || c.categoryName || ""),
        "Sá»­a/XÃ³a",
      ]);
    } catch (err) {
      console.warn("[Danh má»¥c] KhÃ´ng táº£i Ä‘Æ°á»£c tá»« API:", err);
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
    categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "HÃ£y nháº­p danh má»¥c cá»§a báº¡n !";
    categoryNameError.hidden = true;
  };

  const toMoneyNumber = (text) => Number((text || "").replace(/[^\d]/g, "")) || 0;
  const formatMoney = (value) => `${Number(value || 0).toLocaleString("vi-VN")} Ä‘`;

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

  /** Cá»™t chá»©c nÄƒng: cáº­p nháº­t + xÃ³a (Ã´ vuÃ´ng, icon; khÃ´ng cÃ³ xem chi tiáº¿t) */
  const categoryActionButtonsHtml = (id, code) => {
    const a = escapeCategoryAttr(id);
    const b = escapeCategoryAttr(code);
    return `<td>
      <div class="category-icon-actions">
        <button class="category-icon-btn category-update-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.updateTitle" title="Cáº­p nháº­t">
          <img src="../../assets/icons/update.svg" alt="" />
        </button>
        <button class="category-icon-btn category-delete-btn" type="button" data-category-id="${a}" data-category-code="${b}" data-i18n-title="categories.actions.deleteTitle" title="XÃ³a">
          <img src="../../assets/icons/delete.svg" alt="" />
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

  const CATEGORY_ROW_PATCHES_KEY = "categoryRowPatches";

  const mergeCategoryPatches = (configKey, baseRows) => {
    let table = null;
    try {
      const raw = sessionStorage.getItem(CATEGORY_ROW_PATCHES_KEY);
      if (!raw) return baseRows;
      const patches = JSON.parse(raw);
      table = patches[configKey];
    } catch {
      return baseRows;
    }
    if (!table || typeof table !== "object") return baseRows;
    return baseRows.map((row) => {
      const id = String(row[0] ?? "");
      const patch = table[id];
      if (patch && Array.isArray(patch) && patch.length) {
        return [...patch, "Sá»­a/XÃ³a"];
      }
      return row;
    });
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
      <option value="" data-i18n="categories.budgetSelectPlaceholder">-- Chá»n loáº¡i kinh phÃ­ --</option>
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
    const viewKey = window.location.hash.replace("#", "").trim();
    if (!viewKey || viewKey === "default") {
      await taiDanhMucMacDinhTuApi();
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
      submitBtn.textContent = ct("submitBtn", window.FmI18n?.t?.("buttons.add") || "ThÃªm");
    }
    if (categoryResetBtn) {
      categoryResetBtn.setAttribute("data-i18n", vp("resetBtn"));
      categoryResetBtn.textContent = ct("resetBtn", window.FmI18n?.t?.("userForm.btnReset") || "Nháº­p láº¡i");
    }
    renderCategoryHead(config.columns);
    renderCategoryRows(mergeCategoryPatches(activeCategoryConfigKey, config.rows));
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
      const delMsg = window.FmI18n?.t?.("categories.confirmDelete", { name }) || `Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a danh má»¥c "${name}"?`;
      if (!window.confirm(delMsg)) return;
      const idDanhMuc = cells[0]?.textContent?.trim() || "";
      if (idDanhMuc && window.FmApi?.xoaDanhMuc) {
        void (async () => {
          try {
            await window.FmApi.xoaDanhMuc(idDanhMuc);
            row.remove();
            refreshCategoryTable();
          } catch (e) {
            window.alert(window.FmI18n?.t?.("categories.deleteServerFail") || "XÃ³a danh má»¥c trÃªn mÃ¡y chá»§ tháº¥t báº¡i.");
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
      categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "HÃ£y nháº­p danh má»¥c cá»§a báº¡n !";
      categoryNameInput.focus();
      return;
    }

    categoryNameError.hidden = true;
    const jsonDanhMuc = {
      code: categoryCode,
      name: categoryName,
      type: activeCategoryConfigKey === "default" ? "ASSET" : activeCategoryConfigKey,
    };
    void (async () => {
      try {
        if (window.FmApi?.taoDanhMuc) await window.FmApi.taoDanhMuc(jsonDanhMuc);
      } catch (e) {
        console.warn("[Danh má»¥c] ThÃªm API tháº¥t báº¡i:", e);
      }
    })();
    const newRow = document.createElement("tr");
    const isBudgetView = activeCategoryConfigKey === "nguon-kinh-phi";
    const isExtraBudgetTab = isBudgetView && activeCategoryTab === "extra";

    if (isExtraBudgetTab) {
      const addedBudget = toMoneyNumber(categoryName);
      if (addedBudget <= 0) {
        categoryNameError.hidden = false;
        const emKey = "categories.validationExtraMoney";
        categoryNameError.setAttribute("data-i18n", emKey);
        categoryNameError.textContent = window.FmI18n?.t?.(emKey) || "Vui lÃ²ng nháº­p sá»‘ tiá»n há»£p lá»‡";
        categoryNameInput.focus();
        return;
      }
      const reqKey = "categories.validationRequired";
      categoryNameError.setAttribute("data-i18n", reqKey);
      categoryNameError.textContent = window.FmI18n?.t?.(reqKey) || "HÃ£y nháº­p danh má»¥c cá»§a báº¡n !";
      const targetRow = Array.from(categoryTableBody.querySelectorAll("tr")).find((row) => {
        const cells = row.querySelectorAll("td");
        const code = cells[1]?.textContent?.trim() || "";
        const name = cells[2]?.textContent?.trim() || "";
        return code === typedCode || (!code && name === typedCode);
      });
      if (!targetRow) return;
      const cells = targetRow.querySelectorAll("td");
      const currentTotal = toMoneyNumber(cells[3]?.textContent || "");
      const currentRemain = toMoneyNumber(cells[6]?.textContent || "");
      cells[3].textContent = formatMoney(currentTotal + addedBudget);
      cells[6].textContent = formatMoney(currentRemain + addedBudget);
      resetCategoryForm();
      switchCategoryTab("list");
      refreshCategoryTable();
      return;
    }

    const nextId = getNextCategoryId();
    const newCode = isBudgetView
      ? categoryCode || "NKP-MOI"
      : activeCategoryConfigKey === "nha-cung-cap"
        ? categoryCode || "NCC-MOI"
        : categoryCode || "DM-MOI";
    const actionTd = categoryActionButtonsHtml(String(nextId), newCode);
    newRow.innerHTML = isBudgetView
      ? `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      <td>0 Ä‘</td>
      <td>0 Ä‘</td>
      <td>0 Ä‘</td>
      <td>0 Ä‘</td>
      ${actionTd}
    `
      : activeCategoryConfigKey === "nha-cung-cap"
        ? `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      ${actionTd}
    `
        : `
      <td>${nextId}</td>
      <td>${newCode}</td>
      <td>${categoryName}</td>
      ${actionTd}
    `;
    categoryTableBody.appendChild(newRow);

    resetCategoryForm();
    switchCategoryTab("list");
    refreshCategoryTable();
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
            : "â€”";
      if (codeLabel) codeLabel.textContent = codeDisplay;
      if (typeLabel) {
        const tk = `categories.views.${vk}.title`;
        typeLabel.setAttribute("data-i18n", tk);
        typeLabel.textContent = window.FmI18n?.t?.(tk) || payload.pageTitle || "â€”";
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
          lab.textContent = window.FmI18n?.t?.(kFb, { n: i + 1 }) || `TrÆ°á»ng ${i + 1}`;
        }
        const inp = document.createElement("input");
        inp.type = "text";
        inp.id = `catEditField_${i}`;
        inp.name = `field_${i}`;
        inp.value = values[i] != null ? String(values[i]) : "";
        const labelForReadonly = hasLabel ? String(labels[i]) : "";
        if (
          /^mÃ£\b/i.test(labelForReadonly) ||
          /^code\b/i.test(labelForReadonly) ||
          /^(Sá»‘|STT)\b/i.test(labelForReadonly) ||
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
        const than = { code: newData[1] || "", name: newData[2] || "", type: configKey || "default" };
        void (async () => {
          try {
            if (rowId && window.FmApi?.capNhatDanhMuc) await window.FmApi.capNhatDanhMuc(rowId, than);
          } catch (err) {
            console.warn("[Danh má»¥c] Cáº­p nháº­t API tháº¥t báº¡i:", err);
          }
        })();
        let patches = {};
        try {
          patches = JSON.parse(sessionStorage.getItem("categoryRowPatches") || "{}");
        } catch {
          patches = {};
        }
        if (!patches[configKey] || typeof patches[configKey] !== "object") {
          patches[configKey] = {};
        }
        patches[configKey][rowId] = newData;
        try {
          sessionStorage.setItem("categoryRowPatches", JSON.stringify(patches));
          sessionStorage.removeItem("categoryEditDraft");
        } catch (_) {}
        window.alert(window.FmI18n?.t?.("categories.successUpdateAlert") || "Cáº­p nháº­t danh má»¥c thÃ nh cÃ´ng!");
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
  const ASSET_RATING_HISTORY_KEY = "assetRatingHistory";

  const thoatThuocTinh = (chuoi) =>
    String(chuoi ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  const dinhDangTienVn = (so) => {
    if (so == null || so === "") return "";
    const n = Number(so);
    if (Number.isNaN(n)) return String(so);
    return n.toLocaleString("vi-VN") + " Ä‘";
  };
  const taiBangTaiSanTuApi = async () => {
    if (!assetTableBody || !window.FmApi || typeof window.FmApi.layDanhSachTaiSan !== "function") return;
    try {
      const list = await window.FmApi.layDanhSachTaiSan();
      if (!Array.isArray(list) || list.length === 0) return;
      const hang = list
        .map((a) => {
          const id = a.id != null ? String(a.id) : "";
          const card = a.cardNumber || a.card_number || "";
          const ten = a.assetName || a.asset_name || "";
          const nhaCungCap = a.provider || "";
          const nuoc = a.country || "";
          const khoa = a.department || "";
          const phong = a.classroom || "";
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
          const tt = a.status || "";
          return `<tr
            data-asset-id="${thoatThuocTinh(id)}"
            data-asset-name="${thoatThuocTinh(ten)}"
            data-provider="${thoatThuocTinh(nhaCungCap)}"
            data-country="${thoatThuocTinh(nuoc)}"
            data-card-number="${thoatThuocTinh(card)}"
            data-department="${thoatThuocTinh(khoa)}"
            data-building="${thoatThuocTinh(toa)}"
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
          >
            <td><input name="assetRowSelector" value="${thoatThuocTinh(card)}" type="checkbox" /></td>
            <td>${thoatThuocTinh(card)}</td>
            <td>${thoatThuocTinh(ten)}</td>
            <td>${dinhDangTienVn(dg)}</td>
            <td>${thoatThuocTinh(sl)}</td>
            <td>${thoatThuocTinh(dm)}</td>
            <td>${thoatThuocTinh(phong)}</td>
            <td>${thoatThuocTinh(nguoiMua)}</td>
            <td><button class="status-pill on" type="button" aria-pressed="true"></button></td>
            <td>â€”</td>
            <td>
              <div class="room-action-buttons user-action-buttons">
                <button class="icon-btn asset-view-btn" type="button" title="Xem chi tiáº¿t">
                  <img src="../../assets/icons/view-info.svg" alt="Xem chi tiáº¿t" />
                </button>
                <button class="icon-btn asset-transfer-btn" type="button" title="Äiá»u chuyá»ƒn">
                  <img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" />
                </button>
                <button class="icon-btn asset-update-btn" type="button" title="Cáº­p nháº­t">
                  <img src="../../assets/icons/update.svg" alt="Cáº­p nháº­t" />
                </button>
                <button class="icon-btn asset-delete-btn" type="button" title="XÃ³a">
                  <img src="../../assets/icons/delete.svg" alt="XÃ³a" />
                </button>
              </div>
            </td>
          </tr>`;
        })
        .join("");
      assetTableBody.innerHTML = hang;
    } catch (err) {
      console.warn("[TÃ i sáº£n] KhÃ´ng táº£i Ä‘Æ°á»£c tá»« API:", err);
    }
  };
  let activeReRatingTab = "all";
  let selectedReRatingCard = "";
  let selectedHistoryCard = "";

  const getAssetRatingHistory = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(ASSET_RATING_HISTORY_KEY) || "{}");
      return raw && typeof raw === "object" ? raw : {};
    } catch (_) {
      return {};
    }
  };

  const setAssetRatingHistory = (history) => {
    try {
      localStorage.setItem(ASSET_RATING_HISTORY_KEY, JSON.stringify(history));
    } catch (_) {}
  };

  let assetRatingHistory = getAssetRatingHistory();
  const reRatingBaseRows = Array.from(reRatingTableBody?.querySelectorAll("tr") || []).map((row) => ({
    card: row.dataset.card || "",
    name: row.dataset.name || "",
    unit: row.dataset.unit || "",
    quantity: row.dataset.quantity || "",
    price: row.dataset.price || "",
    duration: row.dataset.duration || "",
    building: row.children[3]?.textContent?.trim() || "",
    className: row.children[4]?.textContent?.trim() || "",
  }));

  const formatStars = (stars) => "â˜…".repeat(stars) + "â˜†".repeat(Math.max(0, 5 - stars));
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
    assetRatingTableBody.innerHTML = unrated
      .map(
        (item) =>
          `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
            <td>${item.card}</td>
            <td>${item.name}</td>
            <td>${item.building}</td>
            <td>${item.className}</td>
            <td>
              <span>ChÆ°a Ä‘Ã¡nh giÃ¡</span>
              <button class="btn btn-primary asset-rate-now-btn" type="button" style="margin-left:8px;padding:4px 8px">ÄÃ¡nh giÃ¡ ngay</button>
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
    reRatingTableBody.innerHTML = rows
      .map((item, idx) => {
        const latest = latestRatingForCard(item.card);
        const actionLabel = activeReRatingTab === "all" ? "ÄÃ¡nh giÃ¡ láº¡i" : "Xem lá»‹ch sá»­";
        const latestInfo = latest
          ? `<div style="font-size:12px;color:#5b6f84;margin-top:4px">${formatStars(Number(latest.stars || 0))} â€¢ ${formatDateTime(latest.ratedAt)}</div>`
          : "";
        return `<tr data-card="${item.card}" data-name="${item.name}" data-unit="${item.unit}" data-quantity="${item.quantity}" data-price="${item.price}" data-duration="${item.duration}">
          <td>${idx + 1}</td>
          <td>${item.card}</td>
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
    reRatingHistoryTitle.textContent = `Lá»‹ch sá»­ Ä‘Ã¡nh giÃ¡ - ${rows.name} (${rows.card})`;
    reRatingHistoryList.innerHTML = history
      .map(
        (item, idx) => `<div style="border:1px solid #dce6f1;border-radius:8px;padding:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;gap:8px">
          <strong>Láº§n ${idx + 1} - ${formatDateTime(item.ratedAt)}</strong>
          <button class="btn btn-success rating-delete-btn" type="button" data-card="${card}" data-rate-id="${item.id}" style="padding:4px 8px">XÃ³a</button>
        </div>
        <div>${formatStars(Number(item.stars || 0))}</div>
        <div>NgÆ°á»i Ä‘Ã¡nh giÃ¡: ${item.reviewer || "-"}</div>
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
    assetProviderInput: "provider",
    assetCountryInput: "country",
    assetCardInput: "cardNumber",
    assetDepartmentInput: "department",
    assetClassInput: "classroom",
    assetTypeInput: "assetType",
    assetCategoryInput: "itemCategory",
    assetManufactureYearInput: "manufactureYear",
    assetUnitPriceInput: "unitPrice",
    assetQuantityInput: "quantity",
    assetOriginalPriceInput: "originalPrice",
    assetFundInput: "fundSource",
    assetUsageTimeInput: "usageTime",
    assetPurchaseDateInput: "purchaseDate",
    assetUsageYearInput: "usageYear",
    assetNoteInput: "note",
    assetBuyerInput: "buyer",
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
          (isReRatingMode ? "ÄÃ¡nh giÃ¡ láº¡i tÃ i sáº£n" : "ÄÃ¡nh giÃ¡ tÃ i sáº£n");
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
        (typeof window.FmI18n?.t === "function" && window.FmI18n.t("assets.pageTitle")) || "Quáº£n lÃ½ tÃ i sáº£n";
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
  };

  const ASSET_SELECTED_KEY = "assetSelectedPayload";
  const toAssetPayloadFromRow = (row) => {
    const payload = {};
    Object.values(fieldMap).forEach((dataKey) => {
      payload[dataKey] = row.dataset[dataKey] || "";
    });
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
      ["transferCategoryInput", row.dataset.itemCategory || ""],
      ["transferNameInput", row.dataset.assetName || ""],
      ["transferTypeInput", row.dataset.assetType || ""],
      ["transferBuildingInput", row.dataset.building || ""],
      ["transferGiverInput", row.dataset.buyer || ""],
      ["transferClassInput", row.dataset.classroom || ""],
    ];
    mappings.forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
  };

  assetTabList?.addEventListener("click", () => switchAssetTab("list"));
  assetTabDetail?.addEventListener("click", () => {
    assetDetailForm?.reset();
    switchAssetTab("detail");
  });
  assetTabTransfer?.addEventListener("click", () => switchAssetTab("transfer"));

  assetDetailForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const than = {};
    Object.entries(fieldMap).forEach(([fieldId, jsonKey]) => {
      const el = document.getElementById(fieldId);
      if (el) than[jsonKey] = el.value.trim();
    });
    void (async () => {
      try {
        if (window.FmApi?.taoTaiSan) await window.FmApi.taoTaiSan(than);
      } catch (e) {
        window.alert("Gá»­i thÃªm tÃ i sáº£n lÃªn mÃ¡y chá»§ tháº¥t báº¡i.");
      }
      window.alert("ThÃªm tÃ i sáº£n thÃ nh cÃ´ng!");
      assetDetailForm.reset();
      switchAssetTab("list");
      await taiBangTaiSanTuApi();
    })();
  });

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

  assetTableBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const deleteBtn = target.closest(".asset-delete-btn");
    if (!deleteBtn) return;
    const row = deleteBtn.closest("tr");
    if (!row) return;
    const maTaiSan = row.dataset.assetId || "";
    const soThe = row.dataset.cardNumber || "";
    if (!window.confirm(`XÃ³a tÃ i sáº£n ${soThe || maTaiSan}?`)) return;
    if (maTaiSan && window.FmApi?.xoaTaiSan) {
      void (async () => {
        try {
          await window.FmApi.xoaTaiSan(maTaiSan);
          row.remove();
        } catch (e) {
          window.alert("XÃ³a trÃªn mÃ¡y chá»§ tháº¥t báº¡i.");
        }
      })();
      return;
    }
    row.remove();
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
      window.alert("Vui lÃ²ng chá»n tÃ i sáº£n cáº§n Ä‘Ã¡nh giÃ¡ láº¡i.");
      return;
    }
    const reviewer = reRateReviewer?.value.trim() || "";
    const stars = Number(reRateStars?.value || 0);
    const ratedAt = reRateDate?.value || "";
    const content = reRateNote?.value.trim() || "";
    if (!reviewer || !stars || !ratedAt || !content) {
      window.alert("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ ngÆ°á»i Ä‘Ã¡nh giÃ¡, sá»‘ sao, thá»i gian vÃ  ná»™i dung Ä‘Ã¡nh giÃ¡.");
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
    setAssetRatingHistory(assetRatingHistory);
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(key);
    window.alert("ÄÃ£ lÆ°u Ä‘Ã¡nh giÃ¡ láº¡i tÃ i sáº£n.");
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
    setAssetRatingHistory(assetRatingHistory);
    renderReRatingRows();
    refreshReRatingTable();
    renderHistoryPanel(card);
  });

  setupTableControls({
    tableBody: assetTableBody,
    searchInput: document.getElementById("assetListSearchInput"),
    pageSizeSelect: document.getElementById("assetListPageSizeSelect"),
  });
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
      assetProviderInput: "provider",
      assetCountryInput: "country",
      assetCardInput: "cardNumber",
      assetDepartmentInput: "department",
      assetClassInput: "classroom",
      assetTypeInput: "assetType",
      assetCategoryInput: "itemCategory",
      assetManufactureYearInput: "manufactureYear",
      assetUnitPriceInput: "unitPrice",
      assetQuantityInput: "quantity",
      assetOriginalPriceInput: "originalPrice",
      assetFundInput: "fundSource",
      assetUsageTimeInput: "usageTime",
      assetPurchaseDateInput: "purchaseDate",
      assetUsageYearInput: "usageYear",
      assetNoteInput: "note",
      assetBuyerInput: "buyer",
    };

    const tuDoiTuongTaiSan = (a) =>
      a && typeof a === "object"
        ? {
            id: a.id != null ? String(a.id) : payload.id != null ? String(payload.id) : "",
            assetName: a.assetName || a.asset_name || "",
            provider: a.provider || "",
            country: a.country || "",
            cardNumber: a.cardNumber || a.card_number || "",
            department: a.department || "",
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
            buyer: a.buyer || "",
          }
        : null;

    const applyAssetDetailFields = (p) => {
      Object.entries(fieldMap).forEach(([fieldId, dataKey]) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const v = p[dataKey];
        input.value = v != null && v !== "" ? String(v) : "";
      });
    };
    applyAssetDetailFields(payload);

    const idTaiSan = payload.id != null ? String(payload.id) : "";
    if (idTaiSan && window.FmApi?.layTaiSanTheoId) {
      void (async () => {
        try {
          const raw = await window.FmApi.layTaiSanTheoId(idTaiSan);
          const p2 = tuDoiTuongTaiSan(raw);
          if (p2) {
            applyAssetDetailFields({ ...payload, ...p2 });
            try {
              sessionStorage.setItem(ASSET_SELECTED_KEY, JSON.stringify({ ...payload, ...p2 }));
            } catch (_) {}
          }
        } catch (e) {
          console.warn("[TÃ i sáº£n] GET theo id:", e);
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
      void (async () => {
        try {
          if (maTaiSan && window.FmApi?.capNhatTaiSan) await window.FmApi.capNhatTaiSan(maTaiSan, than);
        } catch (e) {
          window.alert("Cáº­p nháº­t trÃªn mÃ¡y chá»§ tháº¥t báº¡i.");
        }
        window.alert("Cáº­p nháº­t tÃ i sáº£n thÃ nh cÃ´ng!");
        window.location.href = "assets.html";
      })();
    });
  }
}

if (duongDanLaTrang("liquidation.html")) {
  const liquidationPageTitle = document.getElementById("liquidationPageTitle");
  const liquidationMenuLinks = Array.from(document.querySelectorAll('.nav-submenu a[href*="liquidation.html"]'));
  const transferTabAllAssets = document.getElementById("transferTabAllAssets");
  const transferTabHistory = document.getElementById("transferTabHistory");
  const transferAllAssetsSection = document.getElementById("transferAllAssetsSection");
  const transferHistorySection = document.getElementById("transferHistorySection");
  const transferAllAssetsHeadRow = document.getElementById("transferAllAssetsHeadRow");
  const transferAllAssetsBody = document.getElementById("transferAllAssetsBody");
  const transferHistoryHeadRow = document.getElementById("transferHistoryHeadRow");
  const transferHistoryBody = document.getElementById("transferHistoryBody");
  const transferHistorySearchInput = document.getElementById("transferHistorySearchInput");
  const transferHistoryPageSizeSelect = document.getElementById("transferHistoryPageSizeSelect");
  const transferHistoryToolbar = document.getElementById("transferHistoryToolbar");
  const transferHistoryFooter = document.getElementById("transferHistoryFooter");
  const liquidationDetailSection = document.getElementById("liquidationDetailSection");
  const liquidationDetailTitle = document.getElementById("liquidationDetailTitle");
  const liqCardInput = document.getElementById("liqCardInput");
  const liqDateLabel = document.getElementById("liqDateLabel");
  const liqNameInput = document.getElementById("liqNameInput");
  const liqUnitInput = document.getElementById("liqUnitInput");
  const liqUnitLabel = document.getElementById("liqUnitLabel");
  const liqUserInput = document.getElementById("liqUserInput");
  const liqUserLabel = document.getElementById("liqUserLabel");
  const liqQuantityInput = document.getElementById("liqQuantityInput");
  const liqReasonInput = document.getElementById("liqReasonInput");
  const liqImageInput = document.getElementById("liqImageInput");
  const liqImageHint = document.getElementById("liqImageHint");
  const liqReasonLabel = document.getElementById("liqReasonLabel");
  const liqSubmitBtn = document.getElementById("liqSubmitBtn");
  let currentLiquidationMode = "dieu-chuyen";
  let refreshTransferHistoryTable = () => {};

  const transferModeConfig = {
    title: "Äiá»u chuyá»ƒn tÃ i sáº£n",
    tab1: "Táº¥t cáº£ tÃ i sáº£n",
    tab2: "Danh sÃ¡ch tÃ i sáº£n Ä‘iá»u chuyá»ƒn",
    allAssetsColumns: ["ID", "Sá»‘ tháº»", "TÃªn", "Khoa", "Lá»›p", "Chá»©c nÄƒng"],
    allAssetsRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "KT", "CT13KT01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["2", "022", "ÄÃ n Organ Yamaha E443", "TL-GD", "CT13TLGD01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["3", "021", "Ghitar classice", "TL-GD", "CT13TLGD01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["4", "020", "Cá»“ng chiÃªng ( bá»™ )", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["5", "019", "MÃ¡y vi tÃ­nh CMS", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["6", "018", "MÃ¡y vi tÃ­nh Acer", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["7", "017", "Báº£ng chá»‘ng lÃ³a", "NN", "CT13TA02", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
      ["8", "016", "Báº£ng mecal", "NN", "CT13TA01", '<button class="icon-btn transfer-truck-btn" type="button" title="Äiá»u chuyá»ƒn"><img src="../../assets/icons/transfer.svg" alt="Äiá»u chuyá»ƒn" /></button>'],
    ],
    historyColumns: ["ID", "Sá»‘ tháº»", "TÃªn", "ÄÆ¡n vá»‹ giao", "ÄÆ¡n vá»‹ nháº­n", "NgÆ°á»i giao", "NgÆ°á»i nháº­n", "NgÃ y giao"],
    historyRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "", "Khoa Kinh táº¿", "Tráº§n Tiáº¿n Há»£p", "Äá»— Nháº­t Thanh", "21/11/2016"],
      ["2", "023", "Tivi LCD Sony 46 in", "Khoa Kinh táº¿", "Khoa CÃ´ng Nghá»‡ ThÃ´ng Tin", "Äá»— Nháº­t Thanh", "VÃµ HoÃ ng PhÃºc", "25/11/2016"],
      ["3", "002", "BÃ n giÃ¡o viÃªn", "Khoa CÃ´ng Nghá»‡ ThÃ´ng Tin", "Khoa LÃ½-HÃ³a-Sinh", "VÃµ HoÃ ng PhÃºc", "Tráº§n Huá»³nh HÃ²a PhÃºc", "15/11/2016"],
      ["4", "001", "BÃ n há»p", "", "Khoa CÃ´ng Nghá»‡ ThÃ´ng Tin", "Tráº§n Huá»³nh HÃ²a PhÃºc", "Tráº§n Tiáº¿n Há»£p", "15/11/2016"],
    ],
    showToolbar: true,
    footerText: "Hiá»ƒn thá»‹ 1 cá»§a 1 trang",
  };

  const liquidationModeConfig = {
    title: "Thanh lÃ½ tÃ i sáº£n",
    tab1: "Táº¥t cáº£ tÃ i sáº£n",
    tab2: "Danh sÃ¡ch tÃ i sáº£n thanh lÃ½",
    allAssetsColumns: ["ID", "Sá»‘ tháº»", "TÃªn", "Khoa", "Lá»›p", "Chá»©c nÄƒng"],
    allAssetsRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "KT", "CT13KT01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["2", "022", "ÄÃ n Organ Yamaha E443", "TL-GD", "CT13TLGD01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["3", "021", "Ghitar classice", "TL-GD", "CT13TLGD01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["4", "020", "Cá»“ng chiÃªng ( bá»™ )", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["5", "019", "MÃ¡y vi tÃ­nh CMS", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["6", "018", "MÃ¡y vi tÃ­nh Acer", "NV-CTXH", "CT13CTXH01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["7", "017", "Báº£ng chá»‘ng lÃ³a", "NN", "CT13TA02", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
      ["8", "016", "Báº£ng mecal", "NN", "CT13TA01", '<button class="icon-btn liquidation-view-btn" type="button" title="Thanh lÃ½"><img src="../../assets/icons/sales.svg" alt="Thanh lÃ½" /></button>'],
    ],
    historyColumns: ["ID", "Sá»‘ tháº»", "TÃªn", "ÄÆ¡n vá»‹", "Sá»‘ lÆ°á»£ng", "NgÆ°á»i thanh lÃ½", "LÃ½ do", "áº¢nh minh há»a", "NgÃ y thanh lÃ½"],
    historyRows: [
      ["1", "023", "Tivi LCD Sony 46 in", "Khoa Kinh táº¿", "8", "Tráº§n Tiáº¿n Há»£p", "lÃ½ do nÃ¨", "KhÃ´ng cÃ³ hÃ¬nh", "21/11/2016"],
      ["2", "013", "Tá»§ sáº¯t 2 cÃ¡nh", "Khoa Nghá»‡ thuáº­t", "1", "Äá»— Nháº­t Thanh", "Tá»§ bá»‹ hÆ° há»ng", "KhÃ´ng cÃ³ hÃ¬nh", "21/11/2016"],
      ["3", "020", "Cá»“ng chiÃªng ( bá»™ )", "Khoa Ngá»¯ vÄƒn vÃ  CÃ´ng tÃ¡c xÃ£ há»™i", "3", "VÃµ HoÃ ng PhÃºc", "Sáº£n pháº©m bá»‹ lá»—i", "KhÃ´ng cÃ³ hÃ¬nh", "21/11/2016"],
      ["4", "019", "MÃ¡y vi tÃ­nh CMS", "Khoa Ngá»¯ vÄƒn vÃ  CÃ´ng tÃ¡c xÃ£ há»™i", "6", "Tráº§n Huá»³nh HÃ²a PhÃºc", "Sáº£n pháº©m bá»‹ lá»—i", "KhÃ´ng cÃ³ hÃ¬nh", "21/11/2016"],
    ],
    showToolbar: false,
    footerText: "",
  };

  const renderColumns = (headRow, columns) => {
    if (!headRow) return;
    headRow.innerHTML = columns.map((column) => `<th>${column}</th>`).join("");
  };

  const renderRows = (body, rows) => {
    if (!body) return;
    body.innerHTML = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
  };

  const applyLiquidationMode = () => {
    const mode = window.location.hash.replace("#", "").trim() === "thanh-ly" ? "thanh-ly" : "dieu-chuyen";
    currentLiquidationMode = mode;
    const config = mode === "thanh-ly" ? liquidationModeConfig : transferModeConfig;
    liquidationMenuLinks.forEach((link) => link.classList.remove("active"));
    const targetLabel = mode === "thanh-ly" ? "Thanh lÃ½ tÃ i sáº£n" : "Äiá»u chuyá»ƒn tÃ i sáº£n";
    const matchedLink = liquidationMenuLinks.find((link) => (link.textContent?.trim() || "") === targetLabel);
    if (matchedLink) matchedLink.classList.add("active");
    if (liquidationPageTitle) liquidationPageTitle.textContent = config.title;
    if (transferTabAllAssets) transferTabAllAssets.textContent = config.tab1;
    if (transferTabHistory) transferTabHistory.textContent = config.tab2;
    renderColumns(transferAllAssetsHeadRow, config.allAssetsColumns);
    renderRows(transferAllAssetsBody, config.allAssetsRows);
    renderColumns(transferHistoryHeadRow, config.historyColumns);
    renderRows(transferHistoryBody, config.historyRows);
    refreshTransferHistoryTable();
    if (transferHistoryToolbar) transferHistoryToolbar.hidden = !config.showToolbar;
    if (transferHistoryFooter) {
      transferHistoryFooter.hidden = !config.footerText;
      if (config.footerText) {
        const txt =
          typeof window.FmI18n?.t === "function"
            ? window.FmI18n.t("pager.showPageOf", { current: 1, total: 1 })
            : config.footerText;
        transferHistoryFooter.textContent = txt;
      } else {
        transferHistoryFooter.textContent = "";
      }
    }
    if (liquidationDetailSection) liquidationDetailSection.hidden = true;
  };

  const switchTransferTab = (tabName) => {
    const isAllAssets = tabName === "all-assets";
    const isHistory = tabName === "history";
    if (transferAllAssetsSection) transferAllAssetsSection.hidden = !isAllAssets;
    if (transferHistorySection) transferHistorySection.hidden = !isHistory;
    if (liquidationDetailSection) liquidationDetailSection.hidden = true;
    transferTabAllAssets?.classList.toggle("tab-active", isAllAssets);
    transferTabHistory?.classList.toggle("tab-active", isHistory);
  };

  const departmentMap = {
    KT: "Khoa Kinh táº¿",
    "TL-GD": "Khoa Nghá»‡ thuáº­t",
    "NV-CTXH": "Khoa Ngá»¯ vÄƒn vÃ  CÃ´ng tÃ¡c xÃ£ há»™i",
    NN: "Khoa Ngoáº¡i ngá»¯",
    NT: "Khoa Ná»™i trÃº",
  };

  transferTabAllAssets?.addEventListener("click", () => switchTransferTab("all-assets"));
  transferTabHistory?.addEventListener("click", () => switchTransferTab("history"));
  liqImageInput?.addEventListener("change", () => {
    const files = Array.from(liqImageInput.files || []);
    if (!liqImageHint) return;
    if (files.length === 0) {
      liqImageHint.textContent = "Báº¥m Ä‘á»ƒ chá»n áº£nh minh há»a";
      return;
    }
    liqImageHint.textContent = files.map((f) => f.name).join(", ");
  });

  transferAllAssetsBody?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const triggerBtn = target.closest(".liquidation-view-btn, .transfer-truck-btn");
    if (!triggerBtn) return;
    const row = triggerBtn.closest("tr");
    if (!row) return;
    const cells = row.querySelectorAll("td");
    const card = cells[1]?.textContent?.trim() || "";
    const assetName = cells[2]?.textContent?.trim() || "";
    const deptCode = cells[3]?.textContent?.trim() || "";
    const defaultPeople = ["Tráº§n Tiáº¿n Há»£p", "Äá»— Nháº­t Thanh", "VÃµ HoÃ ng PhÃºc", "Tráº§n Huá»³nh HÃ²a PhÃºc"];
    const picker = Number(card) % defaultPeople.length;

    if (liqCardInput) liqCardInput.value = card;
    if (liqNameInput) liqNameInput.value = assetName;
    if (liqUnitInput) liqUnitInput.value = departmentMap[deptCode] || deptCode;
    if (liqUserInput) liqUserInput.value = defaultPeople[picker];
    if (liqQuantityInput) liqQuantityInput.value = "";
    if (liqReasonInput) liqReasonInput.value = "";

    const isTransferMode = currentLiquidationMode === "dieu-chuyen";
    if (liquidationDetailTitle) liquidationDetailTitle.textContent = isTransferMode ? "ThÃ´ng tin Ä‘iá»u chuyá»ƒn" : "ThÃ´ng tin thanh lÃ½";
    if (liqDateLabel) liqDateLabel.textContent = isTransferMode ? "NgÃ y Ä‘iá»u chuyá»ƒn" : "NgÃ y thanh lÃ½";
    if (liqReasonLabel) liqReasonLabel.textContent = isTransferMode ? "Ghi chÃº Ä‘iá»u chuyá»ƒn" : "LÃ½ do thanh lÃ½";
    if (liqReasonInput) liqReasonInput.placeholder = isTransferMode ? "Nháº­p ghi chÃº Ä‘iá»u chuyá»ƒn" : "Nháº­p lÃ½ do thanh lÃ½";
    if (liqUnitLabel) liqUnitLabel.textContent = isTransferMode ? "ÄÆ¡n vá»‹ nháº­n" : "ÄÆ¡n vá»‹";
    if (liqUserLabel) liqUserLabel.textContent = isTransferMode ? "NgÆ°á»i nháº­n" : "NgÆ°á»i thanh lÃ½";
    if (liqSubmitBtn) liqSubmitBtn.textContent = isTransferMode ? "Äiá»u chuyá»ƒn" : "Thanh lÃ½";

    if (transferAllAssetsSection) transferAllAssetsSection.hidden = true;
    if (transferHistorySection) transferHistorySection.hidden = true;
    if (liquidationDetailSection) liquidationDetailSection.hidden = false;
    transferTabAllAssets?.classList.remove("tab-active");
    transferTabHistory?.classList.remove("tab-active");
  });

  window.addEventListener("hashchange", applyLiquidationMode);
  applyLiquidationMode();
  window.addEventListener("fm-i18n-applied", () => {
    const mode = window.location.hash.replace("#", "").trim() === "thanh-ly" ? "thanh-ly" : "dieu-chuyen";
    const config = mode === "thanh-ly" ? liquidationModeConfig : transferModeConfig;
    if (transferHistoryFooter && config.footerText) {
      transferHistoryFooter.textContent =
        typeof window.FmI18n?.t === "function"
          ? window.FmI18n.t("pager.showPageOf", { current: 1, total: 1 })
          : config.footerText;
    }
  });
  switchTransferTab("all-assets");

  refreshTransferHistoryTable = setupTableControls({
    tableBody: transferHistoryBody,
    searchInput: transferHistorySearchInput,
    pageSizeSelect: transferHistoryPageSizeSelect,
  });

  document.getElementById("liquidationExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const iso = new Date().toISOString();
    if (liquidationDetailSection && !liquidationDetailSection.hidden) {
      const f = document.getElementById("liquidationDetailForm");
      if (f) {
        Fm.download(`liquidation-detail-${stamp}.json`, {
          exportedAt: iso,
          form: Fm.formToPlainObject(f),
        });
        return;
      }
    }
    if (transferAllAssetsSection && !transferAllAssetsSection.hidden && transferAllAssetsBody) {
      Fm.download(`liquidation-all-assets-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(transferAllAssetsBody),
      });
      return;
    }
    if (transferHistorySection && !transferHistorySection.hidden && transferHistoryBody) {
      Fm.download(`liquidation-history-${stamp}.json`, {
        exportedAt: iso,
        rows: Fm.tbodyToObjectsAuto(transferHistoryBody),
      });
    }
  });
}

if (duongDanLaTrang("statistics.html")) {
  const statisticsTableBody = document.getElementById("statisticsTableBody");
  const statisticsSearchInput = document.getElementById("statisticsSearchInput");
  const statisticsPageSizeSelect = document.getElementById("statisticsPageSizeSelect");
  const statisticsBuildingFilter = document.getElementById("statisticsBuildingFilter");
  const statisticsClassFilter = document.getElementById("statisticsClassFilter");
  const statisticsFundingFilter = document.getElementById("statisticsFundingFilter");
  const statisticsStatusFilter = document.getElementById("statisticsStatusFilter");

  const filterConfigs = [
    { element: statisticsBuildingFilter, columnIndex: 4 },
    { element: statisticsClassFilter, columnIndex: 5 },
    { element: statisticsFundingFilter, columnIndex: 7 },
    { element: statisticsStatusFilter, columnIndex: 8 },
  ];

  const getRows = () => Array.from(statisticsTableBody?.querySelectorAll("tr") || []);

  const populateFilterOptions = () => {
    const rows = getRows();
    filterConfigs.forEach(({ element, columnIndex }) => {
      if (!element) return;
      const values = Array.from(
        new Set(
          rows
            .map((row) => row.children[columnIndex]?.textContent?.trim() || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, "vi"));

      element.innerHTML = `<option value="All">All</option>${values.map((value) => `<option value="${value}">${value}</option>`).join("")}`;
    });
  };

  const applyStatisticsFilter = setupTableControls({
    tableBody: statisticsTableBody,
    searchInput: statisticsSearchInput,
    pageSizeSelect: statisticsPageSizeSelect,
    customFilter: (row) =>
      filterConfigs.every(({ element, columnIndex }) => {
        if (!element) return true;
        const selectedValue = element.value;
        if (!selectedValue || selectedValue === "All") return true;
        const cellValue = row.children[columnIndex]?.textContent?.trim() || "";
        return cellValue === selectedValue;
      }),
  });

  filterConfigs.forEach(({ element }) => {
    element?.addEventListener("change", applyStatisticsFilter);
  });
  populateFilterOptions();
  applyStatisticsFilter();
}

if (duongDanLaTrang("room-detail.html")) {
  const params = new URLSearchParams(window.location.search);
  const roomCode = params.get("room") || "NA-001";
  const idPhongTuUrl = params.get("id") || "";
  const applyRoomDetail = (profile) => {
    const roomCodeLabel = document.getElementById("roomCodeLabel");
    if (roomCodeLabel) roomCodeLabel.textContent = roomCode;
    const mappings = [
      ["roomTeacher", profile.teacher],
      ["roomClass", profile.classStudying || profile.classUsing || profile.className],
      ["roomDesks", profile.desks],
      ["roomChairs", profile.chairs],
      ["roomSpeakers", profile.speakers],
      ["roomAirConditioner", profile.airConditioner],
      ["roomMicrophone", profile.microphone],
      ["roomGlassDoor", profile.glassDoor],
      ["roomCeilingFan", profile.ceilingFan],
      ["roomCurtain", profile.curtain],
    ];
    mappings.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value != null ? String(value) : "";
    });
  };
  void (async () => {
    try {
      const api = window.FmApi;
      if (!api) {
        applyRoomDetail(getRoomProfile(roomCode));
        return;
      }
      let raw = null;
      if (idPhongTuUrl && typeof api.layPhongTheoId === "function") {
        raw = await api.layPhongTheoId(idPhongTuUrl);
      } else if (typeof api.layDanhSachPhong === "function") {
        const ds = await api.layDanhSachPhong();
        raw = ds.find((r) => String(r.roomCode || r.room_code || "").trim() === roomCode);
      }
      const fromApi = mapRoomApiToProfile(raw);
      applyRoomDetail(fromApi || getRoomProfile(roomCode));
    } catch (e) {
      console.warn("[PhÃ²ng] Chi tiáº¿t API:", e);
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
    if (roomEditBuildingLabel) roomEditBuildingLabel.textContent = `TÃ²a nhÃ  ${buildingParam}`;
  }
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
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
      const api = window.FmApi;
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
      console.warn("[PhÃ²ng] Táº£i form sá»­a API:", e);
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
      deskCount: Number(document.getElementById("roomDesksInput")?.value) || 0,
      chairCount: Number(document.getElementById("roomChairsInput")?.value) || 0,
      speakerCount: Number(document.getElementById("roomSpeakersInput")?.value) || 0,
      airConditionerCount: Number(document.getElementById("roomAirConditionerInput")?.value) || 0,
      microphoneCount: Number(document.getElementById("roomMicrophoneInput")?.value) || 0,
      glassDoorStatus: getRadioValueByName("roomGlassDoor"),
      ceilingFanCount: Number(document.getElementById("roomCeilingFanInput")?.value) || 0,
      curtainStatus: getRadioValueByName("roomCurtain"),
    };
    void (async () => {
      try {
        if (idPhongCapNhat && window.FmApi?.capNhatPhong) {
          await window.FmApi.capNhatPhong(idPhongCapNhat, jsonCapNhatPhong);
        }
      } catch (e) {
        console.warn("[PhÃ²ng] Cáº­p nháº­t API:", e);
      }
    })();
    if (b) {
      const inAdded = (getRoomAdditions()[b] || []).some((r) => r[0] === roomCode);
      if (inAdded) {
        addRoomRowToBuilding(b, [roomCode, floor, className, "-", status, capacity]);
      }
    }
    window.alert("Cáº­p nháº­t phÃ²ng thÃ nh cÃ´ng!");
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
  if (addLbl) addLbl.textContent = `TÃ²a nhÃ  ${building}`;
  if (form) {
    fillK65ClassSelects(form);
    form.addEventListener("input", () => form.classList.remove("submitted"));
    form.addEventListener("change", () => form.classList.remove("submitted"));
  }
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
      window.alert("MÃ£ phÃ²ng nÃ y Ä‘Ã£ cÃ³ trong tÃ²a Ä‘Ã£ chá»n. Vui lÃ²ng nháº­p mÃ£ khÃ¡c.");
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
      deskCount: Number(document.getElementById("roomDesksInput")?.value) || 0,
      chairCount: Number(document.getElementById("roomChairsInput")?.value) || 0,
      speakerCount: Number(document.getElementById("roomSpeakersInput")?.value) || 0,
      airConditionerCount: Number(document.getElementById("roomAirConditionerInput")?.value) || 0,
      microphoneCount: Number(document.getElementById("roomMicrophoneInput")?.value) || 0,
      glassDoorStatus: getRadioValueByName("roomGlassDoor"),
      ceilingFanCount: Number(document.getElementById("roomCeilingFanInput")?.value) || 0,
      curtainStatus: getRadioValueByName("roomCurtain"),
    };
    void (async () => {
      try {
        if (window.FmApi?.taoPhong) await window.FmApi.taoPhong(jsonPhong);
      } catch (e) {
        console.warn("[PhÃ²ng] ThÃªm API:", e);
      }
    })();
    window.alert("ThÃªm phÃ²ng thÃ nh cÃ´ng!");
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
    if (!r) return "â€”";
    const map = {
      ADMIN: "Administrator",
      MANAGER: "Quáº£n lÃ½",
      STAFF: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      STUDENT: "Sinh viÃªn",
    };
    return map[r.toUpperCase()] || r;
  };

  const emailFromUsername = (username) => {
    const name = String(username || "").trim();
    if (!name) return "â€”";
    return name.includes("@") ? name : `${name}@hotmail.com`;
  };

  const contactProfiles = {
    "tien-hop": {
      name: "Tráº§n Tiáº¿n Há»£p",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      phone: "1263751380",
      email: "trantienhop@hotmail.com",
      address: "BÃ¬nh Äá»‹nh",
      avatar: "/assets/images/avatar/avatar_1.jpg",
    },
    "nhat-thanh": {
      name: "Äá»— Nháº­t Thanh",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      phone: "1263751380",
      email: "donhatthanh@hotmail.com",
      address: "An Giang",
      avatar: "/assets/images/avatar/avatar_2.jpg",
    },
    "hoang-phuc": {
      name: "VÃµ HoÃ ng PhÃºc",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      phone: "1234459015",
      email: "vohoangphuc@hotmail.com",
      address: "SÃ³c TrÄƒng",
      avatar: "/assets/images/avatar/avatar_3.jpg",
    },
    "huynh-hoa-phuc": {
      name: "Tráº§n Huá»³nh HÃ²a PhÃºc",
      role: "CÃ¡n bá»™ quáº£n lÃ½ tÃ i sáº£n",
      phone: "1263751380",
      email: "tranhuynhhoaphuc@hotmail.com",
      address: "Tiá»n Giang",
      avatar: "/assets/images/avatar/avatar_4.jpg",
    },
  };

  const dienTuApi = (u) => {
    if (!u) return;
    const fullName = u.fullName || u.fullname || u.username || "â€”";
    const av =
      window.UserAvatar && typeof window.UserAvatar.resolve === "function"
        ? window.UserAvatar.resolve(u)
        : "/assets/images/avatar/avatar_1.jpg";
    if (profileName) profileName.textContent = String(fullName).toUpperCase();
    if (profileRole) profileRole.textContent = roleLabel(u.role);
    if (profilePhone) profilePhone.textContent = u.phoneNumber || u.phone_number || "â€”";
    if (profileEmail) profileEmail.textContent = emailFromUsername(u.username);
    if (profileAddress) profileAddress.textContent = u.address || "â€”";
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
      if (userIdTuUrl && window.FmApi?.layNguoiDungTheoId) {
        dienTuApi(await window.FmApi.layNguoiDungTheoId(userIdTuUrl));
        return;
      }
      if (window.FmApi?.layDanhSachNguoiDung) {
        const list = await window.FmApi.layDanhSachNguoiDung();
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
