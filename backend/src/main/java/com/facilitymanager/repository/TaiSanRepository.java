package com.facilitymanager.repository;

import com.facilitymanager.entity.TaiSan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaiSanRepository extends JpaRepository<TaiSan, Long> {
    interface CategoryQuantityView {
        String getCategory();
        Long getQuantity();
    }

    Optional<TaiSan> findByCardNumber(String cardNumber);
    List<TaiSan> findByStatus(String status);
    List<TaiSan> findByDepartment(String department);

    @Query("SELECT DISTINCT a FROM TaiSan a LEFT JOIN FETCH a.room LEFT JOIN FETCH a.buyerUser")
    List<TaiSan> findAllWithRelations();

    @Query("SELECT DISTINCT a FROM TaiSan a LEFT JOIN FETCH a.room LEFT JOIN FETCH a.buyerUser WHERE a.status = :status")
    List<TaiSan> findByStatusWithRelations(String status);

    @Query("""
            SELECT a.itemCategory as category, COALESCE(SUM(a.quantity), 0) as quantity
            FROM TaiSan a
            WHERE a.room.id = :roomId
            GROUP BY a.itemCategory
            """)
    List<CategoryQuantityView> tongHopSoLuongTheoDanhMuc(long roomId);

    @Query("""
            SELECT DISTINCT a FROM TaiSan a
            LEFT JOIN FETCH a.room r
            WHERE r IS NOT NULL AND UPPER(r.buildingCode) = UPPER(:buildingCode)
            ORDER BY r.floor ASC, r.roomCode ASC, a.cardNumber ASC
            """)
    List<TaiSan> findByRoomBuildingCode(String buildingCode);

    @Query("""
            SELECT DISTINCT a FROM TaiSan a
            LEFT JOIN FETCH a.room r
            WHERE r.id = :roomId
            ORDER BY a.cardNumber ASC
            """)
    List<TaiSan> findByRoomId(long roomId);

    @Query("""
            SELECT DISTINCT a FROM TaiSan a
            LEFT JOIN FETCH a.room r
            WHERE r IS NOT NULL AND LOWER(r.roomCode) = LOWER(:roomCode)
            ORDER BY a.cardNumber ASC
            """)
    List<TaiSan> findByRoomCode(String roomCode);
}
