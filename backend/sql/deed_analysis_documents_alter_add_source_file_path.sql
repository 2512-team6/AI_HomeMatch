-- deed_analysis_documents: 이미지/파일을 images 폴더에 저장하고 DB에는 경로만 저장
-- (기존 source_file_blob 컬럼이 있으면 그대로 두고, source_file_path 추가)

ALTER TABLE deed_analysis_documents
  ADD COLUMN IF NOT EXISTS source_file_path VARCHAR(512) NULL COMMENT 'images 폴더 내 상대 경로' AFTER source_mime_type;
