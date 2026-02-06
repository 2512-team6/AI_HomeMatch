package com.homematch.global.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 검증 필터.
 * - 유효한 토큰이면 SecurityContext에 인증 정보 설정.
 * - 만료된 토큰이면 401 + TOKEN_EXPIRED 응답으로 세션 만료 UX를 지원.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String TOKEN_EXPIRED_JSON = "{\"errorCode\":\"TOKEN_EXPIRED\",\"message\":\"로그인 세션이 만료되었습니다. 장시간 활동이 없어 보안을 위해 자동 로그아웃되었습니다. 불편을 드려 죄송합니다. 다시 로그인해 주세요.\"}";

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            if (jwtTokenProvider.validateToken(token)) {
                String email = jwtTokenProvider.getEmail(token);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email, null, List.of()
                        );
                SecurityContextHolder
                        .getContext()
                        .setAuthentication(authentication);
            } else if (jwtTokenProvider.isExpiredToken(token)) {
                // 만료된 토큰인 경우: 401 + 명확한 에러 코드로 클라이언트가 세션 만료 플로우 처리 가능
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(TOKEN_EXPIRED_JSON);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
