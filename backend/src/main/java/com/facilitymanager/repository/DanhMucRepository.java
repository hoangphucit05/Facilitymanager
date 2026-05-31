package com.facilitymanager.repository;

import com.facilitymanager.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DanhMucRepository extends JpaRepository<DanhMuc, Long> {

    List<DanhMuc> findByTypeOrderByIdAsc(String type);

    List<DanhMuc> findAllByOrderByIdAsc();

    Optional<DanhMuc> findByCode(String code);
}
