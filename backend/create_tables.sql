--------------- 사용자 테이블 생성 --------------------
/* =========================================================
 * 1. 사용자 정보 테이블
 * ========================================================= */
create table users (
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
CREATE TABLE moveout_checklists (
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
CREATE TABLE deposit_managements (
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
CREATE TABLE moveout_photos (
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
CREATE TABLE dispute_records (
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
CREATE TABLE deposit_return_history (
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
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    rent DECIMAL(15,2) NOT NULL DEFAULT 0,
    maintenance DECIMAL(15,2) NOT NULL DEFAULT 0,
    utilities DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_date TINYINT NOT NULL,
    auto_register BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
    CHECK (payment_date BETWEEN 1 AND 31)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
 * 11. 주거비 기본 설정 (1인 1개)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS monthly_housing_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    year INT NOT NULL,
    month TINYINT NOT NULL,
    rent DECIMAL(15,2) NOT NULL DEFAULT 0,
    maintenance DECIMAL(15,2) NOT NULL DEFAULT 0,
    utilities DECIMAL(15,2) NOT NULL DEFAULT 0,
    payment_date TINYINT NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
    UNIQUE KEY uk_user_year_month (user_id, year, month),
    INDEX idx_user_year_month (user_id, year, month),
    CHECK (month BETWEEN 1 AND 12),
    CHECK (payment_date BETWEEN 1 AND 31)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* =========================================================
 * 12. 입주 상태 사진 기록 테이블
 * ========================================================= */
CREATE TABLE IF NOT EXISTS residency_defect_issues (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    image_url MEDIUMTEXT NOT NULL,
    issue_date DATE NOT NULL,
    status ENUM ('RECEIVED','IN_PROGRESS','COMPLETED','REJECTED')
        NOT NULL DEFAULT 'RECEIVED',
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_no) ON DELETE CASCADE,
    INDEX idx_defect_issue_user_status (user_id, status),
    INDEX idx_defect_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


--------------- 채팅 세션/메시지 테이블 생성 --------------------
/* =========================================================
 * 13. 채팅 세션 (사용자별 대화 세션)
 * ========================================================= */
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_no INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_sessions_user
    FOREIGN KEY (user_no)
        REFERENCES users(user_no)
        ON DELETE CASCADE,
    INDEX idx_user_no (user_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/* =========================================================
 * 14. 세션에 속한 메시지들
 * ========================================================= */
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_session
    FOREIGN KEY (session_id)
        REFERENCES chat_sessions(session_id)
        ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

