(function initStudentRequests(window) {
  const api = () => window.FmApi || window.CoSoApi;

  function hrefFromFrontendRoot(relativePath) {
    const rel = String(relativePath || "").replace(/^\/+/, "");
    const fn = window.AppSidebar?.hrefToFrontendPage;
    if (typeof fn === "function") return fn(rel);
    const d = window.MenuStore?.depthFromFrontendRoot?.() ?? 0;
    const prefix = d ? "../".repeat(d) : "";
    return prefix + rel;
  }

  function escAttr(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function tMsg(key, fallback, params) {
    const v = window.FmI18n?.t?.(key, params);
    return v != null && v !== key ? v : fallback;
  }

  function dateLocaleTag() {
    const loc = window.FmI18n?.getLocale?.();
    if (loc === "ja") return "ja-JP";
    if (loc === "vi") return "vi-VN";
    return "en-US";
  }

  const labelPriority = (code) => {
    const c = String(code || "").toUpperCase();
    if (c === "HIGH") return tMsg("studentRequests.priority.high", "Khẩn cấp");
    if (c === "LOW") return tMsg("studentRequests.priority.low", "Theo dõi");
    return tMsg("studentRequests.priority.normal", "Bình thường");
  };

  const priorityClass = (code) => {
    const c = String(code || "").toUpperCase();
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
    if (c === "IN_PROGRESS") return tMsg("studentRequests.status.inProgress", "Đang xử lý");
    if (c === "RESOLVED") return tMsg("studentRequests.status.resolved", "Đã xử lý");
    if (c === "DRAFT") return tMsg("studentRequests.status.draft", "Nháp");
    if (c === "CLOSED") return tMsg("studentRequests.status.closed", "Đã đóng");
    return tMsg("studentRequests.status.new", "Mới");
  };

  const labelManagerGroup = (code) => {
    const c = String(code || "").toUpperCase();
    if (c === "THIET_BI") return tMsg("studentRequests.create.optEquipment", "Thiết bị");
    return code || "—";
  };

  const mapManagerGroupToApi = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";
    if (s === "Thiết bị" || s.toUpperCase() === "THIET_BI") return "THIET_BI";
    return s.toUpperCase();
  };

  const mapPriorityToApi = (raw) => {
    const s = String(raw || "").trim();
    if (s === "Khẩn cấp") return "HIGH";
    if (s === "Theo dõi") return "LOW";
    if (s === "Bình thường") return "NORMAL";
    return s || "NORMAL";
  };

  const buildPayload = (attachment) => {
    const title = String(document.getElementById("studentRequestTitle")?.value || "").trim();
    const note = String(document.getElementById("studentRequestNote")?.value || "").trim();
    const managerGroup = mapManagerGroupToApi(document.getElementById("studentManagerGroup")?.value);
    const priority = mapPriorityToApi(document.getElementById("studentRequestPriority")?.value);
    const managerName = String(document.getElementById("studentManagerName")?.value || "").trim();
    const body = {
      title,
      note,
      managerGroup,
      priority,
      managerName: managerName || null,
    };
    if (attachment?.dataUrl && attachment.dataUrl.length <= 255) {
      body.attachmentUrl = attachment.dataUrl;
    } else if (attachment?.name) {
      body.attachmentUrl = attachment.name;
    }
    return body;
  };

  const goBackOrHome = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = hrefFromFrontendRoot("index.html");
  };

  const initBackButton = () => {
    document.getElementById("studentBackBtn")?.addEventListener("click", goBackOrHome);
  };

  const initCreatePage = () => {
    const saveBtn = document.getElementById("studentSaveDraftBtn");
    const sendBtn = document.getElementById("studentSendNowBtn");
    const noteField = document.getElementById("studentRequestNote");
    const noteCount = document.getElementById("studentNoteCount");
    const attachmentInput = document.getElementById("studentAttachmentInput");
    const uploadPlaceholder = document.getElementById("studentUploadPlaceholder");
    const uploadPreviewImage = document.getElementById("studentUploadPreviewImage");
    const uploadFileName = document.getElementById("studentUploadFileName");
    let currentAttachment = null;

    if (noteField && noteCount) {
      const syncCount = () => {
        const k = "studentRequests.create.noteCounter";
        const v = window.FmI18n?.t?.(k, { n: noteField.value.length });
        noteCount.textContent = v != null && v !== k ? v : `${noteField.value.length}/250`;
      };
      noteField.addEventListener("input", syncCount);
      syncCount();
    }

    attachmentInput?.addEventListener("change", () => {
      const file = attachmentInput.files?.[0];
      if (!file) return;
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const reader = new FileReader();
      reader.onload = () => {
        currentAttachment = {
          kind: isImage ? "image" : isVideo ? "video" : "file",
          name: file.name,
          dataUrl: typeof reader.result === "string" ? reader.result : "",
        };
        if (uploadPlaceholder) uploadPlaceholder.hidden = true;
        if (uploadFileName) {
          const k = "studentRequests.create.filePicked";
          const v = window.FmI18n?.t?.(k, { name: file.name });
          uploadFileName.textContent = v != null && v !== k ? v : `Đã chọn: ${file.name}`;
          uploadFileName.hidden = false;
        }
        if (uploadPreviewImage) {
          if (isImage && currentAttachment.dataUrl) {
            uploadPreviewImage.src = currentAttachment.dataUrl;
            uploadPreviewImage.hidden = false;
          } else {
            uploadPreviewImage.hidden = true;
          }
        }
      };
      reader.readAsDataURL(file);
    });

    saveBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title && !payload.note) {
        window.alert(tMsg("studentRequests.alerts.draftNeedContent", "Nhập tiêu đề hoặc ghi chú trước khi lưu tạm."));
        return;
      }
      void (async () => {
        try {
          if (!api()?.luuNhapYeuCau) throw new Error("no api");
          await api().luuNhapYeuCau(payload);
          goTo(hrefFromFrontendRoot("pages/student/request-drafts.html"));
        } catch (e) {
          console.warn(e);
          window.alert(tMsg("studentRequests.alerts.saveFail", "Không lưu được nháp. Kiểm tra đăng nhập và backend."));
        }
      })();
    });

    sendBtn?.addEventListener("click", () => {
      const payload = buildPayload(currentAttachment);
      if (!payload.title || !payload.note) {
        window.alert(tMsg("studentRequests.alerts.sendNeedTitleNote", "Vui lòng nhập tiêu đề và ghi chú trước khi gửi."));
        return;
      }
      void (async () => {
        try {
          if (!api()?.taoYeuCau) throw new Error("no api");
          await api().taoYeuCau(payload);
          goTo(hrefFromFrontendRoot("pages/student/request-sent.html"));
        } catch (e) {
          console.warn(e);
          window.alert(tMsg("studentRequests.alerts.sendFail", "Không gửi được yêu cầu. Kiểm tra đăng nhập và backend."));
        }
      })();
    });
  };

  const goTo = (path) => {
    window.location.href = path;
  };

  const renderList = async (listId, emptyId, isDraft) => {
    const listEl = document.getElementById(listId);
    const emptyEl = document.getElementById(emptyId);
    if (!listEl || !emptyEl) return;

    listEl.hidden = true;
    emptyEl.hidden = true;
    listEl.innerHTML = "";

    try {
      if (!api()?.layDanhSachYeuCau) throw new Error("no api");
      const list = await api().layDanhSachYeuCau({
        isDraft: String(isDraft),
        createdByMe: "true",
      });
      const rows = sortByIdAsc(Array.isArray(list) ? list : []);
      if (!rows.length) {
        emptyEl.hidden = false;
        window.FmI18n?.apply?.(emptyEl);
        return;
      }
      const loc = dateLocaleTag();
      const mg = tMsg("studentRequests.list.managerGroup", "Nhóm quản lý");
      const pr = tMsg("studentRequests.list.priority", "Mức ưu tiên");
      const st = tMsg("studentRequests.list.status", "Trạng thái");
      const tm = tMsg("studentRequests.list.time", "Thời gian");
      const noTitleRaw = window.FmI18n?.t?.("studentRequests.list.noTitle");
      const noTitle = noTitleRaw != null && noTitleRaw !== "studentRequests.list.noTitle" ? noTitleRaw : "(Không tiêu đề)";

      listEl.innerHTML = rows
        .map((item) => {
          const time = item.createdAt ? new Date(item.createdAt).toLocaleString(loc) : "—";
          const userTitle = String(item.title || "").trim();
          const titleHtml = userTitle ? escAttr(userTitle) : noTitle;
          return `<article class="student-card">
          <h3 class="student-item-title">${titleHtml}</h3>
          <p class="student-item-meta">${escAttr(mg)}: ${escAttr(labelManagerGroup(item.managerGroup))}</p>
          <p class="student-item-meta">${escAttr(pr)}: <span class="request-priority ${priorityClass(item.priority)}">${escAttr(labelPriority(item.priority))}</span></p>
          <p class="student-item-meta">${escAttr(st)}: ${escAttr(labelStatus(item.status))}</p>
          <p class="student-item-meta">${escAttr(tm)}: ${escAttr(time)}</p>
          <p>${escAttr(item.note || "")}</p>
        </article>`;
        })
        .join("");
      emptyEl.hidden = true;
      listEl.hidden = false;
      window.FmI18n?.apply?.(listEl);
    } catch (e) {
      console.warn(e);
      emptyEl.hidden = false;
      emptyEl.textContent = tMsg("studentRequests.alerts.loadFail", "Không tải được danh sách yêu cầu.");
    }
  };

  const page = document.body.getAttribute("data-student-page");
  if (page === "create-request") {
    initBackButton();
    initCreatePage();
  }
  if (page === "sent-requests") {
    initBackButton();
    void renderList("studentRequestList", "studentEmptyState", false);
  }
  if (page === "draft-requests") {
    initBackButton();
    void renderList("studentRequestList", "studentEmptyState", true);
  }

  window.addEventListener("fm-i18n-applied", () => {
    if (page === "sent-requests") void renderList("studentRequestList", "studentEmptyState", false);
    if (page === "draft-requests") void renderList("studentRequestList", "studentEmptyState", true);
    if (page === "create-request") {
      const noteField = document.getElementById("studentRequestNote");
      const noteCount = document.getElementById("studentNoteCount");
      if (noteField && noteCount) {
        const k = "studentRequests.create.noteCounter";
        const v = window.FmI18n?.t?.(k, { n: noteField.value.length });
        noteCount.textContent = v != null && v !== k ? v : `${noteField.value.length}/250`;
      }
    }
  });
})(window);
