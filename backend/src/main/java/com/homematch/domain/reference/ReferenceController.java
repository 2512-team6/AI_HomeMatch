package com.homematch.domain.reference;

import com.homematch.domain.reference.dto.LawTextResponse;
import com.homematch.domain.reference.dto.MediationCaseResponse;
import com.homematch.domain.reference.dto.PrecedentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/references")
public class ReferenceController {

    private final ReferenceService referenceService;

    @GetMapping("/law/{id}")
    public ResponseEntity<LawTextResponse> getLaw(@PathVariable Long id) {
        LawTextResponse res = referenceService.getLawById(id);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @GetMapping("/precedent/{precedentId}")
    public ResponseEntity<PrecedentResponse> getPrecedent(@PathVariable String precedentId) {
        PrecedentResponse res = referenceService.getPrecedentById(precedentId);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @GetMapping("/mediation/{caseId}")
    public ResponseEntity<MediationCaseResponse> getMediation(@PathVariable Integer caseId) {
        MediationCaseResponse res = referenceService.getMediationByCaseId(caseId);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }
}
