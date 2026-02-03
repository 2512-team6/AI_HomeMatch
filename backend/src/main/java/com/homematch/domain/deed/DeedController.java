package com.homematch.domain.deed;

import com.homematch.domain.deed.dto.ArchiveRequest;
import com.homematch.domain.deed.dto.DeedDocumentDetailResponse;
import com.homematch.domain.deed.dto.DeedDocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/deed")
@RequiredArgsConstructor
public class DeedController {

    private final DeedService deedService;

    @PostMapping("/documents")
    public ResponseEntity<?> analyzeAndSave(
            @RequestHeader("Authorization") String authHeader,
            @RequestPart("file") MultipartFile file
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = deedService.getUserIdFromToken(token);
            DeedDocumentDetailResponse saved = deedService.analyzeAndSave(userNo, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("{\"error\": \"서버 오류: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<List<DeedDocumentResponse>> list(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) Boolean archived
    ) {
        String token = authHeader.replace("Bearer ", "");
        Integer userNo = deedService.getUserIdFromToken(token);
        return ResponseEntity.ok(deedService.list(userNo, archived));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<DeedDocumentDetailResponse> getOne(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id
    ) {
        String token = authHeader.replace("Bearer ", "");
        Integer userNo = deedService.getUserIdFromToken(token);
        return ResponseEntity.ok(deedService.getOne(userNo, id));
    }

    @GetMapping("/documents/{id}/file")
    public ResponseEntity<byte[]> downloadFile(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id
    ) {
        String token = authHeader.replace("Bearer ", "");
        Integer userNo = deedService.getUserIdFromToken(token);
        DeedAnalysisDocument doc = deedService.getEntityForFile(userNo, id);

        byte[] bytes = doc.getSourceFileBlob();
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String mime = doc.getSourceMimeType() != null ? doc.getSourceMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String filename = doc.getSourceFilename() != null ? doc.getSourceFilename() : ("deed_document_" + id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(mime))
                .body(bytes);
    }

    @PatchMapping("/documents/{id}")
    public ResponseEntity<?> archive(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody ArchiveRequest req
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = deedService.getUserIdFromToken(token);
            boolean archived = req.getArchived() != null && req.getArchived();
            deedService.setArchived(userNo, id, archived);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Integer userNo = deedService.getUserIdFromToken(token);
            deedService.delete(userNo, id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}

