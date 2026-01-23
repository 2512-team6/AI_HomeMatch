package com.homematch.domain.listing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingListResponse {
    private Integer listingId;
    private String title;
    private String address;
    private Long priceDeposit;
    private String leaseType;
    private Long priceRent;
    private Long mCost;
    private BigDecimal areaM2;
    private Integer floor;
    private Integer floorBuilding;
    private Integer rooms;
    private Boolean parking;
    private LocalDate moveInDate;
}
