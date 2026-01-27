package com.homematch.domain.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageResponse {
    private Long id;
    private String type; // "user" or "bot"
    private String text;
    private LocalDateTime timestamp;
}
