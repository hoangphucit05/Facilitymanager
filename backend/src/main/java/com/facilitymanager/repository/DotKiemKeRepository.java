package com.facilitymanager.repository;

import com.facilitymanager.entity.DotKiemKe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DotKiemKeRepository extends JpaRepository<DotKiemKe, Long> {

    List<DotKiemKe> findAllByOrderByStartedAtDesc();
}
