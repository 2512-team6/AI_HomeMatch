-- MariaDB 10.6+
-- 등기부등본 분석 결과 저장 테이블 (보관/삭제 포함)

CREATE TABLE IF NOT EXISTS deed_analysis_documents (
  id BIGINT NOT NULL AUTO_INCREMENT,

  user_id INT NOT NULL,

  source_filename VARCHAR(255) NULL,
  source_mime_type VARCHAR(100) NULL,

  extracted_text LONGTEXT NULL,

  -- 파서/LLM 구조화 결과(JSON 문자열)
  structured_json LONGTEXT NULL,
  sections_json LONGTEXT NULL,

  -- 위험 분석 결과(JSON 문자열)
  risk_flags_json LONGTEXT NULL,
  check_items_json LONGTEXT NULL,
  explanation LONGTEXT NULL,

  archived TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_deed_doc_user FOREIGN KEY (user_id) REFERENCES users(user_no)
    ON DELETE CASCADE
);

CREATE INDEX idx_deed_doc_user_created ON deed_analysis_documents (user_id, created_at);
CREATE INDEX idx_deed_doc_user_archived ON deed_analysis_documents (user_id, archived);
CREATE INDEX idx_deed_doc_deleted_at ON deed_analysis_documents (deleted_at);

