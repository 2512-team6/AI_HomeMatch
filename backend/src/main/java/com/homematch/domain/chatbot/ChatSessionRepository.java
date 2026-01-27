package com.homematch.domain.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Integer> {

    @Query("SELECT s FROM ChatSession s WHERE s.user.user_no = :userNo ORDER BY s.createdAt DESC")
    List<ChatSession> findByUserNoOrderByCreatedAtDesc(@Param("userNo") Integer userNo);

    default Optional<ChatSession> findLatestByUserNo(Integer userNo) {
        return findByUserNoOrderByCreatedAtDesc(userNo).stream().findFirst();
    }
}
