package com.facilitymanager.service;

import org.springframework.stereotype.Service;

@Service
public class DichVuKiemTraSucKhoe {

    /**
     * Kiểm tra nhanh xem lớp dịch vụ có phản hồi bình thường hay không (dùng cho endpoint health).
     *
     * @return {@code true} nếu coi như hệ thống đang hoạt động
     */
    public boolean dangHoatDong() {
        return true;
    }
}
