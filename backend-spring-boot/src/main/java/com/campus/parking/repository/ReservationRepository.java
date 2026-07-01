package com.campus.parking.repository;

import com.campus.parking.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserId(Long userId);

    @Query("SELECT r FROM Reservation r WHERE r.parkingSlot.id = :slotId " +
           "AND r.reservationDate = :resDate " +
           "AND r.status IN ('PENDING', 'ACTIVE') " +
           "AND (:startTime < r.endTime AND r.startTime < :endTime)")
    List<Reservation> findOverlappingReservations(
            @Param("slotId") Long slotId,
            @Param("resDate") LocalDate resDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
