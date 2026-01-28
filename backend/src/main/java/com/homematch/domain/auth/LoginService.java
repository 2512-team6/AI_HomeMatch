package com.homematch.domain.auth;

import com.homematch.domain.auth.dto.LoginRequest;
import com.homematch.domain.auth.dto.LoginResponse;
import com.homematch.domain.user.User;
import com.homematch.domain.user.UserRepository;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    /** 로그인 시 users 조회 1회만 수행 후 토큰·닉네임·역할 반환 */
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호 불일치");
        }

        String token = jwtTokenProvider.createToken(user.getEmail());
        String nickname = user.getNickname() != null ? user.getNickname() : "사용자";
        String role = user.getRole() != null ? user.getRole().name() : "USER";

        return LoginResponse.builder()
                .accessToken(token)
                .nickname(nickname)
                .role(role)
                .build();
    }
}