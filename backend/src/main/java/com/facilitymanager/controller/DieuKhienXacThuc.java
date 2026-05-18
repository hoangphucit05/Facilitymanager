package com.facilitymanager.controller;

import com.facilitymanager.dto.KetQuaApi;
import com.facilitymanager.dto.PhanHoiDangNhap;
import com.facilitymanager.service.DichVuDangKyUngDung;
import com.facilitymanager.service.DichVuDangNhapUngDung;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class DieuKhienXacThuc {

    private final DichVuDangNhapUngDung dichVuDangNhapUngDung;
    private final DichVuDangKyUngDung dichVuDangKyUngDung;

    public DieuKhienXacThuc(
            DichVuDangNhapUngDung dichVuDangNhapUngDung,
            DichVuDangKyUngDung dichVuDangKyUngDung
    ) {
        this.dichVuDangNhapUngDung = dichVuDangNhapUngDung;
        this.dichVuDangKyUngDung = dichVuDangKyUngDung;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<PhanHoiDangNhap> login(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("code") String code,
            @RequestParam("captchaId") String captchaId,
            @RequestParam(value = "saveLogin", required = false) String saveLogin
    ) {
        boolean save = saveLogin != null && "true".equalsIgnoreCase(saveLogin.trim());
        PhanHoiDangNhap body = dichVuDangNhapUngDung.dangNhap(username, password, code, captchaId, save);
        return ResponseEntity.ok(body);
    }

    @PostMapping(value = "/regist", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<KetQuaApi<Void>> regist(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam("nickname") String nickname,
            @RequestParam("code") String code,
            @RequestParam("captchaId") String captchaId
    ) {
        dichVuDangKyUngDung.dangKy(username, password, nickname, code, captchaId);
        return ResponseEntity.ok(KetQuaApi.ok(null));
    }

    @PostMapping("/logout")
    public ResponseEntity<KetQuaApi<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
        dichVuDangNhapUngDung.dangXuat(authorization);
        return ResponseEntity.ok(KetQuaApi.ok(null));
    }
}
