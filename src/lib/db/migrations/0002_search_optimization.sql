-- 검색 성능 최적화를 위한 인덱스 추가
-- 메모 제목 및 내용에 대한 전체 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_title_content_search ON memos USING gin(to_tsvector('korean', title || ' ' || content));

-- 메모 제목에 대한 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_title ON memos (title);

-- 메모 내용에 대한 인덱스
CREATE INDEX IF NOT EXISTS idx_memos_content ON memos USING gin(to_tsvector('korean', content));

-- 사용자별 메모 조회 최적화
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos (user_id);

-- 메모 생성일 및 수정일 인덱스 (정렬 최적화)
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_updated_at ON memos (updated_at DESC);

-- 태그 이름 검색 최적화
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);

-- 메모-태그 관계 조회 최적화
CREATE INDEX IF NOT EXISTS idx_memo_tags_memo_id ON memo_tags (memo_id);
CREATE INDEX IF NOT EXISTS idx_memo_tags_tag_id ON memo_tags (tag_id);

-- 복합 인덱스 (사용자별 + 날짜별 정렬)
CREATE INDEX IF NOT EXISTS idx_memos_user_updated ON memos (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_memos_user_created ON memos (user_id, created_at DESC);

-- 공개 메모 조회 최적화
CREATE INDEX IF NOT EXISTS idx_memos_is_public ON memos (is_public) WHERE is_public = true;

-- 태그별 메모 조회 최적화 (복합 인덱스)
CREATE INDEX IF NOT EXISTS idx_memo_tags_composite ON memo_tags (tag_id, memo_id);

-- 검색 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW search_stats AS
SELECT 
    t.id as tag_id,
    t.name as tag_name,
    COUNT(mt.memo_id) as memo_count,
    COUNT(DISTINCT m.user_id) as user_count
FROM tags t
LEFT JOIN memo_tags mt ON t.id = mt.tag_id
LEFT JOIN memos m ON mt.memo_id = m.id
GROUP BY t.id, t.name
ORDER BY memo_count DESC;

-- 인기 검색어 통계를 위한 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type VARCHAR(20) NOT NULL, -- 'basic', 'semantic', 'advanced'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result_count INTEGER DEFAULT 0
);

-- 검색 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_search_logs_user_id ON search_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING gin(to_tsvector('korean', query));

-- 인기 검색어 뷰
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    AVG(result_count) as avg_results,
    MAX(created_at) as last_searched
FROM search_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 20; 