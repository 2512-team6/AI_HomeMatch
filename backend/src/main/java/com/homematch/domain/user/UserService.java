package com.homematch.domain.user;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void signup(String email, String rawPassword, String name, String nickname) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .name(name)
                .nickname(nickname)
                .role(Role.USER) // 기본 권한
                .updated_at(LocalDateTime.now())
                .build();

        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String getNicknameByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getNickname)
                .orElse("사용자"); // 유저를 찾지 못할 경우 기본값
    }

    @Transactional(readOnly = true)
    public String getRoleByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(user -> user.getRole().name()) // Role enum을 String으로 변환
                .orElse("USER"); // 유저를 찾지 못할 경우 기본값
    }

}
