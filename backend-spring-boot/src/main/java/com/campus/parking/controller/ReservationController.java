package com.campus.parking.controller;

import com.campus.parking.entity.Reservation;
import com.campus.parking.service.interfaces.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Reservation Controller", description = "Endpoints for reserving campus parking spots and managing schedule details.")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @PostMapping
    @Operation(summary = "Book a new parking slot reservation", description = "Verifies slot status, checks overlapping schedule bookings, and binds reservation to the user's owned vehicle.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Reservation created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation or business rule failure"),
            @ApiResponse(responseCode = "409", description = "Overlapping slot reservation exists")
    })
    public ResponseEntity<Reservation> bookSlot(
            @RequestParam Long userId,
            @RequestParam Long vehicleId,
            @RequestParam Long slotId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String startTime,
            @RequestParam String endTime
    ) {
        LocalTime parsedStart = LocalTime.parse(startTime);
        LocalTime parsedEnd = LocalTime.parse(endTime);

        Reservation reservation = reservationService.createReservation(userId, vehicleId, slotId, date, parsedStart, parsedEnd);
        return new ResponseEntity<>(reservation, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get list of reservations for a specific user ID")
    public ResponseEntity<List<Reservation>> getUserReservations(@PathVariable Long userId) {
        List<Reservation> userRes = reservationService.getReservationsByUser(userId);
        return ResponseEntity.ok(userRes);
    }

    @GetMapping
    @Operation(summary = "Get all campus reservations (ADMIN/AGENT Only)")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel a reservation", description = "Cancels a pending reservation. Active or completed logs cannot be altered.")
    public ResponseEntity<Reservation> cancel(
            @PathVariable Long id,
            @RequestParam Long userId
    ) {
        Reservation cancelled = reservationService.cancelReservation(id, userId);
        return ResponseEntity.ok(cancelled);
    }
}
