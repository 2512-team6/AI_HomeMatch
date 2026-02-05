--------------- 사용자 테이블 생성 --------------------
/* =========================================================
 * 1. 사용자 정보 테이블
 * ========================================================= */
create table IF NOT EXISTS users (
    user_no int auto_increment primary key,
    email varchar(255) unique not null,
    password varchar(255) not null,
    name varchar(255) NOT NULL,
    role varchar(30) not NULL,
    phone varchar(30),
    nickname varchar(30) NOT NULL,
    updated_at datetime NOT NULL
);


--------------- 매물 테이블 생성 --------------------
/* =========================================================
 * 2. 매물 정보 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS listings (
    listing_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '매물 ID',
    owner VARCHAR(100) NOT NULL COMMENT '임대인',
    title VARCHAR(200) NOT NULL COMMENT '매물 제목',
    address VARCHAR(200) NOT NULL COMMENT '주소',
    image_url VARCHAR(512) NULL COMMENT '매물 메인 이미지 URL',
    sub_image_url_1 VARCHAR(512) NULL COMMENT '서브 이미지 1',
    sub_image_url_2 VARCHAR(512) NULL COMMENT '서브 이미지 2',
    sub_image_url_3 VARCHAR(512) NULL COMMENT '서브 이미지 3',
    lat DECIMAL(10, 7) NULL COMMENT '위도',
    lng DECIMAL(10, 7) NULL COMMENT '경도',
    price_deposit BIGINT NOT NULL COMMENT '보증금',
    lease_type VARCHAR(20) NOT NULL COMMENT '월/전세 구분',
    price_rent BIGINT NULL COMMENT '월세 금액',
    m_cost BIGINT NULL COMMENT '관리비',
    area_m2 DECIMAL(10, 2) NOT NULL COMMENT '전용면적',
    built_year INT NULL COMMENT '건축연도',
    floor INT NULL COMMENT '층수',
    floor_building INT NULL COMMENT '건물 총 층수',
    rooms INT NULL COMMENT '방 개수',
    bathrooms INT NULL COMMENT '욕실 갯수',
    parking BOOLEAN NULL DEFAULT FALSE COMMENT '주차 가능 여부',
    move_in_date DATE NULL COMMENT '입주가능일',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    
    INDEX idx_address (address),
    INDEX idx_lease_type (lease_type),
    INDEX idx_price_deposit (price_deposit),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='매물 정보 테이블';

--------------- 퇴실관리 테이블 생성 --------------------
/* =========================================================
 * 3. 입주 상태 사진 기록 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS entry_status_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    image_url MEDIUMTEXT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
    INDEX idx_entry_status_user (user_id),
    INDEX idx_entry_status_user_type (user_id, record_type),
    INDEX idx_entry_status_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


/* =========================================================
 * 4. 퇴실 전 해야 할 필수 항목 관리 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS moveout_checklists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 체크리스트 항목 ID
    user_id INT NOT NULL,                           -- 사용자 ID
    checklist_type VARCHAR(20) NOT NULL,            -- 체크리스트 유형 (MOVE_OUT, RESTORATION)
    item_name VARCHAR(100) NOT NULL,                -- 체크 항목 이름
    is_completed BOOLEAN DEFAULT FALSE,             -- 완료 여부
    completed_at TIMESTAMP NULL,                    -- 완료 시각
    notes TEXT,                                     -- 메모
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,                -- 수정 시각
    INDEX idx_user_id (user_id),                    -- 사용자 기준 조회
    INDEX idx_checklist_type (checklist_type),      -- 체크리스트 유형별 조회
    FOREIGN KEY (user_id) 
        REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



/* =========================================================
 * 5. 보증금 정산 / 반환 상태 관리 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS deposit_managements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 보증금 관리 ID
    user_id INT NOT NULL,                           -- 사용자 ID
    deposit_amount DECIMAL(15,2) NOT NULL,          -- 보증금 총액
    moveout_date DATE NOT NULL,                     -- 퇴실일
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 상태 (PENDING, RETURNED 등)
    expected_return_date DATE,                      -- 예상 반환일
    actual_return_date DATE,                        -- 실제 반환일
    returned_amount DECIMAL(15,2),                  -- 실제 반환 금액
    deduction_amount DECIMAL(15,2) DEFAULT 0,       -- 공제 금액
    deduction_reason TEXT,                          -- 공제 사유
    notes TEXT,                                     -- 추가 메모
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,                -- 수정 시각
    INDEX idx_user_id (user_id),                    -- 사용자 기준 조회
    INDEX idx_status (status),                      -- 상태 기준 조회
    INDEX idx_moveout_date (moveout_date),          -- 퇴실일 기준 조회
    FOREIGN KEY (user_id) 
        REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 6. 퇴실 직전 집 상태 증빙용 사진 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS moveout_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(50),
    taken_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_taken_date (taken_date),
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 7. 보증금, 시설 훼손 등 분쟁 발생 시 기록
 * ========================================================= */
CREATE TABLE IF NOT EXISTS dispute_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 분쟁 기록 ID
    user_id INT NOT NULL,                           -- 사용자 ID
    dispute_type VARCHAR(50) NOT NULL,              -- 분쟁 유형
    dispute_date DATE NOT NULL,                     -- 분쟁 발생일
    description TEXT NOT NULL,                      -- 분쟁 상세 내용
    status VARCHAR(20) DEFAULT 'PENDING',           -- 상태 (PENDING, RESOLVED 등)
    resolution TEXT,                                -- 해결 내용
    related_photos JSON,                            -- 관련 사진 ID 목록(JSON)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,                -- 수정 시각
    INDEX idx_user_id (user_id),                    -- 사용자 기준 조회
    INDEX idx_dispute_type (dispute_type),          -- 분쟁 유형 기준 조회
    INDEX idx_status (status),                      -- 상태 기준 조회
    FOREIGN KEY (user_id) 
        REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 8. 내용증명, 지급명령 등 보증금 관련 이벤트 로그
 * ========================================================= */
CREATE TABLE IF NOT EXISTS deposit_return_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 이력 ID
    deposit_management_id BIGINT NOT NULL,          -- 보증금 관리 ID
    action_type VARCHAR(50) NOT NULL,               -- 액션 유형 (NOTICE_SENT 등)
    action_date DATE NOT NULL,                      -- 액션 발생일
    description TEXT,                               -- 상세 설명
    document_url VARCHAR(500),                      -- 관련 문서 URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    INDEX idx_deposit_management_id (deposit_management_id),
    INDEX idx_action_date (action_date),
    FOREIGN KEY (deposit_management_id)
        REFERENCES deposit_managements(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--------------- 입주관리 테이블 생성 --------------------
/* =========================================================
 * 9. 거주계약기간 설정 저장 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS housing_contracts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE COMMENT '사용자 ID (users.user_no 참조, 1인당 1개만 존재)',
    contract_start_date DATE NOT NULL COMMENT '계약 시작일 (입주일)',
    contract_end_date DATE NOT NULL COMMENT '계약 종료일 (거주 마감일)',
    contract_duration_months INT COMMENT '계약 기간 (월 단위, 예: 12개월, 6개월)',
    notes TEXT COMMENT '계약 관련 메모',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_contract_start_date (contract_start_date),
    INDEX idx_contract_end_date (contract_end_date),
    CONSTRAINT chk_contract_dates CHECK (contract_end_date > contract_start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
 * 10. 주거비 기본 설정 (1인 1개)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS housing_cost_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                    -- 기본키: 설정 고유 ID (자동 증가)
    user_id INT NOT NULL UNIQUE,                             -- 사용자 ID (users 테이블 참조, 1인 1개 설정)
    rent DECIMAL(15,2) NOT NULL DEFAULT 0,                   -- 월세/전세금 (기본값: 0원)
    maintenance DECIMAL(15,2) NOT NULL DEFAULT 0,            -- 관리비 (기본값: 0원)
    utilities DECIMAL(15,2) NOT NULL DEFAULT 0,              -- 공과금 (전기, 가스, 수도 등, 기본값: 0원)
    payment_date TINYINT NOT NULL,                           -- 납부일 (1~31일 사이, 매월 주거비 납부일)
    auto_register BOOLEAN NOT NULL DEFAULT FALSE,             -- 자동 등록 여부 (매월 자동으로 주거비 기록 생성 여부)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- 생성일시 (레코드 생성 시 자동 설정)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 수정일시 (레코드 수정 시 자동 갱신)
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,  -- 사용자 삭제 시 설정도 함께 삭제
    CHECK (payment_date BETWEEN 1 AND 31)                    -- 납부일은 1일~31일 사이만 허용
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
 * 11. 월별 주거비 기록 (사용자별 월별 주거비 내역)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS monthly_housing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                    -- 기본키: 기록 고유 ID (자동 증가)
    user_id INT NOT NULL,                                     -- 사용자 ID (users 테이블 참조)
    year INT NOT NULL,                                        -- 연도 (예: 2024)
    month TINYINT NOT NULL,                                   -- 월 (1~12, CHECK 제약으로 검증)
    rent DECIMAL(15,2) NOT NULL DEFAULT 0,                   -- 월세/전세금 (기본값: 0원)
    maintenance DECIMAL(15,2) NOT NULL DEFAULT 0,            -- 관리비 (기본값: 0원)
    utilities DECIMAL(15,2) NOT NULL DEFAULT 0,              -- 공과금 (전기, 가스, 수도 등, 기본값: 0원)
    payment_date TINYINT NOT NULL,                           -- 납부일 (1~31일 사이, CHECK 제약으로 검증)
    paid BOOLEAN NOT NULL DEFAULT FALSE,                      -- 납부 여부 (기본값: 미납부)
    paid_at TIMESTAMP NULL,                                   -- 납부 일시 (납부 완료 시 기록)
    notes TEXT,                                               -- 메모/비고 (추가 정보 기록용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- 생성일시 (레코드 생성 시 자동 설정)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 수정일시 (레코드 수정 시 자동 갱신)
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,  -- 사용자 삭제 시 기록도 함께 삭제
    UNIQUE KEY uk_user_year_month (user_id, year, month),    -- 사용자별 연도+월 조합은 유일 (중복 방지)
    INDEX idx_user_year_month (user_id, year, month),        -- 사용자별 연도+월 조회 성능 최적화 인덱스
    CHECK (month BETWEEN 1 AND 12),                          -- 월은 1월~12월만 허용
    CHECK (payment_date BETWEEN 1 AND 31)                     -- 납부일은 1일~31일만 허용
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
 * 12. 입주 상태 사진 기록 테이블 (하자 신고/입주 상태 기록)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS residency_defect_issues (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,                    -- 기본키: 이슈 고유 ID (자동 증가)
    user_id INT NOT NULL,                                     -- 사용자 ID (users 테이블 참조)
    title VARCHAR(200) NOT NULL,                              -- 제목 (하자/이슈 제목, 최대 200자)
    image_url MEDIUMTEXT NOT NULL,                            -- 이미지 URL (하자 사진 경로, MEDIUMTEXT 타입)
    issue_date DATE NOT NULL,                                 -- 이슈 발생일/신고일 (날짜)
    status ENUM ('RECEIVED','IN_PROGRESS','COMPLETED','REJECTED')
        NOT NULL DEFAULT 'RECEIVED',                          -- 처리 상태 (접수/진행중/완료/거부, 기본값: 접수)
    memo TEXT,                                                -- 메모 (추가 설명/내용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,          -- 생성일시 (레코드 생성 시 자동 설정)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- 수정일시 (레코드 수정 시 자동 갱신)
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,  -- 사용자 삭제 시 이슈도 함께 삭제
    INDEX idx_defect_issue_user_status (user_id, status),    -- 사용자별 상태 조회 성능 최적화 인덱스
    INDEX idx_defect_issue_date (issue_date)                  -- 날짜별 조회 성능 최적화 인덱스
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--------------- 채팅 세션/메시지 테이블 생성 --------------------
/* =========================================================
 * 13. 채팅 세션 (사용자별 대화 세션)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,                -- 기본키: 세션 고유 ID (자동 증가)
    user_no INT NOT NULL,                                     -- 사용자 번호 (users 테이블 참조)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            -- 생성일시 (세션 생성 시 자동 설정)
    CONSTRAINT fk_chat_sessions_user
    FOREIGN KEY (user_no)
        REFERENCES users(user_no)
        ON DELETE CASCADE,                                    -- 사용자 삭제 시 세션도 함께 삭제
    INDEX idx_user_no (user_no)                               -- 사용자별 세션 조회 성능 최적화 인덱스
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
 * 14. 세션에 속한 메시지들 (채팅 메시지)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,                -- 기본키: 메시지 고유 ID (자동 증가)
    session_id INT NOT NULL,                                  -- 세션 ID (chat_sessions 테이블 참조)
    role VARCHAR(20) NOT NULL,                                -- 역할 (예: 'user', 'assistant', 'system' 등)
    content TEXT NOT NULL,                                    -- 메시지 내용 (채팅 메시지 본문)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            -- 생성일시 (메시지 생성 시 자동 설정)
    CONSTRAINT fk_chat_messages_session
    FOREIGN KEY (session_id)
        REFERENCES chat_sessions(session_id)
        ON DELETE CASCADE,                                    -- 세션 삭제 시 메시지도 함께 삭제
    INDEX idx_session_id (session_id),                        -- 세션별 메시지 조회 성능 최적화 인덱스
    INDEX idx_created_at (created_at)                         -- 시간순 정렬 조회 성능 최적화 인덱스
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
 * 15. 등기부등본 분석 결과 저장 테이블 (보관/삭제 포함)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS deed_analysis_documents (
  id BIGINT NOT NULL AUTO_INCREMENT,

  user_id INT NOT NULL,

  source_filename VARCHAR(255) NULL,
  source_mime_type VARCHAR(100) NULL,
  source_file_path VARCHAR(512) NULL COMMENT 'images 폴더 내 상대 경로',

  extracted_text LONGTEXT NULL,

  structured_json LONGTEXT NULL,
  sections_json LONGTEXT NULL,

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


/* =========================================================
 * 16. 문서처리 동의 사항 저장 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS user_consents (
    consent_id INT AUTO_INCREMENT PRIMARY KEY,   -- 동의 이력 ID
    user_no INT NOT NULL,                         -- 사용자 번호 (users.user_no FK)

    consent_type VARCHAR(50) NOT NULL,            -- 동의 유형 (TERMS, PRIVACY, DATA_STORE, DISCLAIMER)
    consent_content TEXT NOT NULL,                -- 동의 문서 내용
    content_hash CHAR(64) NOT NULL,               -- 동의 문서 변경 여부 확인용 값 (SHA-256)

    version VARCHAR(20) NOT NULL,                 -- 약관/동의 버전

    agreed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- 동의 시점
    withdrawn_at DATETIME NULL,                   -- 철회 시점 (NULL = 현재 유효)

    CONSTRAINT fk_user_consents_user
        FOREIGN KEY (user_no)
        REFERENCES users(user_no)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 매물찾기 더미 데이터 넣기
 * ========================================================= */
INSERT INTO listings (
    owner, title, address, lat, lng, price_deposit, lease_type, price_rent, m_cost, 
    area_m2, built_year, floor, floor_building, rooms, bathrooms, parking, move_in_date
) VALUES
('홍길동', '강남역 도보 5분 원룸', '서울시 강남구 역삼동 123-45', 37.5000, 127.0360, 250000000, '전세', NULL, 50000, 33.00, 2020, 5, 10, 1, 1, TRUE, '2024-07-01'),
('김철수', '반포동 고급 아파트', '서울시 서초구 반포동 456-78', 37.5040, 127.0020, 100000000, '월세', 1000000, 150000, 84.00, 2015, 15, 20, 3, 2, TRUE, '2024-08-01'),
('이영희', '여의도 오피스텔', '서울시 영등포구 여의도동 789-12', 37.5260, 126.9250, 180000000, '전세', NULL, 80000, 45.00, 2018, 12, 15, 2, 1, FALSE, '2024-06-15'),
('박민수', '홍대입구 근처 원룸', '서울시 마포구 홍익동 234-56', 37.5560, 126.9230, 150000000, '월세', 800000, 60000, 28.00, 2019, 3, 5, 1, 1, TRUE, '2024-07-20'),
('최지영', '잠실 신축 아파트', '서울시 송파구 잠실동 345-67', 37.5130, 127.1020, 300000000, '전세', NULL, 200000, 95.00, 2022, 8, 12, 4, 2, TRUE, '2024-09-01'),
('오세훈', '구로디지털단지 인근 원룸', '서울시 구로구 구로동 1123-4', 37.4843211, 126.8976543, 120000000, '월세', 650000, 50000, 29.50, 2018, 6, 12, 1, 1, FALSE, '2024-07-05');

/* =========================================================
 * 17. 계약서 기본정보 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS contracts (
  contract_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, -- 문서 ID
  user_id            BIGINT UNSIGNED NOT NULL,                             -- 사용자 ID
  file_name          VARCHAR(255) NULL,                                    -- 파일 명 (현재 null 가능)
  mime_type          VARCHAR(100) NULL,                                    -- MIME 타입
  file_size_bytes    BIGINT NULL,                                          -- 파일 크기
  uploaded_at        DATETIME NULL,                                        -- 업로드 일시
  contract_alias     VARCHAR(100) NOT NULL,                                -- 계약서 별명 (테스트 입력)
  special_term_count INT NOT NULL DEFAULT 0,                               -- 특약사항 갯수
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_contracts_user_id (user_id),
  KEY idx_contracts_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 18. 특약사항 분석 결과 테이블
 * - level: 애플리케이션 ContractLevel enum과 동일 (SAFE, NEEDS_UNDERSTANDING, NEEDS_REVIEW)
 * - clause_text: NOT NULL, 빈 문자열 허용 (null 전달 시 애플리케이션에서 ''로 저장)
 * - (contract_id, clause_index): 동일 계약 재저장 시 기존 행 삭제 후 삽입
 * ========================================================= */
CREATE TABLE IF NOT EXISTS clause_analysis_results (
  clause_analysis_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  contract_id        BIGINT UNSIGNED NOT NULL,
  clause_index       INT NOT NULL,
  clause_text        LONGTEXT NOT NULL,
  level              ENUM('SAFE','NEEDS_UNDERSTANDING','NEEDS_REVIEW') NOT NULL,
  conclusion         TEXT NULL,
  risk_points        JSON NULL,
  mediation_summaries TEXT NULL,
  mediation_case_ids  JSON NULL,
  precedent_summaries TEXT NULL,
  precedent_case_ids  JSON NULL,
  precedent_evidence  JSON NULL,
  law_summaries       TEXT NULL,
  law_ids             JSON NULL,
  recommended_clause_text LONGTEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_clause_contract_idx (contract_id, clause_index),
  KEY idx_clause_contract_id (contract_id),
  KEY idx_clause_level (level),
  CONSTRAINT fk_clause_contract
    FOREIGN KEY (contract_id) REFERENCES contracts(contract_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
