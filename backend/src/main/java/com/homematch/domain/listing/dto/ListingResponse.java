package com.homematch.domain.listing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingResponse {
    private Integer listingId;
    private String owner;
    private String title;
    private String address;
    private BigDecimal lat;
    private BigDecimal lng;
    private Long priceDeposit;
    private String leaseType;
    private Long priceRent;
    private Long mCost;
    private BigDecimal areaM2;
    private Integer builtYear;
    private Integer floor;
    private Integer floorBuilding;
    private Integer rooms;
    private Integer bathrooms;
    private Boolean parking;
    private LocalDate moveInDate;
    private LocalDateTime createdAt;
}
