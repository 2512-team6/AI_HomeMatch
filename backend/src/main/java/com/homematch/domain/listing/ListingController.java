package com.homematch.domain.listing;

import com.homematch.domain.listing.dto.ListingListResponse;
import com.homematch.domain.listing.dto.ListingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ListingController {

    private final ListingService listingService;

    @GetMapping
    public ResponseEntity<List<ListingListResponse>> getAllListings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String leaseType,
            @RequestParam(required = false) Long minDeposit,
            @RequestParam(required = false) Long maxDeposit,
            @RequestParam(required = false) Long minRent,
            @RequestParam(required = false) Long maxRent,
            @RequestParam(required = false) Boolean parking,
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) Integer maxRooms,
            @RequestParam(required = false) java.math.BigDecimal minArea,
            @RequestParam(required = false) java.math.BigDecimal maxArea
    ) {
        List<ListingListResponse> listings;
        
        // 필터 조건이 하나라도 있으면 검색, 없으면 전체 조회
        if (keyword != null || leaseType != null || minDeposit != null || maxDeposit != null 
                || minRent != null || maxRent != null
                || parking != null || minRooms != null || maxRooms != null 
                || minArea != null || maxArea != null) {
            listings = listingService.searchListings(
                    keyword, leaseType, minDeposit, maxDeposit, 
                    minRent, maxRent,
                    parking, minRooms, maxRooms, minArea, maxArea
            );
        } else {
            listings = listingService.getAllListings();
        }
        
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListingById(@PathVariable Integer id) {
        ListingResponse listing = listingService.getListingById(id);
        return ResponseEntity.ok(listing);
    }
}
