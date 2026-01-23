package com.homematch.domain.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Integer> {
    
    Optional<Listing> findByListingId(Integer listingId);
    
    // 가격 범위로 검색
    @Query("SELECT l FROM Listing l WHERE l.priceDeposit BETWEEN :minDeposit AND :maxDeposit")
    List<Listing> findByPriceDepositBetween(@Param("minDeposit") Long minDeposit, @Param("maxDeposit") Long maxDeposit);
    
    // 임대 유형으로 검색
    List<Listing> findByLeaseType(String leaseType);
    
    // 주소로 검색 (부분 일치)
    @Query("SELECT l FROM Listing l WHERE l.address LIKE CONCAT('%', :keyword, '%')")
    List<Listing> findByAddressContaining(@Param("keyword") String keyword);
    
    // 복합 필터링 쿼리
    @Query("SELECT l FROM Listing l WHERE " +
           "(:leaseType IS NULL OR l.leaseType = :leaseType) AND " +
           "(:minDeposit IS NULL OR l.priceDeposit >= :minDeposit) AND " +
           "(:maxDeposit IS NULL OR l.priceDeposit <= :maxDeposit) AND " +
           "(:minRent IS NULL OR l.priceRent >= :minRent) AND " +
           "(:maxRent IS NULL OR l.priceRent <= :maxRent) AND " +
           "(:parking IS NULL OR l.parking = :parking) AND " +
           "(:minRooms IS NULL OR l.rooms >= :minRooms) AND " +
           "(:maxRooms IS NULL OR l.rooms <= :maxRooms) AND " +
           "(:minArea IS NULL OR l.areaM2 >= :minArea) AND " +
           "(:maxArea IS NULL OR l.areaM2 <= :maxArea) AND " +
           "(:keyword IS NULL OR l.address LIKE CONCAT('%', :keyword, '%'))")
    List<Listing> findWithFilters(
            @Param("leaseType") String leaseType,
            @Param("minDeposit") Long minDeposit,
            @Param("maxDeposit") Long maxDeposit,
            @Param("minRent") Long minRent,
            @Param("maxRent") Long maxRent,
            @Param("parking") Boolean parking,
            @Param("minRooms") Integer minRooms,
            @Param("maxRooms") Integer maxRooms,
            @Param("minArea") BigDecimal minArea,
            @Param("maxArea") BigDecimal maxArea,
            @Param("keyword") String keyword
    );
}
