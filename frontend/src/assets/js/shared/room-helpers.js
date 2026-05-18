(function exposeRoomHelpers(window) {
  const ROOM_UPDATES_KEY = "roomUpdates";
  const ROOM_ADDITIONS_KEY = "roomAdditionsByBuilding";

  /** Các mã lớp (cột *Lớp đang sử dụng* / select thêm-sửa phòng) — tương ứng CQ.65.* bỏ tiền tố CQ.65. */
  const K65_CLASS_OPTIONS = [
    "LOGISTICS",
    "KTCĐT+CKĐL",
    "KTĐTVT",
    "KTOTO",
    "KTXD",
    "KTXDCTGT.1",
    "KTXDCTGT.2",
    "NKTXD.1+NKTXD.2",
    "QLXD+KTĐ",
    "TĐHĐK",
    "CKĐL",
    "CKĐL_N_1",
    "CKĐL_N_2",
    "KTCĐT",
    "KTCĐT_N_1",
    "KTCĐT_N_2",
    "KTOTO_N_1",
    "KTOTO_N_2",
    "KTOTO_N_3",
    "KTVTAI",
    "CNTT",
    "CNTT_N_1",
    "CNTT_N_2",
    "CNTT_N_3",
    "KTĐ",
    "KTĐ_N_1",
    "KTĐ_N_2",
    "KTĐTVT_N_1",
    "KTĐTVT_N_2",
    "KTĐTVT_N_3",
    "QTDL&LH",
    "KIENTRUC",
    "NKTXD.1",
    "NKTXD.2",
    "KTTH",
    "KDQT",
    "QTKD",
    "TC-NH",
    "QLXD",
  ];

  const getRoomUpdates = () => {
    try {
      return JSON.parse(localStorage.getItem(ROOM_UPDATES_KEY) || "{}");
    } catch (_) {
      return {};
    }
  };

  const setRoomUpdate = (roomCode, payload) => {
    const updates = getRoomUpdates();
    updates[roomCode] = payload;
    localStorage.setItem(ROOM_UPDATES_KEY, JSON.stringify(updates));
  };

  const ROOM_STATUS_VI = {
    IN_USE: "Đang sử dụng",
    AVAILABLE: "Trống",
    MAINTENANCE: "Bảo trì",
  };

  const GLASS_DOOR_VI = {
    INTACT: "Không vỡ",
    CRACKED: "Có vỡ",
  };

  const CURTAIN_VI = {
    YES: "Có",
    NO: "Không",
  };

  const hienThiTuMap = (raw, map) => {
    const s = String(raw ?? "").trim();
    if (!s) return "";
    return map[s] || map[s.toUpperCase()] || s;
  };

  /** Map JSON phòng từ API (camelCase hoặc snake_case) sang shape dùng chung với getRoomProfile. */
  const mapRoomApiToProfile = (r) => {
    if (!r || typeof r !== "object") return null;
    const pick = (a, b, def = "") => {
      const x = r[a];
      const y = r[b];
      if (x != null && x !== "") return x;
      if (y != null && y !== "") return y;
      return def;
    };
    const numStr = (a, b) => {
      const v = pick(a, b, "");
      return v === "" || v == null ? "" : String(v);
    };
    const classUsing = String(pick("classUsing", "class_using", ""));
    const classStudying = String(pick("classStudying", "class_studying", ""));
    const lop = classStudying || classUsing;
    return {
      buildingCode: String(pick("buildingCode", "building_code", "")),
      teacher: String(pick("teacherName", "teacher_name", "")),
      classUsing: lop,
      className: lop,
      classStudying: lop,
      floor: numStr("floor", "floor"),
      desks: numStr("deskCount", "desk_count"),
      chairs: numStr("chairCount", "chair_count"),
      speakers: numStr("speakerCount", "speaker_count"),
      airConditioner: numStr("airConditionerCount", "air_conditioner_count"),
      microphone: numStr("microphoneCount", "microphone_count"),
      glassDoor: hienThiTuMap(pick("glassDoorStatus", "glass_door_status", ""), GLASS_DOOR_VI),
      ceilingFan: numStr("ceilingFanCount", "ceiling_fan_count"),
      curtain: hienThiTuMap(pick("curtainStatus", "curtain_status", ""), CURTAIN_VI),
      status: hienThiTuMap(pick("status", "status", ""), ROOM_STATUS_VI),
      capacity: numStr("capacity", "capacity"),
    };
  };

  const getRoomProfile = (roomCode) => {
    const updates = getRoomUpdates();
    const saved = updates[roomCode] || {};
    const defaults = {
      buildingCode: "",
      teacher: "Nguyễn Văn A",
      className: "CNTT",
      classStudying: "CNTT",
      floor: "",
      desks: "30",
      chairs: "60",
      speakers: "2",
      airConditioner: "2",
      microphone: "1",
      glassDoor: "Không vỡ",
      ceilingFan: "4",
      curtain: "Có",
      status: "Đang sử dụng",
      capacity: "50",
    };
    return { ...defaults, ...saved };
  };

  const getRadioValueByName = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  };

  const setRadioValueByName = (name, value) => {
    if (value == null || value === "") return;
    document.querySelectorAll(`input[name="${name}"]`).forEach((el) => {
      el.checked = el.value === value;
    });
  };

  const fillK65ClassSelects = (root = document) => {
    root.querySelectorAll("select[data-k65-class]").forEach((sel) => {
      const keep = sel.value;
      sel.innerHTML = `<option value="">Chọn lớp</option>${K65_CLASS_OPTIONS.map(
        (v) => `<option value="${v}">${v}</option>`,
      ).join("")}`;
      if (keep && K65_CLASS_OPTIONS.includes(keep)) sel.value = keep;
    });
  };

  const getRoomAdditions = () => {
    try {
      return JSON.parse(localStorage.getItem(ROOM_ADDITIONS_KEY) || "{}");
    } catch (_) {
      return {};
    }
  };

  const setRoomAdditions = (data) => {
    localStorage.setItem(ROOM_ADDITIONS_KEY, JSON.stringify(data));
  };

  /** [mã, tầng, lớp, slot, trạng thái, sức chứa] */
  const addRoomRowToBuilding = (buildingCode, row) => {
    const all = getRoomAdditions();
    if (!all[buildingCode]) all[buildingCode] = [];
    const list = all[buildingCode];
    const idx = list.findIndex((r) => r[0] === row[0]);
    if (idx >= 0) list[idx] = row;
    else list.push(row);
    setRoomAdditions(all);
  };

  const mapRoomStatusLabel = (raw) => {
    const s = hienThiTuMap(raw, ROOM_STATUS_VI);
    return s || String(raw ?? "").trim() || "Trống";
  };

  window.AppRoomHelpers = {
    ...(window.AppRoomHelpers || {}),
    K65_CLASS_OPTIONS,
    mapRoomStatusLabel,
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
  };
})(window);
