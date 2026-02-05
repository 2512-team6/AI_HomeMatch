package com.homematch.global.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Cloudtype 등 PaaS 헬스 체크용. GET / 또는 GET /health 가 200 이어야 서비스가 정상으로 인식됨.
 */
@RestController
public class HealthController {

    @GetMapping({ "/", "/health" })
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }
}
