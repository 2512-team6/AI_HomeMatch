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
        loginService.login(request);
        return ResponseEntity.ok().build();
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
