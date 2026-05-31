/**
 * Kiểm kê định kỳ — dashboard/audit-periodic.html (bảng rút gọn)
 */
(function auditPeriodicPage() {
  const api = window.FmApi || window.CoSoApi;
  if (!api) return;

  const COLS = 6;

  let currentAudit = null;
  let details = [];
  let readOnly = false;

  const $ = (id) => document.getElementById(id);

  function t(key, params) {
    const v = window.FmI18n?.t?.(key, params);
    return v != null && v !== key ? v : key;
  }

  function auditStatusLabel(code) {
    const key = `audit.auditStatus.${code}`;
    const v = t(key);
    return v !== key ? v : code || "";
  }

  function scopeSummary(audit) {
    if (!audit) return "";
    if (audit.scopeType === "ROOM") {
      return t("audit.metaScopeRoom", { value: audit.scopeValue });
    }
    return t("audit.metaScopeBuilding", { value: audit.scopeValue });
  }

  function roomLabel(d) {
    const room = d.roomCode || d.systemRoom || "—";
    if (d.roomFloor != null && d.roomFloor !== "") {
      return `${t("audit.floorShort", { floor: d.roomFloor })} · ${room}`;
    }
    return room;
  }

  function syncScopeUi() {
    const scope = $("auditScopeTypeSelect")?.value || "BUILDING";
    const roomLabelEl = $("auditRoomLabel");
    const buildingLabel = $("auditBuildingLabel");
    if (scope === "ROOM") {
      roomLabelEl?.classList.add("is-visible");
      if (buildingLabel) buildingLabel.style.display = "none";
    } else {
      roomLabelEl?.classList.remove("is-visible");
      if (buildingLabel) buildingLabel.style.display = "";
    }
  }

  function setToolbarState() {
    const hasAudit = Boolean(currentAudit?.id);
    const completed = currentAudit?.status === "COMPLETED";
    readOnly = completed;
    $("auditSaveBtn").disabled = !hasAudit || completed;
    $("auditCompleteBtn").disabled = !hasAudit || completed;
    $("auditExportJsonBtn").disabled = !hasAudit;
  }

  function renderMeta() {
    const meta = $("auditMeta");
    if (!meta || !currentAudit) {
      meta?.setAttribute("hidden", "");
      return;
    }
    meta.removeAttribute("hidden");
    const matched = details.filter((d) => d.matched).length;
    meta.textContent = [
      currentAudit.name,
      scopeSummary(currentAudit),
      `${t("audit.metaStatus")}: ${auditStatusLabel(currentAudit.status)}`,
      `${t("audit.metaItems")}: ${details.length}`,
      `${t("audit.metaMatched")}: ${matched}/${details.length}`,
    ].join(" · ");
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderTable(filterText) {
    const tbody = $("auditDetailsBody");
    if (!tbody) return;
    const q = (filterText || $("auditSearchInput")?.value || "").trim().toLowerCase();
    if (!currentAudit || !details.length) {
      tbody.innerHTML = `<tr><td colspan="${COLS}">${escapeHtml(t("audit.emptyHint"))}</td></tr>`;
      return;
    }
    const rows = details.filter((d) => {
      if (!q) return true;
      const hay = [d.cardNumber, d.assetName, d.systemRoom, d.roomCode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${COLS}">${escapeHtml(t("audit.noRows"))}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows
      .map((d, index) => {
        const rowClass = d.matched ? "audit-row-match" : "audit-row-mismatch";
        const disabled = readOnly ? "disabled" : "";
        const actQty = d.actualQty != null ? d.actualQty : d.systemQty ?? "";
        return `<tr class="${rowClass}" data-detail-id="${d.id}">
          <td class="audit-col-stt">${index + 1}</td>
          <td>${escapeHtml(roomLabel(d))}</td>
          <td>${escapeHtml(d.assetName)}</td>
          <td>${escapeHtml(d.systemQty)}</td>
          <td><input type="number" min="0" class="audit-act-qty" value="${escapeHtml(actQty)}" ${disabled} /></td>
          <td><input type="text" class="audit-note-input audit-act-note" value="${escapeHtml(d.note || "")}" ${disabled} /></td>
        </tr>`;
      })
      .join("");
  }

  function collectRowsFromDom() {
    const tbody = $("auditDetailsBody");
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll("tr[data-detail-id]")).map((tr) => {
      const id = Number(tr.getAttribute("data-detail-id"));
      const qty = tr.querySelector(".audit-act-qty")?.value;
      const note = tr.querySelector(".audit-act-note")?.value;
      return {
        id,
        actualQty: qty === "" ? null : Number(qty),
        note: note?.trim() || null,
      };
    });
  }

  async function loadAuditList() {
    const select = $("auditSelect");
    if (!select) return;
    const list = await api.layDanhSachKiemKe();
    const prev = select.value;
    select.innerHTML = `<option value="">${escapeHtml(t("audit.selectPlaceholder"))}</option>`;
    list.forEach((a) => {
      const opt = document.createElement("option");
      opt.value = String(a.id);
      opt.textContent = `${a.name} (${a.scopeValue}) — ${auditStatusLabel(a.status)}`;
      select.appendChild(opt);
    });
    if (prev && list.some((a) => String(a.id) === prev)) {
      select.value = prev;
    }
  }

  async function loadAudit(id) {
    const data = await api.layKiemKeTheoId(id);
    currentAudit = data;
    details = Array.isArray(data.details) ? data.details : [];
    readOnly = data.status === "COMPLETED";
    renderMeta();
    renderTable();
    setToolbarState();
  }

  async function onCreate() {
    const name = $("auditNameInput")?.value?.trim();
    const scopeType = $("auditScopeTypeSelect")?.value || "BUILDING";
    const building = $("auditBuildingInput")?.value?.trim();
    const room = $("auditRoomInput")?.value?.trim();
    if (!name) {
      window.alert(t("audit.errName"));
      return;
    }
    const body = { name, scopeType };
    if (scopeType === "BUILDING") {
      if (!building) {
        window.alert(t("audit.errBuilding"));
        return;
      }
      body.scopeValue = building;
      body.buildingCode = building;
    } else {
      if (!room) {
        window.alert(t("audit.errRoom"));
        return;
      }
      body.scopeValue = room;
      body.roomCode = room;
    }
    try {
      const created = await api.taoKiemKe(body);
      await loadAuditList();
      $("auditSelect").value = String(created.id);
      await loadAudit(created.id);
    } catch (e) {
      window.alert(e?.than?.message || e?.message || t("audit.errCreate"));
    }
  }

  async function onSave() {
    if (!currentAudit?.id || readOnly) return;
    const rows = collectRowsFromDom();
    try {
      const updated = await api.capNhatChiTietKiemKe(currentAudit.id, rows);
      currentAudit = updated;
      details = updated.details || [];
      renderMeta();
      renderTable();
    } catch (e) {
      window.alert(e?.than?.message || e?.message || t("audit.errSave"));
    }
  }

  async function onComplete() {
    if (!currentAudit?.id || readOnly) return;
    if (!window.confirm(t("audit.confirmComplete"))) return;
    try {
      const updated = await api.hoanTatKiemKe(currentAudit.id);
      await loadAuditList();
      $("auditSelect").value = String(updated.id);
      await loadAudit(updated.id);
    } catch (e) {
      window.alert(e?.than?.message || e?.message || t("audit.errComplete"));
    }
  }

  async function onExport() {
    if (!currentAudit?.id) return;
    const Fm = window.FmExportJson;
    if (!Fm) return;
    try {
      const payload = await api.xuatKiemKeJson(currentAudit.id);
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      Fm.download(`kiem-ke-${currentAudit.id}-${stamp}.json`, payload);
    } catch (e) {
      window.alert(e?.than?.message || e?.message || t("audit.errExport"));
    }
  }

  function refreshI18n() {
    renderMeta();
    if (currentAudit?.id) renderTable();
    void loadAuditList();
  }

  function init() {
    syncScopeUi();
    $("auditScopeTypeSelect")?.addEventListener("change", syncScopeUi);
    $("auditCreateBtn")?.addEventListener("click", () => void onCreate());
    $("auditSaveBtn")?.addEventListener("click", () => void onSave());
    $("auditCompleteBtn")?.addEventListener("click", () => void onComplete());
    $("auditExportJsonBtn")?.addEventListener("click", () => void onExport());
    $("auditSelect")?.addEventListener("change", (ev) => {
      const id = ev.target.value;
      if (!id) {
        currentAudit = null;
        details = [];
        renderMeta();
        renderTable();
        setToolbarState();
        return;
      }
      void loadAudit(id);
    });
    $("auditSearchInput")?.addEventListener("input", () => renderTable());
    window.addEventListener("fm-i18n-applied", refreshI18n);

    const boot = () => {
      void loadAuditList().catch(() => {});
      setToolbarState();
    };
    if (window.FmI18n?.init) {
      void window.FmI18n.init().then(boot).catch(boot);
    } else {
      boot();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
