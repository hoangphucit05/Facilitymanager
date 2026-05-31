package com.facilitymanager.repository;

import com.facilitymanager.entity.KheSuDungPhong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface KheSuDungPhongRepository extends JpaRepository<KheSuDungPhong, Long> {

    @Query("""
            SELECT s FROM KheSuDungPhong s
            WHERE LOWER(s.roomCode) IN :roomCodes
              AND s.semester = :semester
              AND (s.validFrom IS NULL OR s.validFrom <= :weekEnd)
              AND (s.validTo IS NULL OR s.validTo >= :weekStart)
              AND (:shift IS NULL OR s.shift = :shift)
            ORDER BY s.roomCode ASC, s.weekday ASC, s.periodStart ASC
            """)
    List<KheSuDungPhong> findActiveForWeek(
            @Param("roomCodes") Collection<String> roomCodes,
            @Param("weekStart") LocalDate weekStart,
            @Param("weekEnd") LocalDate weekEnd,
            @Param("semester") String semester,
            @Param("shift") String shift
    );

    @Query("""
            SELECT s FROM KheSuDungPhong s
            WHERE LOWER(s.roomCode) IN :roomCodes
              AND s.semester = :semester
              AND s.weekday = :weekday
              AND (s.validFrom IS NULL OR s.validFrom <= :date)
              AND (s.validTo IS NULL OR s.validTo >= :date)
              AND (:shift IS NULL OR s.shift = :shift)
            ORDER BY s.roomCode ASC, s.periodStart ASC
            """)
    List<KheSuDungPhong> findActiveForDate(
            @Param("roomCodes") Collection<String> roomCodes,
            @Param("date") LocalDate date,
            @Param("weekday") Integer weekday,
            @Param("semester") String semester,
            @Param("shift") String shift
    );

    List<KheSuDungPhong> findByRoomCodeIgnoreCaseOrderByWeekdayAscPeriodStartAsc(String roomCode);

    Optional<KheSuDungPhong> findFirstByRoomCodeIgnoreCaseAndWeekdayAndPeriodStartLessThanEqualAndPeriodEndGreaterThanEqualOrderByIdAsc(
            String roomCode,
            Integer weekday,
            Integer currentPeriodStart,
            Integer currentPeriodEnd
    );
}
