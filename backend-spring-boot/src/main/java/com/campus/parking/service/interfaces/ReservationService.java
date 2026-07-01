package com.campus.parking.service.interfaces;

import com.campus.parking.entity.Reservation;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationService {
    Reservation createReservation(Long userId, Long vehicleId, Long slotId, LocalDate date, LocalTime startTime, LocalTime endTime);
    Reservation cancelReservation(Long reservationId, Long userId);
    List<Reservation> getReservationsByUser(Long userId);
    List<Reservation> getAllReservations();
    Reservation validateVehicleEntry(String plateNumber);
    Reservation validateVehicleExit(String plateNumber);
}
