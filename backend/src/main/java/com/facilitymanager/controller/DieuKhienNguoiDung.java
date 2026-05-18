package com.facilitymanager.controller;

import com.facilitymanager.dto.NguoiDungPhanHoiDto;
import com.facilitymanager.service.DichVuQuanLyNguoiDung;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class DieuKhienNguoiDung {

    private final DichVuQuanLyNguoiDung dichVuQuanLyNguoiDung;

    public DieuKhienNguoiDung(DichVuQuanLyNguoiDung dichVuQuanLyNguoiDung) {
        this.dichVuQuanLyNguoiDung = dichVuQuanLyNguoiDung;
    }

    @GetMapping
    public List<NguoiDungPhanHoiDto> layDanhSach() {
        return dichVuQuanLyNguoiDung.layDanhSach();
    }

    @GetMapping("/{userId}")
    public NguoiDungPhanHoiDto layTheoId(@PathVariable("userId") long userId) {
        return dichVuQuanLyNguoiDung.layTheoId(userId);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NguoiDungPhanHoiDto> taoJson(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(dichVuQuanLyNguoiDung.tao(
                chuoi(body, "username"),
                chuoi(body, "password"),
                chuoi(body, "fullName", "fullname"),
                chuoi(body, "address"),
                chuoi(body, "phoneNumber", "phone"),
                chuoi(body, "role"),
                chuoi(body, "status"),
                chuoi(body, "avatarUrl", "avatar")
        ));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NguoiDungPhanHoiDto> taoMultipart(
            @RequestParam("username") String username,
            @RequestParam("password") String password,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "fullname", required = false) String fullname,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "avatarUrl", required = false) String avatarUrl
    ) {
        String hoTen = fullName != null && !fullName.isBlank() ? fullName : fullname;
        String sdt = phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : phone;
        return ResponseEntity.ok(dichVuQuanLyNguoiDung.tao(username, password, hoTen, address, sdt, role, status, avatarUrl));
    }

    @PutMapping(value = "/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public NguoiDungPhanHoiDto capNhatJson(@PathVariable("userId") long userId, @RequestBody Map<String, Object> body) {
        return dichVuQuanLyNguoiDung.capNhat(
                userId,
                chuoi(body, "username"),
                chuoi(body, "password"),
                chuoi(body, "fullName", "fullname"),
                chuoi(body, "address"),
                chuoi(body, "phoneNumber", "phone"),
                chuoi(body, "role"),
                chuoi(body, "status"),
                chuoi(body, "avatarUrl", "avatar")
        );
    }

    @PutMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public NguoiDungPhanHoiDto capNhatMultipart(
            @PathVariable("userId") long userId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "fullName", required = false) String fullName,
            @RequestParam(value = "fullname", required = false) String fullname,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "avatarUrl", required = false) String avatarUrl
    ) {
        String hoTen = fullName != null && !fullName.isBlank() ? fullName : fullname;
        String sdt = phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : phone;
        return dichVuQuanLyNguoiDung.capNhat(userId, username, password, hoTen, address, sdt, role, status, avatarUrl);
    }

    @PatchMapping("/{userId}")
    public NguoiDungPhanHoiDto capNhatMotPhan(@PathVariable("userId") long userId, @RequestBody Map<String, Object> body) {
        return dichVuQuanLyNguoiDung.capNhatMotPhan(userId, body);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> xoa(@PathVariable("userId") long userId) {
        dichVuQuanLyNguoiDung.xoa(userId);
        return ResponseEntity.noContent().build();
    }

    private static String chuoi(Map<String, Object> body, String... keys) {
        for (String key : keys) {
            if (body.containsKey(key) && body.get(key) != null) {
                String s = String.valueOf(body.get(key)).trim();
                if (!s.isEmpty()) {
                    return s;
                }
            }
        }
        return null;
    }
}
