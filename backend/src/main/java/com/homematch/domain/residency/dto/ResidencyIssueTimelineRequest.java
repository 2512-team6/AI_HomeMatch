package com.homematch.domain.residency.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.homematch.domain.residency.ResidencyIssueTimeline;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResidencyIssueTimelineRequest {

    @JsonAlias({"event_type"})
    private ResidencyIssueTimeline.EventType eventType;

    private String note;
}

