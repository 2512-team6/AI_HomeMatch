package com.homematch.domain.auth;

import com.homematch.domain.auth.dto.LoginRequest;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder; // ✅ 추가
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder; // ✅ 추가 (SecurityConfig의 Bean 주입)

    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자"));

        // ❌ if (!user.getPassword().equals(request.getPassword())) {
        
        // ✅ BCrypt 암호화 비교는 반드시 matches 메서드를 사용해야 합니다.
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }

        return jwtTokenProvider.createToken(user.getEmail());
    }
}