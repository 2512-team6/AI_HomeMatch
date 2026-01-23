package com.homematch.domain.auth;

import com.homematch.domain.auth.dto.LoginRequest;
import com.homematch.domain.auth.dto.SignupRequest;
import com.homematch.domain.user.UserService;

import lombok.RequiredArgsConstructor;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginService loginService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println(">>> 로그인 요청 이메일: " + request.getEmail());
        
        // 1. 토큰 생성
        String token = loginService.login(request);
        
        // 2. 닉네임과 role 가져오기
        String nickname = userService.getNicknameByEmail(request.getEmail());
        String role = userService.getRoleByEmail(request.getEmail());

        // 3. 응답 데이터 구성 (nickname, role 추가)
        return ResponseEntity.ok(Map.of(
            "accessToken", token,
            "nickname", nickname,
            "role", role
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok().build();
    }


    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        userService.signup(
        request.getEmail(),
        request.getPassword(),
        request.getName(),
        request.getNickname()
    );
        return ResponseEntity.ok().build();
    }
}
