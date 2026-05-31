/**
 * Xuất dữ liệu dạng JSON (download) — dùng chung các trang bảng / form.
 */
(function exportJsonScope(window) {
  function slugKey(s, i) {
    const t = String(s ?? "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 80);
    return t || `col_${i}`;
  }

  function cellValue(cell) {
    if (!cell) return "";
    const img = cell.querySelector("img");
    if (img && img.getAttribute("src")) return img.getAttribute("src") || "";
    const pill = cell.querySelector("button.status-pill, .status-pill");
    if (pill) return pill.getAttribute("aria-pressed") === "true" ? "ACTIVE" : "INACTIVE";
    const loneCb = cell.querySelector('input[type="checkbox"]');
    if (loneCb && cell.querySelectorAll("input").length === 1) {
      return loneCb.checked ? String(loneCb.value || "true") : "";
    }
    return cell.innerText.replace(/\s+/g, " ").trim();
  }

  function lastCellLooksLikeActions(cell) {
    if (!cell) return false;
    return Boolean(
      cell.querySelector(
        ".user-action-buttons, .category-icon-actions, .room-action-buttons, .asset-rerating-btn, .asset-rate-now-btn",
      ),
    );
  }

  /**
   * Đọc tbody: key lấy từ text thead (cột chức năng có nút thì bỏ cột cuối).
   * @param {HTMLTableSectionElement | null} tbody
   */
  function tbodyToObjectsAuto(tbody) {
    if (!tbody) return [];
    const table = tbody.closest("table");
    if (!table) return [];
    const thEls = Array.from(table.querySelectorAll("thead th"));
    const rawKeys = thEls.map((th, i) => slugKey(th.textContent, i));
    const rows = [];
    tbody.querySelectorAll("tr").forEach((tr) => {
      if (tr.querySelector("td[colspan]")) return;
      const cells = Array.from(tr.querySelectorAll("td"));
      if (!cells.length) return;
      let n = cells.length;
      if (lastCellLooksLikeActions(cells[n - 1])) n -= 1;
      const keys = rawKeys.slice(0, n);
      while (keys.length < n) keys.push(`col_${keys.length}`);
      const o = {};
      for (let i = 0; i < n; i += 1) {
        o[keys[i]] = cellValue(cells[i]);
      }
      rows.push(o);
    });
    return rows;
  }

  function formToPlainObject(form) {
    if (!form) return {};
    const o = {};
    form.querySelectorAll("input, select, textarea").forEach((el) => {
      const name = el.getAttribute("name");
      if (!name) return;
      if (el.type === "file") {
        o[name] = el.files && el.files.length ? Array.from(el.files).map((f) => f.name) : [];
      } else if (el.type === "password") {
        o[name] = el.value ? "***" : "";
      } else if (el.type === "checkbox") {
        o[name] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) o[name] = el.value;
      } else {
        o[name] = el.value;
      }
    });
    return o;
  }

  function download(filename, data) {
    const name = String(filename || "export.json").replace(/[^\w.\-]/g, "_");
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.FmExportJson = {
    download,
    tbodyToObjectsAuto,
    formToPlainObject,
  };
})(window);
