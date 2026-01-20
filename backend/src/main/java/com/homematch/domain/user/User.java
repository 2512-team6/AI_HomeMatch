package com.homematch.domain.user;

import java.time.LocalDateTime;

// import javax.management.relation.Role;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int user_no;

    @Column(nullable = false, unique = true, length = 50)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = true, length = 30)
    private String phone;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false, name = "updated_at")
    private LocalDateTime updated_at;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    public void encodePassword(String email, String password, Role role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }
}
