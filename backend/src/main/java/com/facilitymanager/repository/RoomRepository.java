package com.facilitymanager.repository;

import com.facilitymanager.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomCode(String roomCode);

    List<Room> findByBuildingCodeOrderByRoomCodeAsc(String buildingCode);

    boolean existsByRoomCode(String roomCode);

    boolean existsByRoomCodeAndIdNot(String roomCode, Long id);
}
