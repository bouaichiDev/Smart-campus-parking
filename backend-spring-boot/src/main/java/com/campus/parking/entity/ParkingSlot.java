package com.campus.parking.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(name = "parking_slots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Slot number is mandatory")
    @Column(name = "slot_number", unique = true, nullable = false)
    private String slotNumber;

    @NotBlank(message = "Zone designation is required")
    @Column(nullable = false)
    private String zone;

    @NotNull(message = "Slot type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "slot_type", nullable = false)
    private SlotType slotType;

    @NotNull(message = "Status cannot be empty")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    public enum SlotType {
        STANDARD,
        COMPACT,
        EV,
        HANDICAPPED
    }

    public enum Status {
        AVAILABLE,
        OCCUPIED,
        MAINTENANCE
    }
}
