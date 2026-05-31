/**
 * Trang sơ đồ phòng học — click tòa nhà → danh sách phòng theo building.
 */
(function roomMapPageScope() {
  document.querySelectorAll(".campus-building[data-building]").forEach((link) => {
    link.addEventListener("click", () => {
      const code = link.getAttribute("data-building");
      if (!code) return;
      try {
        sessionStorage.setItem("departmentsActiveBuilding", code);
      } catch (_) {
        /* ignore */
      }
    });
  });
})();
