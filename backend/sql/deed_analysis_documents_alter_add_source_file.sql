-- 기존 deed_analysis_documents 테이블에 원본 파일 저장 컬럼 추가
-- (이미 테이블 생성 후 적용하는 ALTER 스크립트)

ALTER TABLE deed_analysis_documents
  ADD COLUMN source_file_blob LONGBLOB NULL AFTER source_mime_type,
  ADD COLUMN source_file_size BIGINT NULL AFTER source_file_blob;

