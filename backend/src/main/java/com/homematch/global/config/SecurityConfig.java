package com.homematch.global.config;

import com.homematch.global.jwt.JwtAuthenticationFilter;
import com.homematch.global.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // CORS 설정을 위한 Bean 생성
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. 리액트(Vite)의 주소 허용 (포트 번호 주의: 5173)
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        // 2. 허용할 HTTP 메서드 설정
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 3. 허용할 헤더 설정
        configuration.setAllowedHeaders(List.of("*"));
        // 4. 쿠키나 인증 헤더를 허용할지 여부
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // @Bean
    // public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    //     http
    //         // 1. CORS는 필터 체인 가장 앞단에서 처리되어야 합니다.
    //         .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    //         .csrf(csrf -> csrf.disable())
    //         .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
    //         // 2. HTTP 요청 권한 설정
    //         .authorizeHttpRequests(auth -> auth
    //             // OPTIONS 메서드는 CORS Preflight를 위해 무조건 허용
    //             .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    //             // ⭐️ 경로를 더 구체적으로 지정 (끝에 슬래시가 있거나 없어도 허용하도록)
    //             .requestMatchers("/api/auth/login", "/api/auth/signup", "/api/auth/**").permitAll()
    //             .anyRequest().authenticated()
    //         );
            
    //         // 3. JWT 필터 위치 지정
    //         // .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), 
    //         //                 UsernamePasswordAuthenticationFilter.class)
            
    //         // .formLogin(form -> form.disable())
    //         // .httpBasic(basic -> basic.disable());

    //     return http.build();
    // }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // CSRF 차단 해제
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 모든 요청을 일단 다 허용해서 컨트롤러까지 가는지 확인
                .anyRequest().permitAll() 
            );

        return http.build();
    }
}