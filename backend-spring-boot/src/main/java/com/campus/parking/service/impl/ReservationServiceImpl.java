package com.campus.parking.service.impl;

import com.campus.parking.entity.*;
import com.campus.parking.repository.*;
import com.campus.parking.service.interfaces.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@Transactional
public class ReservationServiceImpl implements ReservationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private ParkingSlotRepository parkingSlotRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Override
    public Reservation createReservation(Long userId, Long vehicleId, Long slotId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User account not found"));

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        ParkingSlot slot = parkingSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));

        // Business Rule 1: User can reserve only with one of their own registered vehicles
        if (!vehicle.getOwner().getId().equals(user.getId()) && !user.getRole().equals(User.Role.ADMIN)) {
            throw new IllegalArgumentException("User is only authorized to reserve using their own registered vehicles");
        }

        // Business Rule 2: Parking slot under maintenance cannot be reserved
        if (slot.getStatus() == ParkingSlot.Status.MAINTENANCE) {
            throw new IllegalStateException("Requested parking slot is under active maintenance and cannot be reserved");
        }

        // Business Rule 3: No double booking overlapping check
        List<Reservation> overlaps = reservationRepository.findOverlappingReservations(slotId, date, startTime, endTime);
        if (!overlaps.isEmpty()) {
            throw new IllegalStateException("Overlapping reservation schedule exists on this slot. Slot already booked.");
        }

        Reservation reservation = Reservation.builder()
                .user(user)
                .vehicle(vehicle)
                .parkingSlot(slot)
                .reservationDate(date)
                .startTime(startTime)
                .endTime(endTime)
                .status(Reservation.Status.PENDING)
                .build();

        return reservationRepository.save(reservation);
    }

    @Override
    public Reservation cancelReservation(Long reservationId, Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation record not found"));

        if (!reservation.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to cancel another user's reservation");
        }

        if (reservation.getStatus() != Reservation.Status.PENDING) {
            throw new IllegalStateException("Only pending reservations can be cancelled");
        }

        reservation.setStatus(Reservation.Status.CANCELLED);
        return reservationRepository.save(reservation);
    }

    @Override
    public List<Reservation> getReservationsByUser(Long userId) {
        return reservationRepository.findByUserId(userId);
    }

    @Override
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Override
    public Reservation validateVehicleEntry(String plateNumber) {
        // Find vehicle
        Vehicle vehicle = vehicleRepository.findByPlateNumber(plateNumber)
                .orElseThrow(() -> new RuntimeException("License plate not registered on campus system"));

        LocalDate today = LocalDate.now();
        // Look for today's pending reservation for this vehicle
        List<Reservation> userResList = reservationRepository.findByUserId(vehicle.getOwner().getId());
        Reservation todayReservation = userResList.stream()
                .filter(r -> r.getVehicle().getId().equals(vehicle.getId())
                        && r.getReservationDate().equals(today)
                        && r.getStatus() == Reservation.Status.PENDING)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active or pending reservation today for this plate"));

        // Update status and entry times
        todayReservation.setStatus(Reservation.Status.ACTIVE);
        todayReservation.setActualEntryTime(LocalTime.now());

        // Set parking slot status to OCCUPIED
        ParkingSlot slot = todayReservation.getParkingSlot();
        slot.setStatus(ParkingSlot.Status.OCCUPIED);
        parkingSlotRepository.save(slot);

        return reservationRepository.save(todayReservation);
    }

    @Override
    public Reservation validateVehicleExit(String plateNumber) {
        Vehicle vehicle = vehicleRepository.findByPlateNumber(plateNumber)
                .orElseThrow(() -> new RuntimeException("License plate not registered on campus system"));

        LocalDate today = LocalDate.now();
        List<Reservation> userResList = reservationRepository.findByUserId(vehicle.getOwner().getId());
        Reservation activeReservation = userResList.stream()
                .filter(r -> r.getVehicle().getId().equals(vehicle.getId())
                        && r.getReservationDate().equals(today)
                        && r.getStatus() == Reservation.Status.ACTIVE)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No currently active gate session found for this vehicle"));

        activeReservation.setStatus(Reservation.Status.COMPLETED);
        activeReservation.setActualExitTime(LocalTime.now());

        // Set parking slot back to AVAILABLE
        ParkingSlot slot = activeReservation.getParkingSlot();
        slot.setStatus(ParkingSlot.Status.AVAILABLE);
        parkingSlotRepository.save(slot);

        return reservationRepository.save(activeReservation);
    }
}
