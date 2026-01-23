package com.homematch.domain.listing;

import com.homematch.domain.listing.dto.ListingListResponse;
import com.homematch.domain.listing.dto.ListingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ListingService {

    private final ListingRepository listingRepository;

    public List<ListingListResponse> getAllListings() {
        return listingRepository.findAll().stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    public ListingResponse getListingById(Integer listingId) {
        Listing listing = listingRepository.findByListingId(listingId)
                .orElseThrow(() -> new RuntimeException("매물을 찾을 수 없습니다."));
        return toResponse(listing);
    }

    public List<ListingListResponse> searchListings(
            String keyword, 
            String leaseType, 
            Long minDeposit, 
            Long maxDeposit,
            Long minRent,
            Long maxRent,
            Boolean parking,
            Integer minRooms,
            Integer maxRooms,
            java.math.BigDecimal minArea,
            java.math.BigDecimal maxArea
    ) {
        List<Listing> listings = listingRepository.findWithFilters(
                leaseType,
                minDeposit,
                maxDeposit,
                minRent,
                maxRent,
                parking,
                minRooms,
                maxRooms,
                minArea,
                maxArea,
                keyword
        );
        
        return listings.stream()
                .map(this::toListResponse)
                .collect(Collectors.toList());
    }

    private ListingResponse toResponse(Listing listing) {
        return ListingResponse.builder()
                .listingId(listing.getListingId())
                .owner(listing.getOwner())
                .title(listing.getTitle())
                .address(listing.getAddress())
                .lat(listing.getLat())
                .lng(listing.getLng())
                .priceDeposit(listing.getPriceDeposit())
                .leaseType(listing.getLeaseType())
                .priceRent(listing.getPriceRent())
                .mCost(listing.getMCost())
                .areaM2(listing.getAreaM2())
                .builtYear(listing.getBuiltYear())
                .floor(listing.getFloor())
                .floorBuilding(listing.getFloorBuilding())
                .rooms(listing.getRooms())
                .bathrooms(listing.getBathrooms())
                .parking(listing.getParking())
                .moveInDate(listing.getMoveInDate())
                .createdAt(listing.getCreatedAt())
                .build();
    }

    private ListingListResponse toListResponse(Listing listing) {
        return ListingListResponse.builder()
                .listingId(listing.getListingId())
                .title(listing.getTitle())
                .address(listing.getAddress())
                .priceDeposit(listing.getPriceDeposit())
                .leaseType(listing.getLeaseType())
                .priceRent(listing.getPriceRent())
                .mCost(listing.getMCost())
                .areaM2(listing.getAreaM2())
                .floor(listing.getFloor())
                .floorBuilding(listing.getFloorBuilding())
                .rooms(listing.getRooms())
                .parking(listing.getParking())
                .moveInDate(listing.getMoveInDate())
                .build();
    }
}
