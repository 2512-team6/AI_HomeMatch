package com.homematch.domain.auth;

import com.homematch.domain.auth.dto.LoginRequest;
import com.homematch.domain.auth.dto.SignupRequest;
import com.homematch.domain.user.UserService;

import lombok.RequiredArgsConstructor;

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
        // users 조회 1회만 수행 (LoginService에서 token·nickname·role 한꺼번에 반환)
        return ResponseEntity.ok(loginService.login(request));
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
