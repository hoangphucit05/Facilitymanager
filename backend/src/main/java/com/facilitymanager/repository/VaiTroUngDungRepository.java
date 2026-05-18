package com.facilitymanager.repository;

import com.facilitymanager.entity.VaiTroUngDung;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaiTroUngDungRepository extends JpaRepository<VaiTroUngDung, Long> {

    Optional<VaiTroUngDung> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @EntityGraph(attributePaths = {"menus", "parentRole"})
    @Query("select v from VaiTroUngDung v where upper(v.code) = upper(:code)")
    Optional<VaiTroUngDung> timTheoMaKemMenu(@Param("code") String code);

    @EntityGraph(attributePaths = {"menus", "parentRole"})
    @Query("select v from VaiTroUngDung v")
    List<VaiTroUngDung> timTatCaKemMenu();

    @EntityGraph(attributePaths = {"menus", "parentRole"})
    @Query("select v from VaiTroUngDung v where v.id = :id")
    Optional<VaiTroUngDung> timTheoIdKemMenu(@Param("id") Long id);

    long countByParentRole_Id(Long parentRoleId);
}
