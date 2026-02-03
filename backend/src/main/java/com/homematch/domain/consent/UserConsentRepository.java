package com.homematch.domain.consent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserConsentRepository extends JpaRepository<UserConsent, Integer> {

    @Query("""
            SELECT uc.consentType
            FROM UserConsent uc
            WHERE uc.user.user_no = :userNo
              AND uc.version = :version
              AND uc.withdrawnAt IS NULL
              AND uc.consentType IN :types
            """)
    List<String> findActiveConsentTypes(
            @Param("userNo") Integer userNo,
            @Param("version") String version,
            @Param("types") List<String> types
    );

    @Query("""
            SELECT uc
            FROM UserConsent uc
            WHERE uc.user.user_no = :userNo
              AND uc.consentType = :type
              AND uc.withdrawnAt IS NULL
            """)
    List<UserConsent> findActiveByUserNoAndType(
            @Param("userNo") Integer userNo,
            @Param("type") String type
    );

    @Query("""
            SELECT uc
            FROM UserConsent uc
            WHERE uc.user.user_no = :userNo
              AND uc.consentType = :type
              AND uc.version = :version
              AND uc.withdrawnAt IS NULL
            ORDER BY uc.agreedAt DESC
            """)
    List<UserConsent> findActiveByUserNoTypeAndVersion(
            @Param("userNo") Integer userNo,
            @Param("type") String type,
            @Param("version") String version
    );

    @Query("""
            SELECT uc
            FROM UserConsent uc
            WHERE uc.user.user_no = :userNo
              AND (:type IS NULL OR uc.consentType = :type)
            ORDER BY uc.agreedAt DESC
            """)
    List<UserConsent> findHistoryByUserNo(
            @Param("userNo") Integer userNo,
            @Param("type") String type
    );
}

