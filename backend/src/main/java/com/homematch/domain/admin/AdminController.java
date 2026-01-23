package com.homematch.domain.admin;

import com.homematch.domain.admin.dto.AdminStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        AdminStatsResponse stats = adminService.getStats();
        return ResponseEntity.ok(stats);
    }
}
