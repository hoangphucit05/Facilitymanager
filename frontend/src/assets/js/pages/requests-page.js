/**
 * Trang quản lý yêu cầu sinh viên — dashboard/requests.html
 */
(function requestsPageScope() {
  const api = () => window.FmApi || window.CoSoApi;

  const rt = (key, fb) => {
    const v = window.FmI18n?.t?.(key);
    return v != null && v !== key ? v : fb;
  };

  const priorityCode = (code) => String(code || "").toUpperCase();

  const labelPriority = (code) => {
    const c = priorityCode(code);
    if (c === "HIGH") return rt("requests.priority.high", "Khẩn cấp");
    if (c === "LOW") return rt("requests.priority.low", "Theo dõi");
    return rt("requests.priority.normal", "Bình thường");
  };

  const priorityClass = (code) => {
    const c = priorityCode(code);
    if (c === "HIGH") return "request-priority--high";
    if (c === "LOW") return "request-priority--low";
    return "request-priority--normal";
  };

  const sortByIdAsc = (list) =>
    list.slice().sort((a, b) => {
      const na = Number(a?.id);
      const nb = Number(b?.id);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), undefined, { numeric: true });
    });

  const labelStatus = (code) => {
    const c = String(code || "").toUpperCase();
    if (c === "IN_PROGRESS") return rt("requests.status.inProgress", "Đang xử lý");
    if (c === "RESOLVED") return rt("requests.status.resolved", "Đã xử lý");
    if (c === "CLOSED") return rt("requests.status.closed", "Đã đóng");
    return rt("requests.status.new", "Mới");
  };

  const labelManagerGroup = (code) => {
    const c = String(code || "").toUpperCase();
    if (c === "THIET_BI") return rt("requests.group.equipment", "Thiết bị");
    if (c === "CNTT") return rt("requests.group.it", "CNTT");
    if (c === "CSVC") return rt("requests.group.facilities", "CSVC");
    return code || "—";
  };

  let detailMaskEl = null;
  let assignMaskEl = null;
  let assigneesCache = null;
  let refreshRequestsTable = () => {};

  const openDetailModal = () => {
    if (!detailMaskEl) detailMaskEl = document.getElementById("requestDetailMask");
    if (detailMaskEl) {
      detailMaskEl.classList.add("is-open");
      detailMaskEl.style.display = "flex";
      detailMaskEl.setAttribute("aria-hidden", "false");
      document.body.classList.add("request-detail-open");
    }
  };

  const openAssignModal = () => {
    if (!assignMaskEl) assignMaskEl = document.getElementById("requestAssignMask");
    if (assignMaskEl) {
      assignMaskEl.classList.add("is-open");
      assignMaskEl.style.display = "flex";
      assignMaskEl.setAttribute("aria-hidden", "false");
    }
  };

  const closeAssignModal = () => {
    if (assignMaskEl) {
      assignMaskEl.classList.remove("is-open");
      assignMaskEl.style.display = "";
      assignMaskEl.setAttribute("aria-hidden", "true");
    }
    const err = document.getElementById("requestAssignError");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
  };

  const setAssignError = (message) => {
    const el = document.getElementById("requestAssignError");
    if (!el) return;
    const msg = String(message || "").trim();
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  };

  const loadAssigneeOptions = async () => {
    const select = document.getElementById("requestAssignUserId");
    if (!select) return;
    const placeholder = rt("requests.assignSelectPlaceholder", "— Chọn người xử lý —");
    select.innerHTML = `<option value="">${esc(placeholder)}</option>`;
    try {
      if (!assigneesCache) {
        if (!api()?.layDanhSachNguoiPhanViec) throw new Error("no api");
        assigneesCache = await api().layDanhSachNguoiPhanViec();
      }
      const list = Array.isArray(assigneesCache) ? assigneesCache : [];
      list.forEach((u) => {
        const id = u.id;
        if (id == null) return;
        const name = String(u.fullName || u.username || `#${id}`).trim();
        const role = String(u.role || "").trim();
        const label = role ? `${name} (${role})` : name;
        const opt = document.createElement("option");
        opt.value = String(id);
        opt.textContent = label;
        select.appendChild(opt);
      });
    } catch (e) {
      console.warn(e);
      setAssignError(rt("requests.assignLoadUsersError", "Không tải được danh sách người dùng."));
    }
  };

  const showAssignModal = async (requestId) => {
    const idInput = document.getElementById("requestAssignRequestId");
    const select = document.getElementById("requestAssignUserId");
    if (idInput) idInput.value = String(requestId);
    if (select) select.value = "";
    setAssignError("");
    openAssignModal();
    await loadAssigneeOptions();
  };

  const confirmAssign = async () => {
    const id = document.getElementById("requestAssignRequestId")?.value;
    const assigneeId = document.getElementById("requestAssignUserId")?.value;
    if (!id) return;
    if (!assigneeId) {
      setAssignError(rt("requests.assignNeedUser", "Vui lòng chọn người xử lý."));
      return;
    }
    try {
      await api().patchYeuCau(id, {
        status: "IN_PROGRESS",
        assignedToUserId: Number(assigneeId),
      });
      closeAssignModal();
      await loadRequests();
    } catch (e) {
      console.warn(e);
      setAssignError(rt("requests.assignError", "Không phân việc được. Thử lại."));
    }
  };

  const closeDetailModal = () => {
    if (detailMaskEl) {
      detailMaskEl.classList.remove("is-open");
      detailMaskEl.style.display = "";
      detailMaskEl.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("request-detail-open");
    setDetailLoading(false);
    setDetailError("");
  };

  const setDetailLoading = (on) => {
    const form = document.getElementById("requestDetailForm");
    const loading = document.getElementById("requestDetailLoading");
    if (form) form.classList.toggle("is-loading", !!on);
    if (loading) loading.hidden = !on;
  };

  const setDetailError = (message) => {
    const el = document.getElementById("requestDetailError");
    if (!el) return;
    const msg = String(message || "").trim();
    if (!msg) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  };

  const fillDetailForm = (r) => {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val ?? "";
    };
    setVal("requestDetailId", r.id);
    setVal("requestDetailTitleField", r.title || "—");
    const groupEl = document.getElementById("requestDetailGroup");
    if (groupEl) groupEl.value = labelManagerGroup(r.managerGroup);
    const priEl = document.getElementById("requestDetailPriority");
    if (priEl) {
      priEl.value = labelPriority(r.priority);
      priEl.classList.remove("request-priority--high", "request-priority--low", "request-priority--normal");
      priEl.classList.add(priorityClass(r.priority));
    }
    const statusEl = document.getElementById("requestDetailStatus");
    if (statusEl) statusEl.value = String(r.status || "NEW").toUpperCase();
    setVal("requestDetailSender", r.createdByUserName || "—");
    setVal("requestDetailTime", formatTime(r.createdAt));
    const unassigned = rt("requests.assigneeUnassigned", "Chưa phân công");
    const assigneeName =
      r.assignedToUserId != null
        ? String(r.assignedToUserName || r.managerName || "").trim() || unassigned
        : unassigned;
    setVal("requestDetailManagerName", assigneeName);
    setVal("requestDetailNote", r.note || "");

    const attWrap = document.getElementById("requestDetailAttachmentWrap");
    const attEl = document.getElementById("requestDetailAttachment");
    const att = String(r.attachmentUrl || "").trim();
    if (attWrap && attEl) {
      if (att) {
        attWrap.hidden = false;
        attEl.textContent = att;
      } else {
        attWrap.hidden = true;
        attEl.textContent = "";
      }
    }
  };

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");

  const escAttr = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");

  const formatTime = (iso) => {
    if (!iso) return "—";
    try {
      const loc = window.FmI18n?.getLocale?.() === "en" ? "en-GB" : "vi-VN";
      return new Date(iso).toLocaleString(loc);
    } catch {
      return String(iso);
    }
  };

  const nextStatus = (current) => {
    const c = String(current || "").toUpperCase();
    if (c === "NEW") return "IN_PROGRESS";
    if (c === "IN_PROGRESS") return "RESOLVED";
    return "CLOSED";
  };

  const currentSession = () => window.AppAuth?.getSession?.() || null;

  const isAdminAccount = () => {
    const codes = currentSession()?.roleCodes || [];
    if (codes.some((c) => String(c).toUpperCase() === "ADMIN")) return true;
    const nav = String(currentSession()?.role || window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    return nav === "ADMIN";
  };

  const isManagerAccount = () => {
    const codes = currentSession()?.roleCodes || [];
    if (codes.some((c) => String(c).toUpperCase() === "MANAGER")) return true;
    const nav = String(currentSession()?.role || window.AppAuth?.getCurrentUser?.()?.role || "").toUpperCase();
    return nav === "MANAGER";
  };

  const acknowledgeRequest = async (requestId) => {
    if (isAdminAccount()) {
      await showAssignModal(requestId);
      return;
    }
    if (!isManagerAccount()) {
      window.alert(
        rt("requests.ackNeedManager", "Chỉ tài khoản quản lý mới tự ghi nhận được. Liên hệ admin để phân công.")
      );
      return;
    }
    try {
      await api().patchYeuCau(requestId, { status: "IN_PROGRESS" });
      await loadRequests();
    } catch (e) {
      console.warn(e);
      window.alert(rt("requests.updateError", "Không cập nhật được trạng thái."));
    }
  };

  const getWorkView = () => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v === "pending" || v === "incomplete" || v === "mine") return v;
    const path = decodeURIComponent(window.location.pathname || "").toLowerCase();
    if (path.includes("work/incomplete") || path.includes("/incomplete")) return "incomplete";
    if (path.includes("work/pending") || path.includes("/pending")) return "pending";
    if (path.includes("work/mine")) return "mine";
    return null;
  };

  const showActionsColumn = () => getWorkView() !== "incomplete";

  const tableColspan = () => (showActionsColumn() ? 8 : 7);

  const syncActionsColumnVisibility = () => {
    const hide = !showActionsColumn();
    const view = getWorkView();
    document.body.classList.toggle("requests-view-incomplete", view === "incomplete");
    document.body.classList.toggle("requests-view-pending", view === "pending");
    document.body.classList.toggle("requests-view-mine", view === "mine");
    const actionsTh = document.getElementById("requestsColActions");
    if (actionsTh) actionsTh.hidden = hide;
    document.getElementById("requestsTable")?.classList.toggle("requests-table--no-actions", hide);
  };

  const applyWorkViewToPage = () => {
    const view = getWorkView();
    const titleEl = document.querySelector(".page-title");
    if (titleEl && view) {
      const key =
        view === "pending"
          ? "requests.titlePending"
          : view === "incomplete"
            ? "requests.titleIncomplete"
            : "requests.titleMine";
      const fb =
        view === "pending"
          ? "Chờ xử lí"
          : view === "incomplete"
            ? "Chưa hoàn thành"
            : "Công việc của tôi";
      titleEl.textContent = rt(key, fb);
      titleEl.setAttribute("data-i18n", key);
    }
    const statusWrap = document.getElementById("requestsFilterStatus")?.closest(".statistics-filter");
    if (statusWrap) statusWrap.hidden = !!view;
    syncActionsColumnVisibility();
  };

  const afterTableRender = () => {
    syncActionsColumnVisibility();
    refreshRequestsTable();
  };

  const loadRequests = async () => {
    const body = document.getElementById("requestsTableBody");
    if (!body) return;
    syncActionsColumnVisibility();
    body.innerHTML = `<tr><td colspan="${tableColspan()}" class="statistics-placeholder">${esc(rt("requests.loading", "Đang tải…"))}</td></tr>`;

    const view = getWorkView();
    const priority = document.getElementById("requestsFilterPriority")?.value || "";
    const managerGroup = document.getElementById("requestsFilterGroup")?.value || "";

    const params = { isDraft: "false" };
    if (view === "pending") {
      params.status = "NEW";
    } else if (view === "incomplete") {
      params.openOnly = "true";
    } else if (view === "mine") {
      params.assignedToMe = "true";
    } else {
      const status = document.getElementById("requestsFilterStatus")?.value || "";
      if (status) params.status = status;
    }
    if (priority) params.priority = priority;
    if (managerGroup) params.managerGroup = managerGroup;

    try {
      const list = await api().layDanhSachYeuCau(params);
      const rows = sortByIdAsc(Array.isArray(list) ? list : []);
      if (!rows.length) {
        body.innerHTML = `<tr><td colspan="${tableColspan()}" class="statistics-placeholder">${esc(rt("requests.empty", "Không có yêu cầu."))}</td></tr>`;
        afterTableRender();
        return;
      }
      body.innerHTML = rows
        .map((r) => {
          const id = r.id;
          const st = String(r.status || "NEW").toUpperCase();
          const next = nextStatus(st);
          const advanceLabel =
            st === "RESOLVED"
              ? rt("requests.actionResolve", "Hoàn tất")
              : next === "IN_PROGRESS"
                ? rt("requests.actionAck", "Ghi nhận")
                : next === "RESOLVED"
                  ? rt("requests.actionResolve", "Hoàn tất")
                  : rt("requests.actionClose", "Đóng");
          const actionsCell = showActionsColumn()
            ? `<td class="requests-actions-cell"><div class="requests-actions">
              <button type="button" class="btn btn-sm requests-detail-btn" data-id="${esc(id)}"
                data-title="${escAttr(r.title || "")}"
                data-group="${escAttr(r.managerGroup || "")}"
                data-priority="${escAttr(r.priority || "")}"
                data-status="${escAttr(r.status || "")}"
                data-sender="${escAttr(r.createdByUserName || "")}"
                data-note="${escAttr(r.note || "")}"
                data-manager="${escAttr(r.managerName || "")}"
                data-time="${escAttr(r.createdAt || "")}">${esc(rt("requests.detail", "Chi tiết"))}</button>
              ${st !== "CLOSED" ? `<button type="button" class="btn btn-sm requests-advance-btn" data-id="${esc(id)}" data-next="${esc(next)}">${esc(advanceLabel)}</button>` : ""}
              <button type="button" class="btn btn-sm requests-delete-btn" data-id="${esc(id)}">${esc(rt("requests.delete", "Xóa"))}</button>
            </td>`
            : "";
          return `<tr class="requests-table-row" data-request-id="${esc(id)}">
            <td>${esc(id)}</td>
            <td>${esc(r.title)}</td>
            <td>${esc(labelManagerGroup(r.managerGroup))}</td>
            <td><span class="request-priority ${priorityClass(r.priority)}">${esc(labelPriority(r.priority))}</span></td>
            <td>${esc(labelStatus(r.status))}</td>
            <td>${esc(r.createdByUserName || "—")}</td>
            <td>${esc(formatTime(r.createdAt))}</td>
            ${actionsCell}
          </tr>`;
        })
        .join("");
      afterTableRender();
    } catch (e) {
      console.warn(e);
      body.innerHTML = `<tr><td colspan="${tableColspan()}" class="statistics-placeholder">${esc(rt("requests.loadError", "Không tải được dữ liệu."))}</td></tr>`;
      afterTableRender();
    }
  };

  const fillDetailFromButton = (btn) => {
    if (!(btn instanceof HTMLElement)) return;
    fillDetailForm({
      id: btn.getAttribute("data-id"),
      title: btn.getAttribute("data-title"),
      managerGroup: btn.getAttribute("data-group"),
      priority: btn.getAttribute("data-priority"),
      status: btn.getAttribute("data-status"),
      createdByUserName: btn.getAttribute("data-sender"),
      note: btn.getAttribute("data-note"),
      managerName: btn.getAttribute("data-manager"),
      createdAt: btn.getAttribute("data-time"),
      attachmentUrl: null,
    });
  };

  const showDetail = async (id, triggerBtn) => {
    openDetailModal();
    setDetailError("");
    if (triggerBtn) fillDetailFromButton(triggerBtn);
    setDetailLoading(true);
    try {
      if (!api()?.layYeuCauTheoId) throw new Error("API chưa sẵn sàng");
      const r = await api().layYeuCauTheoId(id);
      fillDetailForm(r);
    } catch (e) {
      console.warn(e);
      setDetailError(rt("requests.loadError", "Không tải được chi tiết. Thử làm mới trang (Ctrl+F5)."));
    } finally {
      setDetailLoading(false);
    }
  };

  const saveDetail = async () => {
    const id = document.getElementById("requestDetailId")?.value;
    if (!id) return;
    const status = document.getElementById("requestDetailStatus")?.value;
    const note = document.getElementById("requestDetailNote")?.value?.trim() ?? "";
    try {
      await api().capNhatYeuCau(id, { status, note });
      closeDetailModal();
      await loadRequests();
    } catch (e) {
      console.warn(e);
      window.alert(rt("requests.updateError", "Không cập nhật được."));
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyWorkViewToPage();
    window.FmI18n?.apply?.(document.querySelector(".panel"));

    const requestsTableBody = document.getElementById("requestsTableBody");
    const { setupTableControls } = window.AppTableControls || {};
    if (setupTableControls && requestsTableBody) {
      refreshRequestsTable = setupTableControls({
        tableBody: requestsTableBody,
        pageSizeSelect: document.getElementById("requestsPageSizeSelect"),
        searchColumnIndexes: [0, 1, 2, 3, 4, 5],
        isDataRow: (row) => row.classList.contains("requests-table-row"),
      });
    }

    detailMaskEl = document.getElementById("requestDetailMask");
    assignMaskEl = document.getElementById("requestAssignMask");
    const closeDetail = () => closeDetailModal();
    const closeAssign = () => closeAssignModal();
    document.getElementById("requestDetailCloseBtn")?.addEventListener("click", closeDetail);
    document.getElementById("requestDetailCancelBtn")?.addEventListener("click", closeDetail);
    document.getElementById("requestDetailSaveBtn")?.addEventListener("click", () => void saveDetail());
    detailMaskEl?.addEventListener("click", (ev) => {
      if (ev.target === detailMaskEl) closeDetail();
    });
    document.getElementById("requestAssignCloseBtn")?.addEventListener("click", closeAssign);
    document.getElementById("requestAssignCancelBtn")?.addEventListener("click", closeAssign);
    document.getElementById("requestAssignConfirmBtn")?.addEventListener("click", () => void confirmAssign());
    assignMaskEl?.addEventListener("click", (ev) => {
      if (ev.target === assignMaskEl) closeAssign();
    });

    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      if (assignMaskEl?.classList.contains("is-open")) {
        closeAssign();
        return;
      }
      if (detailMaskEl?.classList.contains("is-open")) closeDetail();
    });

    document.getElementById("requestsRefreshBtn")?.addEventListener("click", () => void loadRequests());
    ["requestsFilterStatus", "requestsFilterPriority", "requestsFilterGroup"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => void loadRequests());
    });

    document.getElementById("requestsTableBody")?.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      const id = t.getAttribute("data-id");
      if (!id) return;
      if (t.classList.contains("requests-detail-btn")) {
        void showDetail(id, t);
        return;
      }
      if (t.classList.contains("requests-advance-btn")) {
        const next = String(t.getAttribute("data-next") || "IN_PROGRESS").toUpperCase();
        if (next === "IN_PROGRESS") {
          void acknowledgeRequest(id);
          return;
        }
        void (async () => {
          try {
            await api().patchYeuCau(id, { status: next });
            await loadRequests();
          } catch (e) {
            window.alert(rt("requests.updateError", "Không cập nhật được trạng thái."));
          }
        })();
        return;
      }
      if (t.classList.contains("requests-delete-btn")) {
        if (!window.confirm(rt("requests.confirmDelete", "Xóa yêu cầu này?"))) return;
        void (async () => {
          try {
            await api().xoaYeuCau(id);
            await loadRequests();
          } catch (e) {
            window.alert(rt("requests.deleteError", "Không xóa được."));
          }
        })();
      }
    });

    void loadRequests();
  });
})();
