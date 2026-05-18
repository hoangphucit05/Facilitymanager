/**
 * Quản lý vai trò — REST Facility: GET/POST/PUT/DELETE /api/admin/roles, cây menu GET /api/admin/menu-tree.
 * Giao diện iView clone (project1_13_5).
 */
(function initRbacRolesPageFacility() {
  const tbody = document.querySelector("[data-role-rows]");
  const searchForm = document.getElementById("rolesSearchForm");
  const editMask = document.getElementById("roleEditMask");
  const editTitleEl = document.getElementById("roleEditTitle");
  const editForm = document.getElementById("roleEditForm");
  const permMask = document.getElementById("rolePermMask");
  const permTitleEl = document.getElementById("rolePermTitle");
  const permTreeHost = document.getElementById("rolePermTree");
  const permSpin = document.getElementById("rolePermSpin");
  const pager = document.getElementById("rolesPager");

  const trMsg = (k, params) =>
    window.FmI18n && typeof window.FmI18n.t === "function" ? window.FmI18n.t(k, params) : k;

  const state = {
    serverRows: [],
    filterName: "",
    filterDesc: "",
    total: 0,
    pageNumber: 1,
    pageSize: 10,
    editingMode: 0,
    editingPermRoleId: null,
    checkedPermIds: new Set(),
    permFlatCache: null,
  };

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showMask(el) {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
  }

  function hideMask(el) {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
  }

  async function apiJson(method, path, body) {
    const res = await window.AppAuth.rbacFetch(path, {
      method,
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }
    return data;
  }

  async function apiDelete(path) {
    const res = await window.AppAuth.rbacFetch(path, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `HTTP ${res.status}`);
    }
  }

  function fillParentRoleSelect(excludeId) {
    const sel = document.getElementById("parentRoleSelect");
    if (!sel) return;
    const previous = String(sel.value || "");
    sel.innerHTML = '<option value="">— Không kế thừa —</option>';
    state.serverRows.forEach((r) => {
      if (excludeId && r.id === excludeId) return;
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = `${r.name} (${r.code})`;
      sel.appendChild(opt);
    });
    if (previous && Array.from(sel.options).some((o) => o.value === previous)) {
      sel.value = previous;
    }
  }

  function mapRoleDto(r) {
    const menuIds = Array.isArray(r.menuIds) ? r.menuIds.map((x) => Number(x)) : [];
    return {
      id: String(r.id),
      code: r.code || "",
      name: r.name || "",
      description: r.description || "",
      createTime: window.RbacApi.formatInstant(r.createTime),
      createBy: r.createBy || "—",
      updateTime: window.RbacApi.formatInstant(r.updateTime),
      updateBy: r.updateBy || "—",
      sortOrder: r.sortOrder != null ? Number(r.sortOrder) : 100,
      menuIds,
      parentRoleId: r.parentRoleId != null && r.parentRoleId !== "" ? String(r.parentRoleId) : "",
      parentRoleCode: r.parentRoleCode || "",
      _raw: r,
    };
  }

  function deriveCodeAndName(displayInput) {
    const display = String(displayInput || "").trim();
    if (!display) {
      throw new Error("Tên vai trò không được để trống.");
    }
    let ascii = display;
    try {
      ascii = display.normalize("NFD").replace(/\p{M}/gu, "");
    } catch {
      /* ignore */
    }
    ascii = ascii.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
    if (!ascii) {
      ascii = `AUTO${Date.now()}`;
    }
    let code = ascii.startsWith("ROLE_") ? ascii : `ROLE_${ascii}`.replace(/_+/g, "_");
    if (code.length < 2) {
      code = `ROLE_U${Date.now()}`;
    }
    if (code.length > 50) {
      code = code.slice(0, 50).replace(/_+$/g, "");
    }
    if (!/^[A-Z0-9_]{2,50}$/.test(code)) {
      throw new Error("Không tạo được mã vai trò hợp lệ (chỉ A–Z, 0–9, _). Hãy nhập dạng ROLE_TEN.");
    }
    return { code, displayName: display };
  }

  function bindCheckbox(cb, idStr, checkedSet) {
    cb.type = "checkbox";
    cb.checked = checkedSet.has(idStr);
    cb.addEventListener("change", () => {
      if (cb.checked) checkedSet.add(idStr);
      else checkedSet.delete(idStr);
    });
  }

  function isTechnicalApiPermission(node) {
    const title = String(node?.title || "").trim().toUpperCase();
    const buttonType = String(node?.buttonType || "").trim().toLowerCase();
    const type = node?.permissionType ?? node?.type;
    return Number(type) === 1 && (buttonType === "api" || title.endsWith("_API_ZONE"));
  }

  function filterVisiblePermissionTree(nodes) {
    return (nodes || [])
      .filter((node) => !isTechnicalApiPermission(node))
      .map((node) => ({
        ...node,
        children: filterVisiblePermissionTree(node.children || []),
      }));
  }

  function renderPermSidebarTree(nodes, host, checkedSet) {
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "sidebar-tree";

    function walk(list, container) {
      (list || []).forEach((node) => {
        const hasKids = node.children && node.children.length > 0;
        const idStr = String(node.id);

        if (hasKids) {
          const grp = document.createElement("div");
          grp.className = "nav-group open";

          const head = document.createElement("div");
          head.className = "sidebar-tree-head";

          const cb = document.createElement("input");
          cb.className = "sidebar-tree-cb";
          bindCheckbox(cb, idStr, checkedSet);

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "nav-group-toggle";
          btn.innerHTML = `<span>${escapeHtml(node.title)}</span><span class="nav-caret">▾</span>`;

          btn.addEventListener("click", () => {
            grp.classList.toggle("open");
            const caret = btn.querySelector(".nav-caret");
            if (caret) caret.textContent = grp.classList.contains("open") ? "▾" : "▸";
          });

          head.appendChild(cb);
          head.appendChild(btn);

          const sub = document.createElement("div");
          sub.className = "nav-submenu";
          walk(node.children, sub);

          grp.appendChild(head);
          grp.appendChild(sub);
          container.appendChild(grp);
        } else {
          const label = document.createElement("label");
          label.className = "nav-subitem nav-subitem--perm";
          const cb = document.createElement("input");
          cb.className = "sidebar-tree-cb";
          bindCheckbox(cb, idStr, checkedSet);
          const span = document.createElement("span");
          span.textContent = node.title;
          label.appendChild(cb);
          label.appendChild(span);
          container.appendChild(label);
        }
      });
    }

    const nav = document.createElement("div");
    nav.className = "sidebar-tree-nav";
    walk(nodes, nav);
    wrap.appendChild(nav);
    host.appendChild(wrap);
  }

  function getFilteredRows() {
    const n = state.filterName.trim().toLowerCase();
    const d = state.filterDesc.trim().toLowerCase();
    return state.serverRows.filter((row) => {
      const okName = !n || `${row.name} ${row.code}`.toLowerCase().includes(n);
      const okDesc = !d || String(row.description || "").toLowerCase().includes(d);
      return okName && okDesc;
    });
  }

  function getPageSlice() {
    const filtered = getFilteredRows();
    state.total = filtered.length;
    const start = (state.pageNumber - 1) * state.pageSize;
    return filtered.slice(start, start + state.pageSize);
  }

  function renderPager() {
    if (!pager) return;
    const totalEl = pager.querySelector("[data-page-total]");
    const pagesEl = pager.querySelector("[data-page-pages]");
    if (totalEl) totalEl.textContent = String(state.total);

    const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
    if (pagesEl) {
      const buttons = [];
      for (let p = 1; p <= totalPages; p++) {
        buttons.push(
          `<button type="button" class="iv-page-item ${p === state.pageNumber ? "is-active" : ""}" data-go-page="${p}">${p}</button>`,
        );
      }
      pagesEl.innerHTML = buttons.join("");
    }
    const prev = pager.querySelector("[data-page-prev]");
    const next = pager.querySelector("[data-page-next]");
    if (prev) prev.disabled = state.pageNumber <= 1;
    if (next) next.disabled = state.pageNumber >= totalPages;

    const sizeSel = pager.querySelector("[data-page-size]");
    if (sizeSel) {
      const suf = trMsg("rbacRoles.perPageSuffix");
      Array.from(sizeSel.options).forEach((opt) => {
        const v = String(opt.value || "").trim();
        if (v) opt.textContent = `${v}${suf}`;
      });
    }
  }

  function renderTable() {
    if (!tbody) return;
    const pageRows = getPageSlice();

    if (!pageRows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="iv-td-center" style="color: var(--muted)">
            ${escapeHtml(trMsg("rbacRoles.empty"))}
          </td>
        </tr>`;
      renderPager();
      return;
    }

    const start = (state.pageNumber - 1) * state.pageSize;
    tbody.innerHTML = pageRows
      .map((row, idx) => {
        const ordinal = start + idx + 1;
        const nameCell = `${escapeHtml(row.name)}<div style="font-size:12px;color:var(--muted, #888)">${escapeHtml(
          row.code,
        )}</div>${
          row.parentRoleCode
            ? `<div style="font-size:11px;color:var(--muted2, #666);margin-top:2px">↳ Kế thừa: ${escapeHtml(
                row.parentRoleCode,
              )}</div>`
            : ""
        }`;
        return `
          <tr data-role-id="${escapeHtml(row.id)}">
            <td class="iv-td-center">${ordinal}</td>
            <td>${nameCell}</td>
            <td>${escapeHtml(row.description)}</td>
            <td>${escapeHtml(row.createTime)}</td>
            <td>${escapeHtml(row.createBy)}</td>
            <td>${escapeHtml(row.updateTime)}</td>
            <td>${escapeHtml(row.updateBy)}</td>
            <td class="iv-td-center" style="white-space: nowrap">
              <div class="user-action-buttons">
              <button type="button" class="iv-btn iv-btn-success iv-btn-circle iv-btn-sm" data-row-action="perm">
                <i class="iv-btn-icon">✎</i>${escapeHtml(trMsg("rbacRoles.actionMenuPerm"))}
              </button>
              <button type="button" class="iv-btn iv-btn-warning iv-btn-circle iv-btn-sm" data-row-action="edit">
                <i class="iv-btn-icon">✎</i>${escapeHtml(trMsg("rbacRoles.actionEdit"))}
              </button>
              <button type="button" class="iv-btn iv-btn-error iv-btn-circle iv-btn-sm" data-row-action="remove">
                <i class="iv-btn-icon">🗑</i>${escapeHtml(trMsg("rbacRoles.actionDelete"))}
              </button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    renderPager();
  }

  async function loadRoles() {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr><td colspan="8" class="iv-td-center" style="color: var(--muted)">${escapeHtml(trMsg("rbacRoles.loading"))}</td></tr>`;

    try {
      const res = await window.AppAuth.rbacFetch("/api/admin/roles", { method: "GET" });
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        const msg = typeof data === "object" && data && data.message ? data.message : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const arr = Array.isArray(data) ? data : [];
      state.serverRows = arr.map(mapRoleDto);
      state.pageNumber = 1;
      syncFiltersFromForm();
      renderTable();
    } catch (e) {
      console.error(e);
      state.serverRows = [];
      state.total = 0;
      tbody.innerHTML = `
        <tr><td colspan="8" class="iv-td-center" style="color: var(--error, #c00)">
          ${escapeHtml(e.message || trMsg("rbacRoles.loadError"))}
        </td></tr>`;
      renderPager();
    }
  }

  function syncFiltersFromForm() {
    const fd = searchForm ? new FormData(searchForm) : new FormData();
    state.filterName = String(fd.get("name") || "");
    state.filterDesc = String(fd.get("description") || "");
  }

  function applySearch(e) {
    if (e) e.preventDefault();
    state.pageNumber = 1;
    syncFiltersFromForm();
    renderTable();
  }

  function openEdit(mode, row) {
    state.editingMode = mode;
    editTitleEl.textContent = mode === 0 ? trMsg("rbacRoles.modalAddTitle") : trMsg("rbacRoles.modalEditTitle");
    editForm.reset();
    fillParentRoleSelect(mode === 1 && row ? row.id : null);
    if (mode === 1 && row) {
      editForm.elements.id.value = row.id;
      editForm.elements.name.value = row.name;
      editForm.elements.description.value = row.description || "";
      const pr = document.getElementById("parentRoleSelect");
      if (pr) pr.value = row.parentRoleId || "";
    } else {
      editForm.elements.id.value = "";
      const pr = document.getElementById("parentRoleSelect");
      if (pr) pr.value = "";
    }
    showMask(editMask);
  }

  async function submitEdit() {
    const fd = new FormData(editForm);
    const id = String(fd.get("id") || "").trim();
    const nameInput = String(fd.get("name") || "").trim();
    const description = String(fd.get("description") || "").trim();
    if (!nameInput) {
      window.alert("Tên vai trò không được để trống.");
      return;
    }
    const parentSel = document.getElementById("parentRoleSelect");
    const parentRoleId =
      parentSel && parentSel.value && String(parentSel.value).trim() !== ""
        ? Number(parentSel.value)
        : null;
    try {
      if (state.editingMode === 0) {
        const { code, displayName } = deriveCodeAndName(nameInput);
        const body = {
          code,
          name: displayName,
          description,
          sortOrder: 100,
          menuIds: [],
        };
        if (parentRoleId != null && !Number.isNaN(parentRoleId)) {
          body.parentRoleId = parentRoleId;
        }
        await apiJson("POST", "/api/admin/roles", body);
      } else {
        const row = state.serverRows.find((r) => r.id === id);
        const sortOrder = row?.sortOrder ?? 100;
        await apiJson("PUT", `/api/admin/roles/${encodeURIComponent(id)}`, {
          name: nameInput,
          description,
          sortOrder,
          updateParent: true,
          parentRoleId,
        });
      }
      hideMask(editMask);
      window.MenuStore?.invalidateMenu?.();
      await loadRoles();
    } catch (e) {
      window.alert(e.message || "Không lưu được.");
    }
  }

  async function removeRole(row) {
    if (!window.confirm(`Xóa vai trò ${row.code}?`)) return;
    try {
      await apiDelete(`/api/admin/roles/${encodeURIComponent(row.id)}`);
      window.MenuStore?.invalidateMenu?.();
      await loadRoles();
    } catch (e) {
      window.alert(e.message || "Không xóa được.");
    }
  }

  async function openPerm(row) {
    state.editingPermRoleId = row.id;
    state.checkedPermIds = new Set((row.menuIds || []).map((p) => String(p)));
    permTitleEl.textContent = `${row.name} (${row.code}) ${trMsg("rbacRoles.permTitleSuffix")}`;
    showMask(permMask);
    if (permSpin) permSpin.hidden = false;
    permTreeHost.innerHTML = "";

    try {
      const roots = await window.RbacApi.getJson("/api/admin/menu-tree");
      state.permFlatCache = window.RbacApi.flattenMenuVoForHierarchy(roots);
      const tree = filterVisiblePermissionTree(window.RbacApi.hierarchyFromFlatPermissions(state.permFlatCache));
      renderPermSidebarTree(tree, permTreeHost, state.checkedPermIds);
    } catch (e) {
      console.error(e);
      permTreeHost.innerHTML = `<div class="iv-tree-empty" style="color:var(--error, #c00)">${escapeHtml(
        e.message || "Không tải được cây quyền.",
      )}</div>`;
    } finally {
      if (permSpin) permSpin.hidden = true;
    }
  }

  async function submitPerm() {
    if (!state.editingPermRoleId) return;
    const ids = Array.from(state.checkedPermIds)
      .map((x) => Number(x))
      .filter((n) => !Number.isNaN(n) && n > 0);
    try {
      await apiJson("PUT", `/api/admin/roles/${encodeURIComponent(state.editingPermRoleId)}`, { menuIds: ids });
      hideMask(permMask);
      window.MenuStore?.invalidateMenu?.();
      await loadRoles();
    } catch (e) {
      window.alert(e.message || "Không lưu quyền được.");
    }
  }

  searchForm?.addEventListener("submit", applySearch);

  searchForm?.addEventListener("click", (e) => {
    const addTrigger = e.target.closest("[data-action='add-role']");
    if (addTrigger) openEdit(0, null);
  });

  tbody?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-row-action]");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = tr?.getAttribute("data-role-id");
    const row = state.serverRows.find((r) => r.id === id);
    if (!row) return;
    const action = btn.getAttribute("data-row-action");
    if (action === "edit") openEdit(1, row);
    else if (action === "remove") removeRole(row);
    else if (action === "perm") openPerm(row);
  });

  pager?.addEventListener("click", (e) => {
    const goBtn = e.target.closest("[data-go-page]");
    if (goBtn) {
      state.pageNumber = Number(goBtn.getAttribute("data-go-page")) || 1;
      renderTable();
      return;
    }
    if (e.target.closest("[data-page-prev]")) {
      if (state.pageNumber > 1) state.pageNumber--;
      renderTable();
      return;
    }
    if (e.target.closest("[data-page-next]")) {
      const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));
      if (state.pageNumber < totalPages) state.pageNumber++;
      renderTable();
    }
  });

  pager?.addEventListener("change", (e) => {
    const sizeSel = e.target.closest("[data-page-size]");
    if (sizeSel) {
      state.pageSize = Number(sizeSel.value) || 10;
      state.pageNumber = 1;
      renderTable();
    }
  });

  [editMask, permMask].forEach((mask) => {
    mask?.addEventListener("click", (e) => {
      if (e.target === mask) hideMask(mask);
    });
  });

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.getAttribute("data-action");
    if (!action) return;
    if (action === "close-edit") hideMask(editMask);
    else if (action === "submit-edit") submitEdit();
    else if (action === "close-perm") hideMask(permMask);
    else if (action === "submit-perm") submitPerm();
  });

  document.getElementById("rolesExportJsonBtn")?.addEventListener("click", () => {
    const Fm = window.FmExportJson;
    if (!Fm || !tbody) return;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    Fm.download(`roles-export-${stamp}.json`, {
      exportedAt: new Date().toISOString(),
      rows: Fm.tbodyToObjectsAuto(tbody),
    });
  });

  window.addEventListener("fm-i18n-applied", () => {
    renderTable();
    renderPager();
  });

  void loadRoles();
})();
