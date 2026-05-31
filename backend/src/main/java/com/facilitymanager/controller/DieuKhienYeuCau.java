package com.facilitymanager.controller;

import com.facilitymanager.dto.NguoiPhanViecDto;
import com.facilitymanager.dto.YeuCauDto;
import com.facilitymanager.security.BoLocPhienToken;
import com.facilitymanager.security.NoiDungPhien;
import com.facilitymanager.service.DichVuYeuCau;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "*")
public class DieuKhienYeuCau {

    private final DichVuYeuCau dichVuYeuCau;

    public DieuKhienYeuCau(DichVuYeuCau dichVuYeuCau) {
        this.dichVuYeuCau = dichVuYeuCau;
    }

    @GetMapping
    public List<YeuCauDto> list(
            HttpServletRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String managerGroup,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean isDraft,
            @RequestParam(required = false) Long createdByUserId,
            @RequestParam(required = false) Boolean openOnly,
            @RequestParam(required = false) Boolean assignedToMe,
            @RequestParam(required = false) Boolean createdByMe
    ) {
        Long userId = userId(request);
        String role = role(request);
        Long filterUser;
        if (Boolean.TRUE.equals(createdByMe)) {
            filterUser = userId;
        } else {
            filterUser = isStudent(role) ? userId : createdByUserId;
        }
        Long assignedFilter = null;
        String assignedNameFilter = null;
        if (Boolean.TRUE.equals(assignedToMe)) {
            assignedFilter = userId != null ? userId : -1L;
            assignedNameFilter = fullName(request);
        }
        return dichVuYeuCau.danhSach(
                status, managerGroup, priority, isDraft, filterUser, openOnly,
                assignedFilter, assignedNameFilter, role);
    }

    @GetMapping("/count-new")
    public Map<String, Long> countNew() {
        return Map.of("count", dichVuYeuCau.demMoi());
    }

    @GetMapping("/assignees")
    public List<NguoiPhanViecDto> assignees() {
        return dichVuYeuCau.danhSachNguoiPhanViec();
    }

    @GetMapping("/{id}")
    public YeuCauDto getById(HttpServletRequest request, @PathVariable Long id) {
        return dichVuYeuCau.chiTiet(id, userId(request), role(request));
    }

    @PostMapping
    public ResponseEntity<YeuCauDto> create(HttpServletRequest request, @RequestBody YeuCauDto body) {
        YeuCauDto saved = dichVuYeuCau.tao(body, false, userId(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/drafts")
    public ResponseEntity<YeuCauDto> createDraft(HttpServletRequest request, @RequestBody YeuCauDto body) {
        YeuCauDto saved = dichVuYeuCau.tao(body, true, userId(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public YeuCauDto update(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody YeuCauDto body
    ) {
        return dichVuYeuCau.capNhat(id, body, userId(request), role(request));
    }

    @PatchMapping("/{id}")
    public YeuCauDto patch(
            HttpServletRequest request,
            @PathVariable Long id,
            @RequestBody YeuCauDto body
    ) {
        return dichVuYeuCau.capNhat(id, body, userId(request), role(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(HttpServletRequest request, @PathVariable Long id) {
        dichVuYeuCau.xoa(id, userId(request), role(request));
        return ResponseEntity.noContent().build();
    }

    private static Long userId(HttpServletRequest request) {
        Object v = request.getAttribute(BoLocPhienToken.ATTR_USER_ID);
        if (v instanceof Long l) {
            return l;
        }
        if (v instanceof Number n) {
            return n.longValue();
        }
        return null;
    }

    private static String role(HttpServletRequest request) {
        Object v = request.getAttribute(BoLocPhienToken.ATTR_ROLE);
        return v != null ? String.valueOf(v) : null;
    }

    private static boolean isStudent(String role) {
        return role != null && "STUDENT".equalsIgnoreCase(role);
    }

    private static String fullName(HttpServletRequest request) {
        Object payload = request.getAttribute(BoLocPhienToken.ATTR_PAYLOAD);
        if (payload instanceof NoiDungPhien p && p.getFullName() != null && !p.getFullName().isBlank()) {
            return p.getFullName().trim();
        }
        return null;
    }

}
