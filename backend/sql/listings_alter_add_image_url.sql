-- 매물 테이블에 이미지 URL 컬럼 추가 (메인 1개 + 서브 3개)
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(512) NULL COMMENT '매물 메인 이미지 URL' AFTER address,
  ADD COLUMN IF NOT EXISTS sub_image_url_1 VARCHAR(512) NULL COMMENT '서브 이미지 1' AFTER image_url,
  ADD COLUMN IF NOT EXISTS sub_image_url_2 VARCHAR(512) NULL COMMENT '서브 이미지 2' AFTER sub_image_url_1,
  ADD COLUMN IF NOT EXISTS sub_image_url_3 VARCHAR(512) NULL COMMENT '서브 이미지 3' AFTER sub_image_url_2;
