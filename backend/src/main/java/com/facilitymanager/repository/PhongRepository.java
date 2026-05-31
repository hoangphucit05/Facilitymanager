package com.facilitymanager.repository;

import com.facilitymanager.entity.Phong;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PhongRepository extends JpaRepository<Phong, Long> {

    Optional<Phong> findByRoomCode(String roomCode);

    List<Phong> findByBuildingCodeOrderByFloorAscRoomCodeAsc(String buildingCode);

    boolean existsByRoomCode(String roomCode);

    boolean existsByRoomCodeAndIdNot(String roomCode, Long id);
}
