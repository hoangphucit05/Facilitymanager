package com.facilitymanager.repository;

import com.facilitymanager.entity.YeuCau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface YeuCauRepository extends JpaRepository<YeuCau, Long>, JpaSpecificationExecutor<YeuCau> {

    long countByStatusAndDraftFalse(String status);
}
