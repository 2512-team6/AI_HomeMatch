
-- 분쟁조정사례 원문 테이블 생성
CREATE TABLE mediation_cases (
    case_id INT NOT NULL AUTO_INCREMENT COMMENT '내부 고유 ID',

    source_year INT NOT NULL COMMENT '자료 연도 (2021/2022/2023/2025)',
    source_name VARCHAR(300) NOT NULL COMMENT '자료 출처 이름',
    source_doc VARCHAR(300) NOT NULL COMMENT '파일명/문서 식별자',

    page_start INT NOT NULL COMMENT '시작 페이지',
    page_end INT NOT NULL COMMENT '끝 페이지',

    title VARCHAR(500) NOT NULL COMMENT '분쟁 사례 제목',

    facts MEDIUMTEXT NOT NULL COMMENT '사실 관계',
    issues MEDIUMTEXT NULL COMMENT '쟁점',
    related_rules MEDIUMTEXT NULL COMMENT '관련 규정',
    related_precedents MEDIUMTEXT NULL COMMENT '관련 판례',
    result MEDIUMTEXT NULL COMMENT '조정 결과',
    order_text MEDIUMTEXT NULL COMMENT '조정 주문',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시각',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시각',

    PRIMARY KEY (case_id),

    -- 동일 문서 + 페이지 범위 중복 방지
    UNIQUE KEY uq_source_page (source_doc, page_start, page_end),

    -- 조회 편의용 인덱스
    KEY idx_source_year (source_year),
    KEY idx_source_doc (source_doc)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

  
-- 주택임대차 보호법 법률 원문 테이블 생성
  CREATE TABLE law_text (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  source_year INT NOT NULL,                 -- 시행연도
  source_name VARCHAR(200) NOT NULL,        -- 법령명
  source_doc  VARCHAR(255) NOT NULL,        -- 원본 파일명

  page_start INT NOT NULL,                  -- 시작페이지
  page_end   INT NOT NULL,                  -- 끝페이지

  title VARCHAR(255) NOT NULL,              -- 조문 범위/제목
  text  LONGTEXT NOT NULL,                  -- 법률 원문 텍스트

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- 같은 문서/범위를 중복 저장하지 않게(원하면 제거 가능)
  UNIQUE KEY uq_law_doc_pages_title (source_doc, page_start, page_end, title),

  KEY idx_law_name_year (source_name, source_year),
  KEY idx_doc_pages (source_doc, page_start, page_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 판례 원문 테이블
CREATE TABLE IF NOT EXISTS precedents (
  precedent_id        VARCHAR(32)  NOT NULL COMMENT '판례정보일련번호',

  case_name           VARCHAR(255) NOT NULL COMMENT '사건명',
  case_number         VARCHAR(64)  NOT NULL COMMENT '사건번호',

  decision_date       DATE NOT NULL COMMENT '선고일자',
  decision_type       VARCHAR(16)  NULL COMMENT '선고 구분 (선고/자 등)',

  court_name          VARCHAR(100) NULL COMMENT '법원명',
  court_type_code     VARCHAR(32)  NULL COMMENT '법원종류코드',

  case_type_name      VARCHAR(50)  NULL COMMENT '사건종류명',
  case_type_code      VARCHAR(32)  NULL COMMENT '사건종류코드',

  judgment_type       VARCHAR(50)  NULL COMMENT '판결유형 (판결/결정)',

  issues              LONGTEXT NULL COMMENT '판시사항',
  summary             LONGTEXT NULL COMMENT '판결요지',
  referenced_laws     LONGTEXT NULL COMMENT '참조조문',
  referenced_cases    LONGTEXT NULL COMMENT '참조판례',
  full_text           LONGTEXT NULL COMMENT '판례 전문',

  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (precedent_id),

  INDEX idx_decision_date (decision_date),
  INDEX idx_court_name (court_name),
  INDEX idx_case_number (case_number),
  INDEX idx_case_name (case_name)
) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4;