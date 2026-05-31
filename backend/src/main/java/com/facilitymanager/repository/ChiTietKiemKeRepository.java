package com.facilitymanager.repository;

import com.facilitymanager.entity.ChiTietKiemKe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietKiemKeRepository extends JpaRepository<ChiTietKiemKe, Long> {

    List<ChiTietKiemKe> findByAudit_IdOrderByRoomFloorAscRoomCodeAscCardNumberAsc(Long auditId);
}
