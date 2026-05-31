package com.facilitymanager.repository;

import com.facilitymanager.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

    Optional<NguoiDung> findByUsername(String username);

    boolean existsByUsername(String username);

    @Query("select count(u) from NguoiDung u where upper(trim(u.role)) = upper(trim(:roleCode))")
    long countByRoleIgnoreCase(@Param("roleCode") String roleCode);

    @Query("select u from NguoiDung u where lower(trim(u.fullName)) = lower(trim(:fullName))")
    List<NguoiDung> findAllByFullNameNormalized(@Param("fullName") String fullName);
}
