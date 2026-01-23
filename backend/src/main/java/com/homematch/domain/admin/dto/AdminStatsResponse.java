package com.homematch.domain.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private Long totalUsers;
    private Long totalListings;
    private Long totalContracts;
    private Long recentSignups;
    private List<ChartDataPoint> chartData; // 최근 30일간 일별 통계
}
