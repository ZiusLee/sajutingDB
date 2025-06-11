-- 십성 컬럼 추가 함수
CREATE OR REPLACE FUNCTION add_sibseong_columns()
RETURNS void AS $$
BEGIN
  -- 컬럼이 존재하지 않을 경우에만 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'year_stem_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN year_stem_sibseong VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'month_stem_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN month_stem_sibseong VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'day_stem_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN day_stem_sibseong VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'hour_stem_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN hour_stem_sibseong VARCHAR(10);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'year_branch_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN year_branch_sibseong VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'month_branch_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN month_branch_sibseong VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'day_branch_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN day_branch_sibseong VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'saju_info' AND column_name = 'hour_branch_sibseong') THEN
    ALTER TABLE saju_info ADD COLUMN hour_branch_sibseong VARCHAR(50);
  END IF;
END;
$$ LANGUAGE plpgsql;
