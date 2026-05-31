package com.facilitymanager.controller;

import com.facilitymanager.dto.KetQuaApi;
import com.facilitymanager.dto.VaiTroPhanHoiDto;
import com.facilitymanager.dto.YeuCauCapNhatVaiTro;
import com.facilitymanager.dto.YeuCauTaoVaiTro;
import com.facilitymanager.service.DichVuBangMenuVaiTro;
import com.facilitymanager.service.DichVuQuanLyVaiTro;
import com.facilitymanager.vo.VoMenu;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class DieuKhienQuanLyVaiTro {

    private final DichVuQuanLyVaiTro dichVuQuanLyVaiTro;
    private final DichVuBangMenuVaiTro dichVuBangMenuVaiTro;

    public DieuKhienQuanLyVaiTro(
            DichVuQuanLyVaiTro dichVuQuanLyVaiTro,
            DichVuBangMenuVaiTro dichVuBangMenuVaiTro
    ) {
        this.dichVuQuanLyVaiTro = dichVuQuanLyVaiTro;
        this.dichVuBangMenuVaiTro = dichVuBangMenuVaiTro;
    }

    @GetMapping("/roles")
    public List<VaiTroPhanHoiDto> danhSachVaiTro() {
        return dichVuQuanLyVaiTro.danhSach();
    }

    @GetMapping("/menu-tree")
    public KetQuaApi<List<VoMenu>> cayMenuDayDu() {
        return KetQuaApi.ok(dichVuBangMenuVaiTro.layCayMenuDayDu());
    }

    @PostMapping("/roles")
    public VaiTroPhanHoiDto tao(@RequestBody YeuCauTaoVaiTro body) {
        return dichVuQuanLyVaiTro.tao(body);
    }

    @PutMapping("/roles/{id}")
    public VaiTroPhanHoiDto capNhat(@PathVariable Long id, @RequestBody YeuCauCapNhatVaiTro body) {
        return dichVuQuanLyVaiTro.capNhat(id, body);
    }

    @DeleteMapping("/roles/{id}")
    public void xoa(@PathVariable Long id) {
        dichVuQuanLyVaiTro.xoa(id);
    }
}
