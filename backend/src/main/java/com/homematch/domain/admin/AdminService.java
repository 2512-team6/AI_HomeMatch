package com.homematch.domain.admin;

import com.homematch.domain.admin.dto.AdminStatsResponse;
import com.homematch.domain.admin.dto.ChartDataPoint;
import com.homematch.domain.contract.ContractReviewRepository;
import com.homematch.domain.listing.ListingRepository;
import com.homematch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ContractReviewRepository contractReviewRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalListings = listingRepository.count();
        
        // 최근 7일간 가입자 수 (updated_at 기준, 회원가입 시 updated_at에 현재 시간 저장)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long recentSignups = userRepository.findAll().stream()
                .filter(user -> {
                    LocalDateTime updatedAt = user.getUpdated_at();
                    return updatedAt != null && updatedAt.isAfter(sevenDaysAgo);
                })
                .count();
        
        // 계약서 검증 건수 (contract_reviews 테이블의 전체 데이터 수)
        long totalContracts = contractReviewRepository.count();
        
        // 최근 30일간 일별 통계 데이터 생성
        List<ChartDataPoint> chartData = generateChartData();
        
        return AdminStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalListings(totalListings)
                .totalContracts(totalContracts)
                .recentSignups(recentSignups)
                .chartData(chartData)
                .build();
    }
    
    private List<ChartDataPoint> generateChartData() {
        List<ChartDataPoint> chartData = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");
        
        // 최근 30일간 데이터 생성
        for (int i = 29; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.atTime(23, 59, 59);
            
            // 해당 날짜에 가입한 사용자 수
            long usersOnDate = userRepository.findAll().stream()
                    .filter(user -> {
                        LocalDateTime updatedAt = user.getUpdated_at();
                        return updatedAt != null && 
                               !updatedAt.isBefore(startOfDay) && 
                               !updatedAt.isAfter(endOfDay);
                    })
                    .count();
            
            // 해당 날짜에 등록된 매물 수
            long listingsOnDate = listingRepository.findAll().stream()
                    .filter(listing -> {
                        LocalDateTime createdAt = listing.getCreatedAt();
                        return createdAt != null && 
                               !createdAt.isBefore(startOfDay) && 
                               !createdAt.isAfter(endOfDay);
                    })
                    .count();
            
            chartData.add(ChartDataPoint.builder()
                    .date(date.format(formatter))
                    .users(usersOnDate)
                    .listings(listingsOnDate)
                    .build());
        }
        
        return chartData;
    }
}
