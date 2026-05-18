/**
 * Gọi API RBAC qua AppAuth.rbacFetch (Bearer). Hỗ trợ KetQuaApi { success, result }.
 */
(function rbacApiScope(window) {
  async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    if (data && data.success === false) {
      throw new Error(data.message || "Thao tác thất bại.");
    }
    return data && "result" in data ? data.result : data;
  }

  async function getJson(path) {
    const res = await window.AppAuth.rbacFetch(path, { method: "GET" });
    return handleResponse(res);
  }

  async function postForm(path, fields) {
    const body = new URLSearchParams();
    Object.entries(fields).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      body.set(k, String(v));
    });
    const res = await window.AppAuth.rbacFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
    });
    return handleResponse(res);
  }

  function formatInstant(t) {
    if (t == null || t === "") return "";
    if (typeof t === "string") {
      const s = t.replace("T", " ");
      return s.length >= 19 ? s.slice(0, 19) : s;
    }
    return String(t);
  }

  function hierarchyFromFlatPermissions(flat) {
    if (!Array.isArray(flat) || !flat.length) return [];
    const childrenByParent = new Map();

    flat.forEach((raw) => {
      const pid = raw.parentId == null ? "__root__" : String(raw.parentId);
      const id = String(raw.id);
      if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
      childrenByParent.get(pid).push({ raw, id });
    });

    for (const [, list] of childrenByParent) {
      list.sort((a, b) => (a.raw.sortOrder || 0) - (b.raw.sortOrder || 0));
    }

    function toUiNode(pe) {
      const n = {
        id: String(pe.id),
        type: pe.permissionType,
        level: pe.level ?? 0,
        parentId: pe.parentId != null ? String(pe.parentId) : "",
        title: pe.title || "",
        name: pe.code || "",
        path: pe.path || "",
        component: pe.component || "",
        icon: pe.icon || "",
        sortOrder: pe.sortOrder ?? 0,
        status: pe.status ?? 0,
        buttonType: pe.buttonType || "",
        children: [],
      };

      const children = childrenByParent.get(String(pe.id)) || [];
      n.children = children.map((row) => toUiNode(row.raw));
      return n;
    }

    const roots = childrenByParent.get("__root__") || [];
    return roots.map((r) => toUiNode(r.raw));
  }

  function mapMenuVoToUi(menuVoRoots) {
    if (!Array.isArray(menuVoRoots)) return [];
    function walk(n) {
      const parentIdRaw = n.parentId;
      const parentId = parentIdRaw == null || parentIdRaw === "" ? "" : String(parentIdRaw);
      return {
        id: String(n.id),
        type: n.permissionType,
        level: n.level ?? 0,
        parentId,
        title: n.title || "",
        name: n.name || "",
        path: n.path || "",
        component: n.component != null ? String(n.component) : "",
        icon: n.icon || "",
        sortOrder: Number(n.sortOrder) || 0,
        status: n.status ?? 0,
        buttonType:
          typeof n.buttonType === "string" ? n.buttonType : n.buttonType == null ? "" : String(n.buttonType),
        permTypes: Array.isArray(n.permTypes) ? n.permTypes : [],
        children: (n.children || []).map((c) => walk(c)),
      };
    }
    return menuVoRoots.map((r) => walk(r));
  }

  function flattenMenuVoForHierarchy(menuVoRoots) {
    const out = [];
    function dfs(n, parentPk) {
      out.push({
        id: n.id,
        parentId: n.parentId != null ? n.parentId : parentPk ?? null,
        permissionType: n.permissionType,
        level: n.level ?? 0,
        title: n.title ?? "",
        code: n.name ?? "",
        path: n.path ?? "",
        component: n.component ?? "",
        icon: n.icon ?? "",
        sortOrder: n.sortOrder ?? 0,
        status: n.status ?? 0,
        buttonType: n.buttonType ?? "",
      });
      (n.children || []).forEach((c) => dfs(c, n.id));
    }
    (menuVoRoots || []).forEach((r) => dfs(r, null));
    return out;
  }

  window.RbacApi = {
    getJson,
    postForm,
    formatInstant,
    hierarchyFromFlatPermissions,
    mapMenuVoToUi,
    flattenMenuVoForHierarchy,
  };
})(window);
