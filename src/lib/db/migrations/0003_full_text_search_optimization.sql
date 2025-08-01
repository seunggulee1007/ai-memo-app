-- 전문 검색 최적화 마이그레이션
-- 메모 제목과 내용에 대한 전문 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_title_content_fts ON memos 
USING gin(to_tsvector('korean', title || ' ' || content));

-- 제목만에 대한 전문 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_title_fts ON memos 
USING gin(to_tsvector('korean', title));

-- 내용만에 대한 전문 검색 인덱스  
CREATE INDEX IF NOT EXISTS idx_memos_content_fts ON memos 
USING gin(to_tsvector('korean', content));

-- 태그 이름에 대한 전문 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_tags_name_fts ON tags 
USING gin(to_tsvector('korean', name));

-- 일반 인덱스들 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos(user_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at);
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON memos(updated_at);
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo_id ON memo_tags(memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag_id ON memo_tags(tag_id);

-- 한국어 형태소 분석기 활성화
CREATE EXTENSION IF NOT EXISTS unaccent; 