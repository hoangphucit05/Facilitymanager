const categoryMenuHashMap = {
  "Quản lý danh mục": "",
  "Category management": "",
  "カテゴリ管理": "",
  "Máy móc, thiết bị": "may-moc-thiet-bi",
  "Machinery & equipment": "may-moc-thiet-bi",
  "機械・設備": "may-moc-thiet-bi",
  "Công cụ, dụng cụ": "cong-cu-dung-cu",
  "Tools & instruments": "cong-cu-dung-cu",
  "工具・器具": "cong-cu-dung-cu",
  "Nguồn kinh phí": "nguon-kinh-phi",
  "Funding sources": "nguon-kinh-phi",
  "資金源": "nguon-kinh-phi",
  "Nhà cung cấp": "nha-cung-cap",
  "Suppliers": "nha-cung-cap",
  "仕入先": "nha-cung-cap",
  Nước: "nuoc",
  Countries: "nuoc",
  国・地域: "nuoc",
};

const withOptionalHash = (href, hash) => {
  const rawHref = (href || "").trim();
  if (!rawHref) return hash ? `#${hash}` : "#";
  const baseHref = rawHref.split("#")[0];
  return hash ? `${baseHref}#${hash}` : baseHref;
};

document.querySelectorAll('.nav-submenu a[href$="categories.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = categoryMenuHashMap[label];
  if (hash === undefined) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});

const liquidationMenuHashMap = {
  "Điều chuyển tài sản": "dieu-chuyen",
  "Thanh lý tài sản": "thanh-ly",
};

document.querySelectorAll('.nav-submenu a[href$="liquidation.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = liquidationMenuHashMap[label];
  if (!hash) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});

const assetsMenuHashMap = {
  "Quản lý tài sản": "",
  "Đánh giá tài sản": "danh-gia-tai-san",
  "Đánh giá lại tài sản": "danh-gia-lai-tai-san",
};

document.querySelectorAll('.nav-submenu a[href$="assets.html"]').forEach((link) => {
  const label = link.textContent?.trim() || "";
  const hash = assetsMenuHashMap[label];
  if (hash === undefined) return;
  const currentHref = link.getAttribute("href") || "";
  link.setAttribute("href", withOptionalHash(currentHref, hash));
});

const BUILDING_SLUG_TO_CODE = {
  e1: "E1",
  e3: "E3",
  e4: "E4",
  e5: "E5",
  e6: "E6",
  e7: "E7",
  e8: "E8",
  e9: "E9",
  e10: "E10",
  eb8: "EB8",
  c1: "C1",
  c2: "C2",
  c3: "C3",
  gddn: "GDDN",
  cantin: "CANTIN",
};

function buildingCodeFromPageName(pageName) {
  const menuName = String(pageName || "").trim().toLowerCase();
  const m = menuName.match(/^page_building_([a-z0-9]+)$/);
  if (!m) return null;
  const slug = m[1];
  return BUILDING_SLUG_TO_CODE[slug] || slug.toUpperCase();
}

/** Luôn gán href departments cho menu tòa (kể cả link not-found / cache cũ). */
function fixBuildingMenuLinks(root) {
  const scope = root || document;
  const base = "/pages/dashboard/departments.html";

  const titleToCode = {
    "Giảng đường Đa Năng": "GDDN",
    "Căn Tin": "CANTIN",
  };

  scope.querySelectorAll(".nav-submenu a.nav-subitem").forEach((link) => {
    let code = buildingCodeFromPageName(link.dataset.pageName);
    if (!code) {
      const paramsRaw = link.getAttribute("data-i18n-params");
      if (paramsRaw) {
        try {
          const p = JSON.parse(paramsRaw);
          if (p?.name) code = String(p.name).trim();
        } catch {
          /* ignore */
        }
      }
    }
    if (!code) {
      const title = (link.textContent || "").trim();
      const tm = title.match(/^Tòa nhà\s+(.+)$/i);
      code = tm ? tm[1].trim() : titleToCode[title];
    }
    if (!code) return;

    const target = `${base}?building=${encodeURIComponent(code)}`;
    link.setAttribute("href", target);
    link.dataset.building = code;
    link.removeAttribute("data-unresolved-path");
  });
}

function scheduleFixBuildingMenuLinks() {
  fixBuildingMenuLinks(document);
  setTimeout(() => fixBuildingMenuLinks(document), 100);
}

scheduleFixBuildingMenuLinks();
window.addEventListener("fm-sidebar-ready", () => scheduleFixBuildingMenuLinks());
window.addEventListener("fm-i18n-applied", () => fixBuildingMenuLinks(document));
