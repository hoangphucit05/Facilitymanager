package com.facilitymanager.repository;

import com.facilitymanager.entity.QuyenMenuUngDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuyenMenuUngDungRepository extends JpaRepository<QuyenMenuUngDung, Long> {

    Optional<QuyenMenuUngDung> findByMenuName(String menuName);

    @Query("select distinct m from QuyenMenuUngDung m left join fetch m.parent")
    List<QuyenMenuUngDung> findAllCoCha();
}
