package com.homematch.domain.chatbot.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotMessageRequest {
    private String text;
    /** 주제: contract_review, deed_analysis, residency, moveout */
    private String topic;
}
