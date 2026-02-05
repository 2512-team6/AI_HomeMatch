package com.homematch.domain.listing;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "listings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "listing_id")
    private Integer listingId;

    @Column(nullable = false, length = 100)
    private String owner;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "sub_image_url_1", length = 512)
    private String subImageUrl1;

    @Column(name = "sub_image_url_2", length = 512)
    private String subImageUrl2;

    @Column(name = "sub_image_url_3", length = 512)
    private String subImageUrl3;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal lat;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal lng;

    @Column(nullable = false)
    private Long priceDeposit;

    @Column(nullable = false, length = 20)
    private String leaseType; // "월세" or "전세"

    @Column(nullable = true)
    private Long priceRent; // 월세일 경우만 값이 있음

    @Column(nullable = true)
    private Long mCost; // 관리비

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal areaM2;

    @Column(nullable = true)
    private Integer builtYear;

    @Column(nullable = true)
    private Integer floor;

    @Column(nullable = true)
    private Integer floorBuilding;

    @Column(nullable = true)
    private Integer rooms;

    @Column(nullable = true)
    private Integer bathrooms;

    @Column(nullable = false)
    private Boolean parking;

    @Column(nullable = true)
    private LocalDate moveInDate;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
