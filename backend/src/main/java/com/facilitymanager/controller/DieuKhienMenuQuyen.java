package com.facilitymanager.controller;

import com.facilitymanager.dto.KetQuaApi;
import com.facilitymanager.security.BoLocPhienToken;
import com.facilitymanager.service.DichVuBangMenuVaiTro;
import com.facilitymanager.vo.MenuVo;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permission")
@CrossOrigin(origins = "*")
public class DieuKhienMenuQuyen {

    private final DichVuBangMenuVaiTro dichVuBangMenuVaiTro;

    public DieuKhienMenuQuyen(DichVuBangMenuVaiTro dichVuBangMenuVaiTro) {
        this.dichVuBangMenuVaiTro = dichVuBangMenuVaiTro;
    }

    @GetMapping("/getMenuList")
    public KetQuaApi<List<MenuVo>> getMenuList(HttpServletRequest request) {
        String roleCode = (String) request.getAttribute(BoLocPhienToken.ATTR_ROLE);
        if (roleCode == null || roleCode.isBlank()) {
            return KetQuaApi.ok(List.of());
        }
        return KetQuaApi.ok(dichVuBangMenuVaiTro.layCayMenuChoMaVaiTro(roleCode));
    }
}
