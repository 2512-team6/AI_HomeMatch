
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