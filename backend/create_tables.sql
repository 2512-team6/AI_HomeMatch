-- listings 테이블 생성(매물 찾기)
-- 매물 탐색 및 상세 정보를 통합한 매물 테이블
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
 * 1. 입주 상태 기록 테이블
 * - 입주 시 촬영한 사진과 공간별 상태를 저장
 * ========================================================= */
CREATE TABLE entry_status_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 입주 기록 고유 ID
    user_id INT NOT NULL,                           -- 사용자 ID (users.user_no 참조)
    image_url VARCHAR(500) NOT NULL,                -- 입주 당시 촬영 이미지 URL
    record_type VARCHAR(50) NOT NULL,               -- 공간 유형 (현관, 거실, 주방 등)
    record_date DATE NOT NULL,                      -- 기록 날짜
    description TEXT,                               -- 상태 설명 메모
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP,                -- 수정 시각
    INDEX idx_user_id (user_id),                    -- 사용자 기준 조회 인덱스
    INDEX idx_record_date (record_date),            -- 날짜 기준 조회 인덱스
    FOREIGN KEY (user_id) 
        REFERENCES users(user_no) ON DELETE CASCADE -- 사용자 삭제 시 같이 삭제
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 2. 퇴실 / 원상복구 체크리스트
 * - 퇴실 전 해야 할 필수 항목 관리
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
 * 3. 보증금 관리 테이블
 * - 보증금 정산 / 반환 상태 관리
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
 * 4. 퇴실 전 사진 기록
 * - 퇴실 직전 집 상태 증빙용 사진
 * ========================================================= */
CREATE TABLE moveout_photos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,          -- 사진 ID
    user_id INT NOT NULL,                           -- 사용자 ID
    photo_url VARCHAR(500) NOT NULL,                -- 사진 URL
    photo_type VARCHAR(50),                         -- 사진 유형 (전체, 벽, 바닥 등)
    taken_date DATE NOT NULL,                       -- 촬영 날짜
    description TEXT,                               -- 설명
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 생성 시각
    INDEX idx_user_id (user_id),                    -- 사용자 기준 조회
    INDEX idx_taken_date (taken_date),              -- 촬영일 기준 조회
    FOREIGN KEY (user_id) 
        REFERENCES users(user_no) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


/* =========================================================
 * 5. 분쟁 기록 테이블
 * - 보증금, 시설 훼손 등 분쟁 발생 시 기록
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
 * 6. 보증금 반환 이력 테이블
 * - 내용증명, 지급명령 등 보증금 관련 이벤트 로그
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

