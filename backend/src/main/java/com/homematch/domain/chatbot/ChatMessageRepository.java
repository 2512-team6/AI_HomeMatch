package com.homematch.domain.chatbot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    List<ChatMessage> findBySession_SessionIdOrderByCreatedAtAsc(Integer sessionId);

    List<ChatMessage> findBySession_SessionIdOrderByCreatedAtDesc(Integer sessionId);
}
